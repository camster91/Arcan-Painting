/**
 * Redis Cache Utility — arcanpainting.ca
 *
 * Provides cacheGet / cacheSet / cacheDelete / cacheDeletePattern helpers.
 * Falls back gracefully when Redis is unavailable (logs warning, returns null).
 *
 * TTL constants (seconds):
 *   SESSION_TTL       7 days   → auth session data
 *   LEADS_TTL         5 min    → GET /api/leads responses
 *   ESTIMATES_TTL    10 min    → GET /api/estimates responses
 *   PROJECTS_TTL     15 min    → GET /api/projects responses
 *   CATEGORIES_TTL    1 hour   → static service categories
 *   USER_PROFILE_TTL  5 min    → user profile data
 *   CONFIG_TTL       24 hours  → app config / settings
 */

import IORedis from "ioredis";

export const TTL = {
  SESSION: 60 * 60 * 24 * 7,   // 7 days
  LEADS: 60 * 5,                // 5 min
  ESTIMATES: 60 * 10,           // 10 min
  PROJECTS: 60 * 15,            // 15 min
  CATEGORIES: 60 * 60,          // 1 hour
  USER_PROFILE: 60 * 5,         // 5 min
  CONFIG: 60 * 60 * 24,         // 24 hours
};

// --------------------------------------------------------------------------
// Redis client (singleton, lazy-init)
// --------------------------------------------------------------------------

let _redis = null;
let _redisConnecting = false;
let _redisFailed = false;  // stop retrying if env var missing

function getRedis() {
  if (_redisFailed) return null;
  if (_redis) return _redis;
  if (_redisConnecting) return null;

  const url = process.env.REDIS_URL;
  if (!url) {
    if (!_redisFailed) {
      console.warn("[cache] REDIS_URL not set — caching disabled");
      _redisFailed = true;
    }
    return null;
  }

  _redisConnecting = true;
  try {
    _redis = new IORedis(url, {
      maxRetriesPerRequest: 2,
      connectTimeout: 3000,
      lazyConnect: true,
      enableOfflineQueue: false,
    });

    _redis.on("connect", () => {
      console.info("[cache] Redis connected");
      _redisConnecting = false;
    });

    _redis.on("error", (err) => {
      console.error("[cache] Redis error:", err.message);
      // Don't null out — ioredis auto-reconnects; just mark connecting done
      _redisConnecting = false;
    });

    _redis.connect().catch((err) => {
      console.error("[cache] Redis connect failed:", err.message);
      _redis = null;
      _redisConnecting = false;
    });

    return _redis;
  } catch (err) {
    console.error("[cache] Failed to initialise Redis:", err.message);
    _redis = null;
    _redisConnecting = false;
    return null;
  }
}

// --------------------------------------------------------------------------
// Core helpers
// --------------------------------------------------------------------------

/**
 * Get a cached value. Returns parsed JSON or null on miss / error.
 */
export async function cacheGet(key) {
  const redis = getRedis();
  if (!redis) return null;

  try {
    const raw = await redis.get(key);
    if (raw === null) {
      console.debug(`[cache] MISS  ${key}`);
      return null;
    }
    console.debug(`[cache] HIT   ${key}`);
    return JSON.parse(raw);
  } catch (err) {
    console.error(`[cache] GET error for "${key}":`, err.message);
    return null;
  }
}

/**
 * Set a cached value with optional TTL (seconds).
 * If ttl is 0 or omitted, no expiry is set.
 */
export async function cacheSet(key, value, ttl = 0) {
  const redis = getRedis();
  if (!redis) return false;

  try {
    const serialised = JSON.stringify(value);
    if (ttl > 0) {
      await redis.set(key, serialised, "EX", ttl);
    } else {
      await redis.set(key, serialised);
    }
    console.debug(`[cache] SET   ${key} (ttl=${ttl}s)`);
    return true;
  } catch (err) {
    console.error(`[cache] SET error for "${key}":`, err.message);
    return false;
  }
}

/**
 * Delete one or more cache keys.
 */
export async function cacheDelete(...keys) {
  const redis = getRedis();
  if (!redis || keys.length === 0) return 0;

  try {
    const count = await redis.del(...keys);
    console.debug(`[cache] DEL   ${keys.join(", ")} (removed=${count})`);
    return count;
  } catch (err) {
    console.error(`[cache] DEL error for "${keys}":`, err.message);
    return 0;
  }
}

/**
 * Delete all keys matching a glob pattern (e.g. "leads:*").
 * Uses SCAN to avoid blocking Redis on large key sets.
 */
export async function cacheDeletePattern(pattern) {
  const redis = getRedis();
  if (!redis) return 0;

  try {
    let cursor = "0";
    let total = 0;

    do {
      const [nextCursor, keys] = await redis.scan(cursor, "MATCH", pattern, "COUNT", 100);
      cursor = nextCursor;

      if (keys.length > 0) {
        const removed = await redis.del(...keys);
        total += removed;
      }
    } while (cursor !== "0");

    console.debug(`[cache] DEL pattern "${pattern}" (removed=${total})`);
    return total;
  } catch (err) {
    console.error(`[cache] DEL pattern error for "${pattern}":`, err.message);
    return 0;
  }
}

/**
 * Flush the entire cache (admin use only).
 */
export async function cacheFlushAll() {
  const redis = getRedis();
  if (!redis) return false;

  try {
    await redis.flushdb();
    console.info("[cache] FLUSHDB — all keys cleared");
    return true;
  } catch (err) {
    console.error("[cache] FLUSHDB error:", err.message);
    return false;
  }
}

/**
 * Return basic stats: connected status + key count.
 */
export async function cacheStats() {
  const redis = getRedis();
  if (!redis) {
    return { connected: false, keyCount: 0, redisUrl: null };
  }

  try {
    const dbSize = await redis.dbsize();
    const info = await redis.info("stats");
    const hits = (info.match(/keyspace_hits:(\d+)/) || [])[1] || "0";
    const misses = (info.match(/keyspace_misses:(\d+)/) || [])[1] || "0";

    return {
      connected: true,
      keyCount: dbSize,
      hits: parseInt(hits),
      misses: parseInt(misses),
      hitRate: parseInt(hits) + parseInt(misses) > 0
        ? Math.round((parseInt(hits) / (parseInt(hits) + parseInt(misses))) * 100)
        : 0,
    };
  } catch (err) {
    return { connected: false, error: err.message };
  }
}

// --------------------------------------------------------------------------
// Cache key builders (centralised — avoids typos across routes)
// --------------------------------------------------------------------------

export const CacheKeys = {
  // Leads
  leads: (params = "") => `leads:list:${params}`,
  lead: (id) => `leads:${id}`,

  // Estimates
  estimates: (params = "") => `estimates:list:${params}`,
  estimatesByLead: (leadId) => `estimates:lead:${leadId}`,
  estimate: (id) => `estimates:${id}`,

  // Projects
  projects: (params = "") => `projects:list:${params}`,
  projectsByLead: (leadId) => `projects:lead:${leadId}`,
  project: (id) => `projects:${id}`,

  // Static / config
  serviceCategories: () => "static:service_categories",
  userProfile: (userId) => `user:profile:${userId}`,
  config: (key = "global") => `config:${key}`,

  // Sessions
  session: (token) => `session:${token}`,
};
