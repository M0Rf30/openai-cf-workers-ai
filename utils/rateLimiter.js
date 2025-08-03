/**
 * Durable Object for distributed rate limiting
 */
export class RateLimiter {
	constructor(state, env) {
		this.state = state;
		this.storage = state.storage;
		this.env = env;
	}

	async fetch(request) {
		const url = new URL(request.url);
		const method = request.method;

		if (method === 'POST' && url.pathname === '/check') {
			return this.checkRateLimit(request);
		}

		return new Response('Not Found', { status: 404 });
	}

	async checkRateLimit(request) {
		try {
			const body = await request.json();
			const { identifier, limit = 100, windowMs = 3600000 } = body; // Default: 100 requests per hour

			if (!identifier) {
				return Response.json({ error: 'Identifier required' }, { status: 400 });
			}

			const now = Date.now();
			const windowStart = now - windowMs;

			// Get existing requests within the window
			const requestsKey = `requests:${identifier}`;
			const existingRequests = (await this.storage.get(requestsKey)) || [];

			// Filter out requests outside the current window
			const validRequests = existingRequests.filter(timestamp => timestamp > windowStart);

			// Check if limit exceeded
			if (validRequests.length >= limit) {
				const oldestRequest = Math.min(...validRequests);
				const resetTime = oldestRequest + windowMs;
				const retryAfter = Math.ceil((resetTime - now) / 1000);

				return Response.json(
					{
						allowed: false,
						limit,
						remaining: 0,
						resetTime,
						retryAfter,
					},
					{
						status: 429,
						headers: {
							'Retry-After': retryAfter.toString(),
							'X-RateLimit-Limit': limit.toString(),
							'X-RateLimit-Remaining': '0',
							'X-RateLimit-Reset': Math.ceil(resetTime / 1000).toString(),
						},
					}
				);
			}

			// Add current request
			validRequests.push(now);
			await this.storage.put(requestsKey, validRequests);

			// Set alarm to clean up old data
			const nextCleanup = now + windowMs;
			await this.state.storage.setAlarm(nextCleanup);

			return Response.json(
				{
					allowed: true,
					limit,
					remaining: limit - validRequests.length,
					resetTime: windowStart + windowMs,
					retryAfter: 0,
				},
				{
					headers: {
						'X-RateLimit-Limit': limit.toString(),
						'X-RateLimit-Remaining': (limit - validRequests.length).toString(),
						'X-RateLimit-Reset': Math.ceil((windowStart + windowMs) / 1000).toString(),
					},
				}
			);
		} catch (error) {
			console.error('Rate limiting error:', error);
			return Response.json({ error: 'Internal server error' }, { status: 500 });
		}
	}

	async alarm() {
		// Clean up old request data
		const now = Date.now();
		const keys = await this.storage.list();

		for (const [key, value] of keys) {
			if (key.startsWith('requests:')) {
				// Keep only requests from the last 2 hours to be safe
				const recentRequests = value.filter(timestamp => timestamp > now - 7200000);
				if (recentRequests.length !== value.length) {
					if (recentRequests.length === 0) {
						await this.storage.delete(key);
					} else {
						await this.storage.put(key, recentRequests);
					}
				}
			}
		}
	}
}
