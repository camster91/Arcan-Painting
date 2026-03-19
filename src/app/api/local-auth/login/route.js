import { hash, verify as argon2Verify } from "argon2";
import sql from "@/app/api/utils/sql";
import { authLimiter } from "@/app/api/utils/rate-limit";
import { auditLog } from "@/app/api/utils/audit";
import { validateBody, schemas } from "@/app/api/utils/validate";

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(";").forEach((pair) => {
    const [k, v] = pair.split("=");
    if (!k) return;
    cookies[k.trim()] = decodeURIComponent((v || "").trim());
  });
  return cookies;
}

async function ensureAuthTables() {
  await sql`
    CREATE TABLE IF NOT EXISTS auth_users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'owner',
      password_is_hashed BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  // Add password_is_hashed column if it doesn't exist (migration)
  await sql`
    ALTER TABLE auth_users ADD COLUMN IF NOT EXISTS password_is_hashed BOOLEAN DEFAULT FALSE
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS auth_sessions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES auth_users(id) ON DELETE CASCADE,
      token VARCHAR(255) UNIQUE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      expires_at TIMESTAMP NOT NULL
    )
  `;

  // Seed primary admin with a temp hashed password if missing
  const defaultEmail = "info@arcanpainting.ca";
  const existingAdmin = await sql`SELECT id FROM auth_users WHERE username = ${defaultEmail} LIMIT 1`;
  if (existingAdmin.length === 0) {
    const tempPassword = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const hashed = await hash(tempPassword);
    await sql`
      INSERT INTO auth_users (username, password, role, password_is_hashed)
      VALUES (${defaultEmail}, ${hashed}, 'owner', TRUE)
      ON CONFLICT (username) DO NOTHING
    `;
  }

  // DEV: ensure demo owner exists for local testing
  if (!process.env.ENV || process.env.ENV !== "production") {
    const demoEmail = "owner@demo.local";
    const demoPass = "demo123!";
    const demoExists = await sql`SELECT id, password_is_hashed FROM auth_users WHERE username = ${demoEmail} LIMIT 1`;
    if (demoExists.length === 0) {
      const hashed = await hash(demoPass);
      await sql`
        INSERT INTO auth_users (username, password, role, password_is_hashed)
        VALUES (${demoEmail}, ${hashed}, 'owner', TRUE)
        ON CONFLICT DO NOTHING
      `;
    }
  }
}

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
    await ensureAuthTables();

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

    // Create a session token valid for 7 days
    const token = `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
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

    const cookie = makeCookie("admin_session", token, 7 * 24 * 60 * 60);

    return new Response(
      JSON.stringify({
        success: true,
        user: { id: user.id, username: user.username, role: user.role },
        token,
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
