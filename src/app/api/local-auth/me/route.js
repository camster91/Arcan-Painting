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
}

export async function GET(request) {
  try {
    await ensureAuthTables();
    const cookieHeader = request.headers.get("cookie");
    const cookies = parseCookies(cookieHeader);
    const token = cookies["admin_session"];

    if (!token) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
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
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const nowIso = new Date().toISOString();
    if (row.expires_at && row.expires_at < nowIso) {
      // Cleanup expired session
      await sql`DELETE FROM auth_sessions WHERE token = ${token}`;
      return Response.json({ error: "Session expired" }, { status: 401 });
    }

    return Response.json({
      success: true,
      user: { id: row.id, username: row.username, role: row.role },
    });
  } catch (error) {
    console.error("Me error:", error);
    return Response.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}
