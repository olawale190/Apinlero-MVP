/**
 * Simple Rate Limiter for Edge Functions
 *
 * Uses in-memory storage with sliding window algorithm
 * Note: For production with multiple Edge Function instances,
 * consider using Redis or Supabase for shared state
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limits
// Key format: `${identifier}:${endpoint}`
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries periodically (every 5 minutes)
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupExpired() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;

  lastCleanup = now;
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Rate limit configuration for different endpoints
 */
export const RATE_LIMITS = {
  // Payment operations - more restrictive
  'create-payment-intent': { requests: 10, windowMs: 60 * 1000 }, // 10 per minute
  'save-stripe-config': { requests: 5, windowMs: 60 * 1000 },     // 5 per minute
  'test-stripe-connection': { requests: 5, windowMs: 60 * 1000 }, // 5 per minute

  // Webhook - needs higher limit for Stripe events
  'stripe-webhook': { requests: 100, windowMs: 60 * 1000 },       // 100 per minute

  // Order verification - moderate limit
  'verify-order-total': { requests: 30, windowMs: 60 * 1000 },    // 30 per minute

  // Default for unknown endpoints
  'default': { requests: 20, windowMs: 60 * 1000 },               // 20 per minute
};

/**
 * Check if a request should be rate limited
 *
 * @param identifier - Unique identifier (e.g., IP address, user ID, business ID)
 * @param endpoint - The endpoint name for looking up limits
 * @returns Object with allowed boolean and retry-after seconds if limited
 */
export function checkRateLimit(
  identifier: string,
  endpoint: string
): { allowed: boolean; retryAfter?: number; remaining: number } {
  cleanupExpired();

  const config = RATE_LIMITS[endpoint as keyof typeof RATE_LIMITS] || RATE_LIMITS.default;
  const key = `${identifier}:${endpoint}`;
  const now = Date.now();

  let entry = rateLimitStore.get(key);

  // If no entry or window has passed, create new entry
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    rateLimitStore.set(key, entry);
    return { allowed: true, remaining: config.requests - 1 };
  }

  // Increment counter
  entry.count++;

  // Check if over limit
  if (entry.count > config.requests) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    return {
      allowed: false,
      retryAfter,
      remaining: 0,
    };
  }

  return {
    allowed: true,
    remaining: config.requests - entry.count,
  };
}

/**
 * Create rate limit response headers
 */
export function getRateLimitHeaders(
  endpoint: string,
  remaining: number,
  retryAfter?: number
): Record<string, string> {
  const config = RATE_LIMITS[endpoint as keyof typeof RATE_LIMITS] || RATE_LIMITS.default;

  const headers: Record<string, string> = {
    'X-RateLimit-Limit': config.requests.toString(),
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Window': `${config.windowMs / 1000}s`,
  };

  if (retryAfter !== undefined) {
    headers['Retry-After'] = retryAfter.toString();
  }

  return headers;
}

/**
 * Get client identifier from request
 * Uses various headers to identify the client
 */
export function getClientIdentifier(req: Request): string {
  // Try to get real IP from various headers (in order of preference)
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // Take the first IP in the chain (original client)
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  const cfConnectingIp = req.headers.get('cf-connecting-ip');
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  // Fallback: use a hash of user agent + some request info
  const userAgent = req.headers.get('user-agent') || 'unknown';
  return `ua:${userAgent.slice(0, 50)}`;
}

/**
 * Middleware-style rate limit check that returns a Response if limited
 *
 * @param req - The incoming request
 * @param endpoint - The endpoint name
 * @param corsHeaders - CORS headers to include in response
 * @returns Response if rate limited, null if allowed
 */
export function rateLimitMiddleware(
  req: Request,
  endpoint: string,
  corsHeaders: Record<string, string>
): Response | null {
  const identifier = getClientIdentifier(req);
  const { allowed, retryAfter, remaining } = checkRateLimit(identifier, endpoint);

  if (!allowed) {
    console.warn(`Rate limit exceeded: ${identifier} on ${endpoint}`);

    return new Response(
      JSON.stringify({
        error: 'Too many requests. Please try again later.',
        retryAfter,
      }),
      {
        status: 429,
        headers: {
          ...corsHeaders,
          ...getRateLimitHeaders(endpoint, remaining, retryAfter),
          'Content-Type': 'application/json',
        },
      }
    );
  }

  return null;
}
