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
export async function getCurrentUser(request) {
  try {
    await ensureSchema();
  } catch {}

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
    LIMIT 1
  `;
  const row = rows[0];

  if (!row) {
    return null;
  }

  const nowIso = new Date().toISOString();
  if (row.expires_at && row.expires_at < nowIso) {
    // Cleanup expired session
    await sql`DELETE FROM auth_sessions WHERE token = ${token}`;
    return null;
  }

  return { id: row.id, username: row.username, role: row.role };
}

// Helper function to require authentication (returns boolean)
export async function requireAuth(request) {
  const user = await getCurrentUser(request);
  return user !== null;
}

// Helper function to require admin authentication (backward compatibility)
export async function requireAdmin(request) {
  const user = await getCurrentUser(request);
  return user !== null; // In this system, all authenticated users are admins
}

// Helper function to return unauthorized response
export function unauthorizedResponse() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}
