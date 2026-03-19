/**
 * In-memory rate limiter for Hono (per-IP).
 * Compatible with React Router v7 / Hono server — no express-rate-limit needed.
 */

const store = new Map(); // ip -> { count, resetAt }

function getIp(request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * Returns a rate-limit checker function.
 * @param {object} opts
 * @param {number} opts.windowMs   - Window in ms (default 60000)
 * @param {number} opts.max        - Max requests per window (default 100)
 * @param {string} [opts.prefix]   - Key prefix to namespace different limiters
 */
export function createRateLimiter({ windowMs = 60_000, max = 100, prefix = "default" } = {}) {
  return function checkLimit(request) {
    const ip = getIp(request);
    const key = `${prefix}:${ip}`;
    const now = Date.now();
    const entry = store.get(key);

    if (!entry || entry.resetAt <= now) {
      store.set(key, { count: 1, resetAt: now + windowMs });
      return null; // OK
    }

    entry.count++;
    if (entry.count > max) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      return new Response(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(retryAfter),
            "X-RateLimit-Limit": String(max),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(Math.ceil(entry.resetAt / 1000)),
          },
        }
      );
    }

    return null; // OK
  };
}

// Pre-built limiters for common use-cases
export const generalLimiter   = createRateLimiter({ windowMs: 60_000, max: 100, prefix: "general" });
export const authLimiter      = createRateLimiter({ windowMs: 60_000, max: 5,   prefix: "auth" });
export const paymentLimiter   = createRateLimiter({ windowMs: 60_000, max: 3,   prefix: "payment" });
export const passwordLimiter  = createRateLimiter({ windowMs: 60_000, max: 5,   prefix: "password" });

// Cleanup old entries every 5 minutes to prevent memory bloat
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of store) {
    if (val.resetAt <= now) store.delete(key);
  }
}, 5 * 60_000);
