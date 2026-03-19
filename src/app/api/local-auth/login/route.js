import { hash, verify as argon2Verify } from "argon2";
import sql from "@/app/api/utils/sql";
import { authLimiter } from "@/app/api/utils/rate-limit";
import { auditLog } from "@/app/api/utils/audit";
import { validateBody, schemas } from "@/app/api/utils/validate";
import { generateSecureToken } from "@/app/api/utils/auth";
import { ensureSchema } from "@/migrations/001-initial-schema";

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
  try {
    if (process.env.AUTH_URL && process.env.AUTH_URL.startsWith("https")) {
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

    const users = await sql`SELECT id, username, password, role, password_is_hashed FROM auth_users WHERE username = ${username}`;
    const user = users[0];

    if (!user) {
      await auditLog({ request, action: "login.attempt", status: "failure", changes: { username, reason: "user_not_found" } });
      // Constant-time response to prevent user enumeration
      return Response.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Verify password — support both plain-text (legacy) and argon2 hashed
    let passwordValid = false;
    if (user.password_is_hashed) {
      try {
        passwordValid = await argon2Verify(user.password, password);
      } catch {
        passwordValid = false;
      }
    } else {
      // Legacy plain-text comparison (migrate on-login)
      passwordValid = user.password === password;
      if (passwordValid) {
        // On-login migration: hash the password now
        const hashed = await hash(password);
        await sql`UPDATE auth_users SET password = ${hashed}, password_is_hashed = TRUE WHERE id = ${user.id}`;
        console.log(`[auth] Migrated password hash for user ${user.id}`);
      }
    }

    if (!passwordValid) {
      await auditLog({ request, action: "login.attempt", status: "failure", username: user.username, userId: user.id, changes: { reason: "wrong_password" } });
      return Response.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Create a cryptographically secure session token valid for 7 days
    const token = generateSecureToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

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

    // Set token ONLY in httpOnly cookie — never expose in JSON response body
    const cookie = makeCookie("admin_session", token, 7 * 24 * 60 * 60);

    return new Response(
      JSON.stringify({
        success: true,
        user: { id: user.id, username: user.username, role: user.role },
        // NOTE: token intentionally omitted from response — it lives in the cookie only
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", "Set-Cookie": cookie },
      }
    );
  } catch (error) {
    console.error("Login error:", error);
    return Response.json({ error: "Failed to login" }, { status: 500 });
  }
}
