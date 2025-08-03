/**
 * Check rate limit using Durable Objects
 * @param {DurableObjectNamespace} rateLimiterBinding - The rate limiter binding
 * @param {string} identifier - Unique identifier (IP, API key, etc.)
 * @param {number} limit - Request limit per window
 * @param {number} windowMs - Time window in milliseconds
 * @returns {Promise<Object>} Rate limit result
 */
export async function checkRateLimit(
	rateLimiterBinding,
	identifier,
	limit = 100,
	windowMs = 3600000
) {
	// Use a stable ID for the rate limiter based on identifier
	const rateLimiterId = rateLimiterBinding.idFromName(identifier);
	const rateLimiter = rateLimiterBinding.get(rateLimiterId);

	const response = await rateLimiter.fetch('http://localhost/check', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ identifier, limit, windowMs }),
	});

	return response.json();
}

/**
 * Get rate limit identifier from request
 * @param {Request} request - The incoming request
 * @param {Object} env - Environment variables
 * @returns {string} Rate limit identifier
 */
export function getRateLimitIdentifier(request, env) {
	// Check for API key first
	const apiKey = request.headers.get('Authorization')?.replace('Bearer ', '');
	if (apiKey) {
		return `api:${apiKey}`;
	}

	// Fallback to IP address
	const clientIP =
		request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown';
	return `ip:${clientIP}`;
}

/**
 * Rate limiting middleware
 * @param {Request} request - The incoming request
 * @param {Object} env - Environment variables
 * @param {number} limit - Request limit per window
 * @param {number} windowMs - Time window in milliseconds
 * @returns {Promise<Response|null>} Rate limit response or null if allowed
 */
export async function rateLimitMiddleware(request, env, limit = 100, windowMs = 3600000) {
	if (!env.RATE_LIMITER) {
		// Rate limiting not configured, allow request
		return null;
	}

	const identifier = getRateLimitIdentifier(request, env);
	const result = await checkRateLimit(env.RATE_LIMITER, identifier, limit, windowMs);

	if (!result.allowed) {
		return Response.json(
			{
				error: {
					message: 'Rate limit exceeded. Please try again later.',
					type: 'rate_limit_error',
					code: 'rate_limit_exceeded',
				},
			},
			{
				status: 429,
				headers: {
					'Retry-After': result.retryAfter.toString(),
					'X-RateLimit-Limit': result.limit.toString(),
					'X-RateLimit-Remaining': result.remaining.toString(),
					'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString(),
				},
			}
		);
	}

	return null; // Allow request
}
