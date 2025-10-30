import sql from "@/app/api/utils/sql";

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
  // Create users and sessions tables if they don't exist
  await sql`
    CREATE TABLE IF NOT EXISTS auth_users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'owner',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
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

  // Seed primary admin using business email if missing
  const defaultEmail = "info@arcanpainting.ca";
  const tempPassword = `${Date.now()}-${Math.random().toString(36).slice(2)}`; // temp password; user should reset via email
  await sql`
    INSERT INTO auth_users (username, password, role)
    VALUES (${defaultEmail}, ${tempPassword}, 'owner')
    ON CONFLICT (username) DO NOTHING
  `;

  // DEV convenience: ensure a deterministic demo owner exists for local testing
  try {
    if (!process.env.ENV || process.env.ENV !== "production") {
      const demoEmail = "owner@demo.local";
      const demoPass = "demo123!";
      await sql`
        INSERT INTO auth_users (username, password, role)
        VALUES (${demoEmail}, ${demoPass}, 'owner')
        ON CONFLICT (username) DO UPDATE SET password = EXCLUDED.password, role = 'owner'
      `;
    }
  } catch {}
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
  try {
    await ensureAuthTables();
    const body = await request.json();
    const username = (body.username || body.email || "").trim();
    const password = (body.password || "").trim();

    if (!username || !password) {
      return Response.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    // DEV convenience: allow demo owner login in non-production
    if (
      (!process.env.ENV || process.env.ENV !== "production") &&
      username === "owner@demo.local"
    ) {
      await sql`
        INSERT INTO auth_users (username, password, role)
        VALUES (${username}, ${password}, 'owner')
        ON CONFLICT (username) DO UPDATE SET password = EXCLUDED.password, role = 'owner'
      `;
    }

    // Verify credentials (plain text for backward compatibility)
    const users =
      await sql`SELECT id, username, password, role FROM auth_users WHERE username = ${username}`;
    const user = users[0];

    if (!user || user.password !== password) {
      return Response.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    // Create a session token valid for 7 days
    const token = `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await sql`
      INSERT INTO auth_sessions (user_id, token, expires_at)
      VALUES (${user.id}, ${token}, ${expiresAt.toISOString()})
    `;

    const cookie = makeCookie("admin_session", token, 7 * 24 * 60 * 60);

    return new Response(
      JSON.stringify({
        success: true,
        user: { id: user.id, username: user.username, role: user.role },
        token, // expose token for API clients that send Authorization header
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", "Set-Cookie": cookie },
      },
    );
  } catch (error) {
    console.error("Login error:", error);
    return Response.json({ error: "Failed to login" }, { status: 500 });
  }
}
