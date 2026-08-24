import { createHash, randomBytes } from "crypto";
import sql from "./sql.js";
import { ensureSchema } from "../../../migrations/001-initial-schema.js";

// ── Token generation ────────────────────────────────────────────────────────
/**
 * Generate a cryptographically secure session token.
 * 32 bytes of entropy → 64 hex characters. Unpredictable, unique.
 */
export function generateSecureToken() {
  return randomBytes(32).toString("hex");
}

// PostgreSQL returns timestamp columns as Date objects. Comparing them to an
// ISO string coerces the Date to a non-chronological string, which can leave
// expired credentials valid.
export function isExpiredAt(expiresAt, now = new Date()) {
  const expiresAtMs = new Date(expiresAt).getTime();
  return Number.isNaN(expiresAtMs) || expiresAtMs <= now.getTime();
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
  try {
    await ensureSchema();
  } catch {}

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
  const row = rows[0];

  if (!row) {
    return null;
  }

  if (isExpiredAt(row.expires_at)) {
    // Soft-delete expired session (preserve audit trail)
    await sql`UPDATE auth_sessions SET deleted_at = NOW() WHERE token = ${token} AND deleted_at IS NULL`;
    return null;
  }

  return { id: row.id, username: row.username, role: row.role };
}

// Helper function to require authentication (returns boolean)
export async function requireAuth(request) {
  const user = await getCurrentUser(request);
  return user !== null;
}

// Helper function to require admin authentication
export async function requireAdmin(request) {
  const user = await getCurrentUser(request);
  if (!user) return false;
  return user.role === 'owner' || user.role === 'admin';
}

// Helper function to require owner-only authentication
export async function requireOwner(request) {
  const user = await getCurrentUser(request);
  if (!user) return false;
  return user.role === 'owner';
}

// Helper function to return unauthorized response
export function unauthorizedResponse() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}
