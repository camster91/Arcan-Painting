import { createHash, randomBytes } from "crypto";
import sql from "./sql.js";
import { ensureSchema } from "../../../migrations/001-initial-schema.js";

// Cache schema readiness to avoid running migrations on every request
let _schemaReady = false;

// ── Token generation ────────────────────────────────────────────────────────
/**
 * Generate a cryptographically secure session token.
 * 32 bytes of entropy → 64 hex characters. Unpredictable, unique.
 */
export function generateSecureToken() {
  return randomBytes(32).toString("hex");
}

// Helper function to parse cookies
export function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(";").forEach((pair) => {
    const [k, v] = pair.split("=");
    if (!k) return;
    cookies[k.trim()] = decodeURIComponent((v || "").trim());
  });
  return cookies;
}

// Helper function to get current user from session (returns user object or null)
// Supports both Authorization: Bearer <token> and admin_session cookie.
// Uses a single JOIN query for both paths — no N+1.
export async function getCurrentUser(request) {
  if (!_schemaReady) {
    try {
      await ensureSchema();
      _schemaReady = true;
    } catch (err) {
      console.error("[auth] Schema migration failed:", err.message);
      return null;
    }
  }

  // 1. Try Authorization: Bearer header first (API clients / mobile)
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    const token = authHeader.slice(7);
    const rows = await sql`
      SELECT u.id, u.username, u.role, s.expires_at
      FROM auth_sessions s
      JOIN auth_users u ON u.id = s.user_id
      WHERE s.token = ${token}
        AND s.deleted_at IS NULL
        AND s.expires_at > NOW()
      LIMIT 1
    `;
    if (rows.length) return { id: rows[0].id, username: rows[0].username, role: rows[0].role };
  }

  // 2. Fallback: cookie-based session
  const cookieHeader = request.headers.get("cookie");
  const cookies = parseCookies(cookieHeader);
  const token = cookies["admin_session"];

  if (!token) {
    return null;
  }

  const rows = await sql`
    SELECT u.id, u.username, u.role, s.expires_at
    FROM auth_sessions s
    JOIN auth_users u ON u.id = s.user_id
    WHERE s.token = ${token}
      AND s.deleted_at IS NULL
      AND s.expires_at > NOW()
    LIMIT 1
  `;

  if (!rows.length) {
    return null;
  }

  return { id: rows[0].id, username: rows[0].username, role: rows[0].role };
}

// Helper function to require authentication (returns user object or null)
export async function requireAuth(request) {
  const user = await getCurrentUser(request);
  return user;
}

// Helper function to require admin role (checks role field)
export async function requireAdmin(request) {
  const user = await getCurrentUser(request);
  if (!user) return null;
  if (user.role !== 'owner' && user.role !== 'admin') return null;
  return user;
}

// Helper function to return unauthorized response
export function unauthorizedResponse() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}
