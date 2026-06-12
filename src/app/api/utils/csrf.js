/**
 * CSRF protection utility.
 *
 * On login, the server sets `arcan_csrf` cookie (readable by JS, not httpOnly).
 * Clients must read this cookie and send it back as `x-csrf-token` header
 * on state-changing requests (POST/PUT/DELETE/PATCH).
 *
 * Excluded routes (no CSRF needed):
 *   /api/auth/login        — sets the cookie itself
 *   /api/auth/logout       — clears the cookie, own auth
 *   /api/contact           — public contact form
 *   /api/quote             — public quote form
 *   /api/lead-webhook/meta — webhook with its own auth
 *   /api/stripe-webhook    — webhook with Stripe signature verification
 *   /api/local-auth/*      — uses separate auth mechanism
 */

import { parseCookies } from "./auth.js";
import { randomBytes } from "crypto";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Generate a new CSRF token (32 random bytes → 64 hex chars).
 */
export function generateCsrfToken() {
  return randomBytes(32).toString("hex");
}

/**
 * Returns the public URL of the app (NEXTAUTH_URL preferred, then AUTH_URL,
 * then APP_URL), or an empty string if none is set. Centralised here because
 * the legacy code in login/csrf used AUTH_URL which the project never set —
 * that meant Secure cookies never fired on HTTPS.
 */
function publicOrigin() {
  const env = process.env || {};
  return env.NEXTAUTH_URL || env.AUTH_URL || env.APP_URL || "";
}

function isHttps() {
  return publicOrigin().startsWith("https");
}

/**
 * Build a Set-Cookie header for the CSRF token.
 * Not HttpOnly so JS can read and echo it back.
 */
export function makeCsrfCookie(token, maxAgeSeconds = 90 * 24 * 60 * 60) {
  const parts = [
    `arcan_csrf=${encodeURIComponent(token)}`,
    "Path=/",
    // No HttpOnly — must be readable by client-side JS
    "SameSite=Strict",
    `Max-Age=${maxAgeSeconds}`,
  ];
  if (isHttps()) {
    parts.push("Secure");
  }
  return parts.join("; ");
}

/**
 * Build a Set-Cookie header to clear the CSRF token.
 */
export function clearCsrfCookie() {
  const parts = [
    "arcan_csrf=",
    "Path=/",
    "SameSite=Strict",
    "Max-Age=0",
  ];
  if (isHttps()) {
    parts.push("Secure");
  }
  return parts.join("; ");
}

/**
 * CSRF middleware — returns null if request is safe or valid, or a 403 Response.
 *
 * @param {Request} request
 * @returns {Response|null}
 */
export function requireCsrf(request) {
  // Skip safe methods
  if (SAFE_METHODS.has(request.method)) {
    return null;
  }

  const cookieHeader = request.headers.get("cookie");
  const cookies = parseCookies(cookieHeader);
  const cookieToken = cookies["arcan_csrf"];

  if (!cookieToken) {
    return new Response(
      JSON.stringify({ error: "CSRF token missing" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  const headerToken = request.headers.get("x-csrf-token");

  if (!headerToken) {
    return new Response(
      JSON.stringify({ error: "x-csrf-token header missing" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  // Timing-safe comparison to prevent timing attacks
  if (!timingSafeEqual(headerToken, cookieToken)) {
    return new Response(
      JSON.stringify({ error: "CSRF token mismatch" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  return null;
}

/**
 * Timing-safe string comparison.
 */
function timingSafeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}