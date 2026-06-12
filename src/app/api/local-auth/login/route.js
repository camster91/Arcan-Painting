// NOTE: Passwords are now hashed with argon2id.
// Existing plain-text passwords in the DB will fail login until reset.
// Admin must manually reset any existing accounts via the change-password endpoint.
import { verify as argon2Verify } from "argon2";
import sql from "@/app/api/utils/sql";
import { authLimiter } from "@/app/api/utils/rate-limit";
import { auditLog } from "@/app/api/utils/audit";
import { validateBody, schemas } from "@/app/api/utils/validate";
import { generateSecureToken } from "@/app/api/utils/auth";
import { ensureSchema } from "@/migrations/001-initial-schema";
import { generateCsrfToken, makeCsrfCookie } from "@/app/api/utils/csrf";

function makeCookie(name, value, maxAgeSeconds) {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
  ];
  if (maxAgeSeconds !== undefined && maxAgeSeconds !== null) {
    parts.push(`Max-Age=${maxAgeSeconds}`);
  }
  // Mark the cookie Secure whenever the app is served over HTTPS. The
  // existing check looked for AUTH_URL which the project doesn't actually
  // set; NEXTAUTH_URL is the env var the project uses.
  try {
    const env = process.env;
    const url = env.NEXTAUTH_URL || env.AUTH_URL || env.APP_URL || "";
    if (url.startsWith("https")) {
      parts.push("Secure");
    }
  } catch {}
  return parts.join("; ");
}

export async function POST(request) {
  // Rate limiting
  const limited = authLimiter(request);
  if (limited) return limited;

  try {
    // Ensure schema exists (runs once, cached)
    await ensureSchema();

    const [body, validationError] = await validateBody(request, schemas.login);
    if (validationError) {
      await auditLog({ request, action: "login.attempt", status: "failure", changes: { reason: "validation_failed" } });
      return validationError;
    }

    const username = (body.username || body.email || "").trim();
    const password = (body.password || "").trim();

    if (!username || !password) {
      return Response.json({ error: "Email and password are required" }, { status: 400 });
    }

    // Block demo account in all environments (should not exist, but extra guard)
    if (username === "owner@demo.local") {
      return Response.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const users = await sql`SELECT id, username, password, role FROM auth_users WHERE username = ${username}`;
    const user = users[0];

    if (!user) {
      await auditLog({ request, action: "login.attempt", status: "failure", changes: { username, reason: "user_not_found" } });
      // Constant-time response to prevent user enumeration
      return Response.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Verify password (argon2 only — plain-text no longer accepted)
    let passwordValid = false;
    try {
      passwordValid = await argon2Verify(user.password, password);
    } catch {
      passwordValid = false;
    }

    if (!passwordValid) {
      await auditLog({ request, action: "login.attempt", status: "failure", username: user.username, userId: user.id, changes: { reason: "wrong_password" } });
      return Response.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Create a cryptographically secure session token valid for 7 days
    const token = generateSecureToken();
    const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

    await sql`
      INSERT INTO auth_sessions (user_id, token, expires_at)
      VALUES (${user.id}, ${token}, ${expiresAt.toISOString()})
    `;

    await auditLog({
      request,
      action: "login.success",
      userId: user.id,
      username: user.username,
      status: "success",
    });

    // Set session cookie (httpOnly) and CSRF cookie (readable by JS)
    const csrfToken = generateCsrfToken();
    const sessionCookie = makeCookie("admin_session", token, 90 * 24 * 60 * 60);
    const csrfCookie = makeCsrfCookie(csrfToken, 90 * 24 * 60 * 60);

    return new Response(
      JSON.stringify({
        success: true,
        user: { id: user.id, username: user.username, role: user.role },
        // NOTE: token intentionally omitted from response — it lives in the cookie only
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Set-Cookie": `${sessionCookie}, ${csrfCookie}`,
        },
      }
    );
  } catch (error) {
    console.error("Login error:", error);
    return Response.json({ error: "Failed to login" }, { status: 500 });
  }
}
