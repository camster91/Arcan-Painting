/**
 * Admin Cache Management — /api/admin/cache
 *
 * GET  /api/admin/cache          → stats (connected, key count, hit rate)
 * DELETE /api/admin/cache        → flush all cache keys
 * DELETE /api/admin/cache?key=X  → delete a specific key
 * DELETE /api/admin/cache?pattern=leads:* → delete by pattern
 *
 * Requires owner role.
 */

import {
  cacheStats,
  cacheFlushAll,
  cacheDelete,
  cacheDeletePattern,
} from "../../utils/cache.js";

async function requireOwner(request) {
  // Re-use auth from utils/auth.js if available, otherwise inline check
  try {
    const { requireAdmin } = await import("../../utils/auth.js");
    return requireAdmin(request);
  } catch {
    return null;
  }
}

// GET /api/admin/cache — return cache stats
export async function GET(request) {
  try {
    const authorized = await requireOwner(request);
    if (!authorized) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const stats = await cacheStats();
    return Response.json({ success: true, cache: stats });
  } catch (error) {
    console.error("Error fetching cache stats:", error);
    return Response.json(
      { success: false, error: "Failed to fetch cache stats" },
      { status: 500 },
    );
  }
}

// DELETE /api/admin/cache — flush cache (all, specific key, or pattern)
export async function DELETE(request) {
  try {
    const authorized = await requireOwner(request);
    if (!authorized) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");
    const pattern = searchParams.get("pattern");

    if (key) {
      const count = await cacheDelete(key);
      return Response.json({
        success: true,
        message: `Deleted cache key: ${key}`,
        removed: count,
      });
    }

    if (pattern) {
      const count = await cacheDeletePattern(pattern);
      return Response.json({
        success: true,
        message: `Deleted cache keys matching: ${pattern}`,
        removed: count,
      });
    }

    // Full flush
    const ok = await cacheFlushAll();
    return Response.json({
      success: ok,
      message: ok ? "All cache keys cleared" : "Cache flush failed (Redis not connected?)",
    });
  } catch (error) {
    console.error("Error clearing cache:", error);
    return Response.json(
      { success: false, error: "Failed to clear cache" },
      { status: 500 },
    );
  }
}
