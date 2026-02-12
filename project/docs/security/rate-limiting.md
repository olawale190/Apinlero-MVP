# Rate Limiting

> **Status:** ✅ Active in Production
> **File:** `supabase/functions/_shared/rate-limiter.ts`

## Overview

Rate limiting protects sensitive endpoints from abuse, brute force attacks, and accidental overload.

## Configuration

| Parameter | Value | Description |
|-----------|-------|-------------|
| Requests per window | 5 | Maximum requests allowed |
| Window duration | 60 seconds | Time window for counting |
| Identifier | Client IP | How requests are grouped |

## Protected Endpoints

| Endpoint | Rate Limit | Purpose |
|----------|------------|---------|
| `save-stripe-config` | 5/min | Prevent key enumeration |
| `test-stripe-connection` | 5/min | Prevent API abuse |
| `create-payment-intent` | 5/min | Prevent payment spam |

## Implementation

### Usage in Edge Functions

```typescript
import { checkRateLimit, RateLimitError } from '../_shared/rate-limiter.ts';

// In your handler:
const clientIP = req.headers.get('x-forwarded-for') || 'unknown';
const rateLimitKey = `stripe-config:${clientIP}`;

const rateLimit = await checkRateLimit(rateLimitKey);
if (!rateLimit.allowed) {
  return new Response(JSON.stringify({
    error: 'Too many requests',
    retryAfter: rateLimit.retryAfter
  }), {
    status: 429,
    headers: { 'Retry-After': String(rateLimit.retryAfter) }
  });
}
```

### Response Format

When rate limited:

```json
{
  "error": "Too many requests",
  "retryAfter": 45
}
```

HTTP Headers:
- `Status: 429 Too Many Requests`
- `Retry-After: 45`

## How It Works

```
Request arrives
      │
      ▼
┌─────────────────────────────┐
│ Extract client IP           │
│ from x-forwarded-for        │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│ Check in-memory store       │
│ Key: endpoint:ip            │
└──────────────┬──────────────┘
               │
       ┌───────┴───────┐
       │               │
       ▼               ▼
   Under limit     Over limit
       │               │
       ▼               ▼
   Increment       Return 429
   counter         with Retry-After
       │
       ▼
   Process request
```

## Storage

Rate limit counters are stored in-memory within each Edge Function instance. This means:

**Pros:**
- Fast lookups
- No external dependencies
- Low latency

**Cons:**
- Resets when function cold starts
- Not shared across instances

For production scale, consider:
- Supabase table-based storage
- Redis/Upstash integration
- Cloudflare rate limiting

## Customization

To modify rate limits, edit `rate-limiter.ts`:

```typescript
const RATE_LIMIT_CONFIG = {
  maxRequests: 5,        // Increase for higher throughput
  windowMs: 60 * 1000,   // Change window duration
};
```

## Bypass for Testing

In development, you can temporarily bypass rate limiting:

```typescript
// Add to your function (remove in production!)
if (Deno.env.get('BYPASS_RATE_LIMIT') === 'true') {
  // Skip rate limit check
}
```

## Monitoring

Check rate limit hits in Edge Function logs:
1. Go to Supabase Dashboard
2. Navigate to Edge Functions
3. Select function → Logs
4. Filter for "rate limit" or "429"

## Security Notes

1. **IP Spoofing** - `x-forwarded-for` can be spoofed. For critical endpoints, consider additional identifiers.

2. **Distributed Attacks** - In-memory limits don't protect against distributed attacks. Use Cloudflare or similar for DDoS protection.

3. **Legitimate Users** - Set limits high enough to not impact normal usage but low enough to prevent abuse.
