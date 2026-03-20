/**
 * Cache Middleware — arcanpainting.ca
 *
 * withCache(handler, options) wraps a GET route handler with Redis caching.
 *
 * Options:
 *   keyFn(request)  → string        Build the cache key from the request
 *   ttl             → number        TTL in seconds
 *   invalidateOn    → string[]      HTTP methods that should bust the cache
 *                                   (applied at route level, not here)
 *
 * Usage example in a route file:
 *
 *   export const GET = withCache(
 *     async (request) => { ... return Response.json(data); },
 *     {
 *       keyFn: (req) => CacheKeys.leads(new URL(req.url).search),
 *       ttl: TTL.LEADS,
 *     }
 *   );
 *
 * Cache invalidation helpers are also exported for use in POST/PUT/DELETE
 * handlers to invalidate related cache keys.
 */

import { cacheGet, cacheSet, cacheDeletePattern, cacheDelete } from "../utils/cache.js";

// --------------------------------------------------------------------------
// withCache — wraps a GET handler with read-through caching
// --------------------------------------------------------------------------

/**
 * @param {Function} handler  - Async (request) => Response handler
 * @param {Object}   options
 * @param {Function} options.keyFn  - (request) => string
 * @param {number}   options.ttl   - TTL in seconds
 */
export function withCache(handler, { keyFn, ttl }) {
  return async (request, ...args) => {
    const key = keyFn(request);

    // --- Cache read ---
    const cached = await cacheGet(key);
    if (cached !== null) {
      return Response.json(cached, {
        headers: {
          "X-Cache": "HIT",
          "X-Cache-Key": key,
        },
      });
    }

    // --- Execute handler ---
    const response = await handler(request, ...args);

    // Only cache successful 2xx responses
    if (response.ok) {
      try {
        // We need to clone to read body without consuming it
        const clone = response.clone();
        const data = await clone.json();
        await cacheSet(key, data, ttl);

        // Return the original response with cache header
        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: {
            ...Object.fromEntries(response.headers.entries()),
            "X-Cache": "MISS",
            "X-Cache-Key": key,
          },
        });
      } catch {
        // If we can't parse/cache the response, return it as-is
        return response;
      }
    }

    return response;
  };
}

// --------------------------------------------------------------------------
// Invalidation helpers — call these from POST / PUT / DELETE handlers
// --------------------------------------------------------------------------

/**
 * Invalidate all leads cache entries.
 */
export async function invalidateLeadsCache() {
  return cacheDeletePattern("leads:*");
}

/**
 * Invalidate all estimates cache entries, optionally for a specific lead.
 */
export async function invalidateEstimatesCache(leadId = null) {
  if (leadId) {
    await cacheDelete(`estimates:lead:${leadId}`);
  }
  return cacheDeletePattern("estimates:list:*");
}

/**
 * Invalidate all projects cache entries, optionally for a specific lead.
 */
export async function invalidateProjectsCache(leadId = null) {
  if (leadId) {
    await cacheDelete(`projects:lead:${leadId}`);
  }
  return cacheDeletePattern("projects:list:*");
}

/**
 * Invalidate a specific user's profile cache.
 */
export async function invalidateUserProfileCache(userId) {
  return cacheDelete(`user:profile:${userId}`);
}

/**
 * Invalidate a session token from Redis cache.
 */
export async function invalidateSessionCache(token) {
  return cacheDelete(`session:${token}`);
}

/**
 * Invalidate config/settings cache.
 */
export async function invalidateConfigCache(key = "global") {
  return cacheDelete(`config:${key}`);
}
