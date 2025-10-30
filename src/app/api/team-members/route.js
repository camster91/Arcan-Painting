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

async function getCurrentUser(request) {
  // Try Authorization: Bearer <token>
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    const token = authHeader.slice(7);
    const sessions =
      await sql`SELECT * FROM auth_sessions WHERE token = ${token} AND expires_at > NOW()`;
    if (sessions.length) {
      const users =
        await sql`SELECT id, username, role FROM auth_users WHERE id = ${sessions[0].user_id} LIMIT 1`;
      if (users.length) return users[0];
    }
  }
  // Fallback to cookie-based session
  const cookies = parseCookies(request.headers.get("cookie"));
  const cookieToken = cookies["admin_session"];
  if (!cookieToken) return null;
  const rows = await sql`
    SELECT u.id, u.username, u.role, s.expires_at
    FROM auth_sessions s
    JOIN auth_users u ON u.id = s.user_id
    WHERE s.token = ${cookieToken}
    LIMIT 1
  `;
  const user = rows[0];
  if (!user) return null;
  const nowIso = new Date().toISOString();
  if (user.expires_at && user.expires_at < nowIso) {
    await sql`DELETE FROM auth_sessions WHERE token = ${cookieToken}`;
    return null;
  }
  return { id: user.id, username: user.username, role: user.role };
}

// Get all team members (owners only) or get current painter's info
export async function GET(request) {
  try {
    // UPDATED: accept either Authorization header or admin_session cookie
    const user = await getCurrentUser(request);
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only owners can see all team members
    if (user.role === "owner") {
      const teamMembers = await sql`
        SELECT * FROM team_members 
        ORDER BY name ASC
      `;
      return Response.json(teamMembers);
    } else {
      // Painters can only see their own info
      const teamMembers = await sql`
        SELECT * FROM team_members 
        WHERE email = ${user.username}
      `;
      return Response.json(teamMembers);
    }
  } catch (error) {
    console.error("Error fetching team members:", error);
    return Response.json(
      { error: "Failed to fetch team members" },
      { status: 500 },
    );
  }
}

// Create new team member (owners only)
export async function POST(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.role !== "owner") {
      return Response.json(
        { error: "Forbidden - Owners only" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const {
      name,
      email,
      phone,
      role = "painter",
      hire_date,
      hourly_rate,
      specialties,
      notes,
    } = body;

    if (!name || !email) {
      return Response.json(
        { error: "Name and email are required" },
        { status: 400 },
      );
    }

    const teamMember = await sql`
      INSERT INTO team_members (name, email, phone, role, hire_date, hourly_rate, specialties, notes)
      VALUES (${name}, ${email}, ${phone}, ${role}, ${hire_date}, ${hourly_rate}, ${specialties}, ${notes})
      RETURNING *
    `;

    return Response.json(teamMember[0]);
  } catch (error) {
    console.error("Error creating team member:", error);
    if (error.message && error.message.includes("unique constraint")) {
      return Response.json({ error: "Email already exists" }, { status: 409 });
    }
    return Response.json(
      { error: "Failed to create team member" },
      { status: 500 },
    );
  }
}

// Update team member (owners only)
export async function PUT(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.role !== "owner") {
      return Response.json(
        { error: "Forbidden - Owners only" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const {
      id,
      name,
      email,
      phone,
      role,
      hire_date,
      hourly_rate,
      specialties,
      notes,
      status,
    } = body;

    if (!id) {
      return Response.json({ error: "ID is required" }, { status: 400 });
    }

    // Build dynamic update query
    let setClause = [];
    let values = [];
    let paramCount = 0;

    if (name !== undefined) {
      setClause.push(`name = $${++paramCount}`);
      values.push(name);
    }
    if (email !== undefined) {
      setClause.push(`email = $${++paramCount}`);
      values.push(email);
    }
    if (phone !== undefined) {
      setClause.push(`phone = $${++paramCount}`);
      values.push(phone);
    }
    if (role !== undefined) {
      setClause.push(`role = $${++paramCount}`);
      values.push(role);
    }
    if (hire_date !== undefined) {
      setClause.push(`hire_date = $${++paramCount}`);
      values.push(hire_date);
    }
    if (hourly_rate !== undefined) {
      setClause.push(`hourly_rate = $${++paramCount}`);
      values.push(hourly_rate);
    }
    if (specialties !== undefined) {
      setClause.push(`specialties = $${++paramCount}`);
      values.push(specialties);
    }
    if (notes !== undefined) {
      setClause.push(`notes = $${++paramCount}`);
      values.push(notes);
    }
    if (status !== undefined) {
      setClause.push(`status = $${++paramCount}`);
      values.push(status);
    }

    if (setClause.length === 0) {
      return Response.json({ error: "No fields to update" }, { status: 400 });
    }

    setClause.push(`updated_at = $${++paramCount}`);
    values.push(new Date());
    values.push(id);

    const updateQuery = `
      UPDATE team_members 
      SET ${setClause.join(", ")}
      WHERE id = $${++paramCount}
      RETURNING *
    `;

    const teamMember = await sql(updateQuery, values);

    if (teamMember.length === 0) {
      return Response.json({ error: "Team member not found" }, { status: 404 });
    }

    return Response.json(teamMember[0]);
  } catch (error) {
    console.error("Error updating team member:", error);
    return Response.json(
      { error: "Failed to update team member" },
      { status: 500 },
    );
  }
}
