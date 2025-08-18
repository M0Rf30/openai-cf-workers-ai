/**
 * Rate Limiting Utilities for Cloudflare Workers AI API
 *
 * Provides distributed rate limiting using Durable Objects to track requests
 * across multiple instances. Supports both IP-based and API key-based rate limiting.
 */

/**
 * Get rate limit identifier from request
 * @param {Request} request - The incoming request
 * @param {Object} env - Environment variables
 * @returns {string} Rate limit identifier (api:key or ip:address)
 */
export function getRateLimitIdentifier(request, _env) {
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
 * @param {Object} env - Environment variables with RATE_LIMITER binding
 * @param {number} limit - Request limit per window (default: 100)
 * @param {number} windowMs - Time window in milliseconds (default: 1 hour)
 * @returns {Promise<Response|null>} Rate limit response or null if allowed
 */
export async function rateLimitMiddleware(request, env, limit = 100, windowMs = 3600000) {
	// Rate limiting is optional - only active if RATE_LIMITER binding is configured
	if (!env.RATE_LIMITER) {
		return null;
	}

	const identifier = getRateLimitIdentifier(request, env);

	try {
		// Check rate limit using Durable Object
		const rateLimiterId = env.RATE_LIMITER.idFromName(identifier);
		const rateLimiter = env.RATE_LIMITER.get(rateLimiterId);

		const response = await rateLimiter.fetch('http://localhost/check', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ identifier, limit, windowMs }),
		});

		const result = await response.json();

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
				},
			);
		}

		return null; // Allow request
	} catch (error) {
		console.error('Rate limiting error:', error);
		// If rate limiting fails, allow the request to proceed
		return null;
	}
}
