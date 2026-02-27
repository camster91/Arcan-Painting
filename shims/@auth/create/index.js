// @auth/create shim for Arcan Painting
// Replaces the proprietary create.xyz @auth/create package with a local implementation
// that validates admin_session cookies against our PostgreSQL auth tables.

import { getContext } from "hono/context-storage";
import pg from "pg";
const { Pool } = pg;

let authPool = null;

function getAuthPool() {
  if (!authPool) {
    authPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL?.includes("sslmode=require")
        ? { rejectUnauthorized: false }
        : false,
      max: 5,
      idleTimeoutMillis: 30000,
    });
    authPool.on("error", () => {});
  }
  return authPool;
}

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(";").forEach((pair) => {
    const [k, ...rest] = pair.trim().split("=");
    if (k) cookies[k.trim()] = decodeURIComponent(rest.join("=").trim());
  });
  return cookies;
}

export default function CreateAuth({ providers, pages } = {}) {
  async function auth(request) {
    try {
      // Try to get request from Hono context storage
      let req = request;
      if (!req) {
        try {
          const ctx = getContext();
          req = ctx?.req?.raw;
        } catch {}
      }

      const cookieHeader =
        (req?.headers?.get ? req.headers.get("cookie") : req?.headers?.cookie) || "";

      const cookies = parseCookies(cookieHeader);
      const token = cookies["admin_session"];
      if (!token) return null;

      const pool = getAuthPool();
      const result = await pool.query(
        `SELECT u.id, u.username, u.role
         FROM auth_sessions s
         JOIN auth_users u ON u.id = s.user_id
         WHERE s.token = $1 AND s.expires_at > NOW()
         LIMIT 1`,
        [token]
      );

      if (result.rows.length === 0) return null;
      const user = result.rows[0];

      return {
        user: {
          id: String(user.id),
          email: user.username,
          name: user.username,
          role: user.role,
        },
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };
    } catch (err) {
      console.error("[@auth/create] auth() error:", err.message);
      return null;
    }
  }

  return { auth };
}
