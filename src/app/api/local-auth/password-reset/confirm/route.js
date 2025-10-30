import sql from "@/app/api/utils/sql";

async function ensureTables() {
  await sql`
    CREATE TABLE IF NOT EXISTS auth_users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'owner',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`;
  await sql`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES auth_users(id) ON DELETE CASCADE,
      token VARCHAR(255) UNIQUE NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      used BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`;
}

export async function POST(request) {
  try {
    await ensureTables();
    const body = await request.json();
    const token = (body.token || "").trim();
    const newPassword = (body.newPassword || "").trim();

    if (!token || !newPassword) {
      return Response.json(
        { error: "Token and new password are required" },
        { status: 400 },
      );
    }

    const rows = await sql`
      SELECT t.id, t.user_id, t.expires_at, t.used
      FROM password_reset_tokens t
      WHERE t.token = ${token}
      LIMIT 1
    `;
    const row = rows[0];
    if (!row) {
      return Response.json(
        { error: "Invalid or expired token" },
        { status: 400 },
      );
    }

    if (row.used) {
      return Response.json(
        { error: "This reset link has already been used" },
        { status: 400 },
      );
    }

    const nowIso = new Date().toISOString();
    if (row.expires_at < nowIso) {
      return Response.json(
        { error: "This reset link has expired" },
        { status: 400 },
      );
    }

    await sql`UPDATE auth_users SET password = ${newPassword} WHERE id = ${row.user_id}`;
    await sql`UPDATE password_reset_tokens SET used = TRUE WHERE id = ${row.id}`;

    return Response.json({ success: true });
  } catch (error) {
    console.error("Password reset confirm error:", error);
    return Response.json(
      { error: "Failed to reset password" },
      { status: 500 },
    );
  }
}
