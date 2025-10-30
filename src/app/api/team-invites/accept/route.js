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
    CREATE TABLE IF NOT EXISTS team_members (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      phone VARCHAR(50),
      role VARCHAR(50) NOT NULL DEFAULT 'painter',
      hire_date DATE,
      hourly_rate NUMERIC(8,2),
      status VARCHAR(50) DEFAULT 'active',
      specialties TEXT,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`;
  await sql`
    CREATE TABLE IF NOT EXISTS team_invites (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'painter',
      token VARCHAR(255) UNIQUE NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      accepted_at TIMESTAMP,
      created_by_user_id INTEGER REFERENCES auth_users(id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`;
}

export async function POST(request) {
  try {
    await ensureTables();
    const body = await request.json();
    const token = (body.token || "").trim();
    const name = (body.name || "").trim();
    const password = (body.password || "").trim();

    if (!token || !name || !password) {
      return Response.json(
        { error: "Token, name and password are required" },
        { status: 400 },
      );
    }

    const invites =
      await sql`SELECT * FROM team_invites WHERE token = ${token} LIMIT 1`;
    const invite = invites[0];
    if (!invite) {
      return Response.json(
        { error: "Invalid or expired invite" },
        { status: 400 },
      );
    }

    // Robust expiry check using Date objects (avoids string comparison pitfalls)
    const now = new Date();
    const expiresAt = new Date(invite.expires_at);
    if (invite.accepted_at) {
      return Response.json(
        { error: "Invite already accepted" },
        { status: 400 },
      );
    }
    if (isFinite(expiresAt.getTime()) && expiresAt < now) {
      return Response.json({ error: "Invite has expired" }, { status: 400 });
    }

    // Create or update auth user
    const existingUsers =
      await sql`SELECT * FROM auth_users WHERE username = ${invite.email} LIMIT 1`;
    let userId;
    if (existingUsers.length) {
      userId = existingUsers[0].id;
      await sql`UPDATE auth_users SET password = ${password}, role = ${invite.role} WHERE id = ${userId}`;
    } else {
      const inserted = await sql`
        INSERT INTO auth_users (username, password, role)
        VALUES (${invite.email}, ${password}, ${invite.role})
        RETURNING id
      `;
      userId = inserted[0].id;
    }

    // Create or update team member record
    const existingMembers =
      await sql`SELECT * FROM team_members WHERE email = ${invite.email} LIMIT 1`;
    if (existingMembers.length) {
      await sql`UPDATE team_members SET name = ${name}, role = ${invite.role}, status = 'active', updated_at = ${new Date().toISOString()} WHERE id = ${existingMembers[0].id}`;
    } else {
      await sql`
        INSERT INTO team_members (name, email, role, status)
        VALUES (${name}, ${invite.email}, ${invite.role}, 'active')
      `;
    }

    await sql`UPDATE team_invites SET accepted_at = ${new Date().toISOString()} WHERE id = ${invite.id}`;

    return Response.json({ success: true });
  } catch (error) {
    console.error("Accept invite error:", error);
    return Response.json({ error: "Failed to accept invite" }, { status: 500 });
  }
}
