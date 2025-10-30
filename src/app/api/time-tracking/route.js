import sql from "@/app/api/utils/sql";

// ADD: helper to parse cookies (for legacy cookie auth)
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

// ADD: get current user from Authorization bearer or cookie
async function getCurrentUser(request) {
  const authHeader =
    request.headers.get("Authorization") ||
    request.headers.get("authorization");
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

export async function GET(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const team_member_id = searchParams.get("team_member_id");
    const project_id = searchParams.get("project_id");
    const start_date = searchParams.get("start_date");
    const end_date = searchParams.get("end_date");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "0");

    let whereConditions = [];
    let params = [];
    let paramCount = 0;

    // If painter (non-owner) and no explicit team_member_id, restrict to their own entries by email
    if (user.role !== "owner" && !team_member_id) {
      whereConditions.push(`tm.email = $${++paramCount}`);
      params.push(user.username);
    }

    if (team_member_id) {
      whereConditions.push(`tt.team_member_id = $${++paramCount}`);
      params.push(parseInt(team_member_id));
    }

    if (project_id) {
      whereConditions.push(`tt.project_id = $${++paramCount}`);
      params.push(parseInt(project_id));
    }

    if (start_date && end_date) {
      whereConditions.push(`DATE(tt.clock_in_time) >= $${++paramCount}`);
      params.push(start_date);
      whereConditions.push(`DATE(tt.clock_in_time) <= $${++paramCount}`);
      params.push(end_date);
    }

    if (status) {
      whereConditions.push(`tt.status = $${++paramCount}`);
      params.push(status);
    }

    const whereClause =
      whereConditions.length > 0
        ? "WHERE " + whereConditions.join(" AND ")
        : "";

    let query = `
      SELECT 
        tt.*,
        tm.name as team_member_name,
        tm.role as team_member_role,
        p.project_name,
        it.title as task_title
      FROM time_tracking tt
      JOIN team_members tm ON tt.team_member_id = tm.id
      LEFT JOIN projects p ON tt.project_id = p.id
      LEFT JOIN internal_tasks it ON tt.internal_task_id = it.id
      ${whereClause}
      ORDER BY tt.clock_in_time DESC
    `;

    if (limit && limit > 0) {
      query += ` LIMIT ${Math.min(limit, 50)}`; // guardrails
    }

    const timeEntries = await sql(query, params);

    return Response.json({ timeEntries });
  } catch (error) {
    console.error("Error fetching time tracking:", error);
    return Response.json(
      { error: "Failed to fetch time tracking data" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    let {
      team_member_id,
      project_id,
      internal_task_id,
      clock_in_time,
      clock_out_time,
      break_duration_minutes = 0,
      work_description,
      location,
      notes,
      hourly_rate,
    } = body;

    // Resolve team_member_id when client sends 'me'
    if (team_member_id === "me" || !team_member_id) {
      const tm =
        await sql`SELECT id FROM team_members WHERE email = ${user.username} LIMIT 1`;
      if (!tm.length) {
        return Response.json(
          { error: "Current user is not linked to a team member" },
          { status: 400 },
        );
      }
      team_member_id = tm[0].id;
    }

    if (!team_member_id || !clock_in_time) {
      return Response.json(
        {
          error: "Team member ID and clock in time are required",
        },
        { status: 400 },
      );
    }

    // Calculate totals if clock_out_time is provided
    let total_hours = null;
    let total_cost = null;

    if (clock_out_time) {
      const clockIn = new Date(clock_in_time);
      const clockOut = new Date(clock_out_time);
      const totalMinutes =
        (clockOut - clockIn) / (1000 * 60) - (break_duration_minutes || 0);
      total_hours = Math.max(0, totalMinutes / 60);
      if (hourly_rate) {
        total_cost = total_hours * parseFloat(hourly_rate);
      }
    }

    const result = await sql`
      INSERT INTO time_tracking (
        team_member_id, project_id, internal_task_id, clock_in_time, clock_out_time,
        break_duration_minutes, total_hours, hourly_rate, total_cost,
        work_description, location, notes, status
      ) VALUES (
        ${team_member_id}, ${project_id}, ${internal_task_id}, ${clock_in_time}, ${clock_out_time},
        ${break_duration_minutes}, ${total_hours}, ${hourly_rate}, ${total_cost},
        ${work_description}, ${location}, ${notes}, ${clock_out_time ? "completed" : "active"}
      )
      RETURNING *
    `;

    return Response.json({ timeEntry: result[0] }, { status: 201 });
  } catch (error) {
    console.error("Error creating time entry:", error);
    return Response.json(
      { error: "Failed to create time entry" },
      { status: 500 },
    );
  }
}

export async function PUT(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updateFields } = body;

    if (!id) {
      return Response.json(
        { error: "Time entry ID is required" },
        { status: 400 },
      );
    }

    // If non-owner, ensure the entry belongs to the current painter
    if (user.role !== "owner") {
      const tm =
        await sql`SELECT id FROM team_members WHERE email = ${user.username} LIMIT 1`;
      if (!tm.length)
        return Response.json(
          { error: "Team member not found" },
          { status: 404 },
        );
      const entry =
        await sql`SELECT id FROM time_tracking WHERE id = ${id} AND team_member_id = ${tm[0].id}`;
      if (!entry.length)
        return Response.json(
          { error: "Not found or access denied" },
          { status: 404 },
        );
    }

    const allowedFields = [
      "clock_out_time",
      "break_duration_minutes",
      "work_description",
      "location",
      "notes",
      "status",
      "hourly_rate",
    ];

    const setClause = [];
    const values = [];
    let paramCount = 0;

    // Handle clock out and recalc
    if ("clock_out_time" in updateFields) {
      const currentRecord =
        await sql`SELECT * FROM time_tracking WHERE id = ${id}`;
      if (!currentRecord.length) {
        return Response.json(
          { error: "Time entry not found" },
          { status: 404 },
        );
      }
      const record = currentRecord[0];
      const clockIn = new Date(record.clock_in_time);
      const clockOut = new Date(updateFields.clock_out_time);
      const breakMinutes =
        updateFields.break_duration_minutes ||
        record.break_duration_minutes ||
        0;
      const totalMinutes = (clockOut - clockIn) / (1000 * 60) - breakMinutes;
      const totalHours = Math.max(0, totalMinutes / 60);
      const rate = updateFields.hourly_rate || record.hourly_rate;
      const totalCost = rate ? totalHours * parseFloat(rate) : null;
      updateFields.total_hours = totalHours;
      updateFields.total_cost = totalCost;
      updateFields.status = "completed";
    }

    Object.entries(updateFields).forEach(([field, value]) => {
      if (
        allowedFields.includes(field) ||
        field === "total_hours" ||
        field === "total_cost"
      ) {
        setClause.push(`${field} = $${++paramCount}`);
        values.push(value);
      }
    });

    if (setClause.length === 0) {
      return Response.json(
        { error: "No valid fields to update" },
        { status: 400 },
      );
    }

    setClause.push(`updated_at = $${++paramCount}`);
    values.push(new Date().toISOString());

    values.push(id);

    const query = `
      UPDATE time_tracking 
      SET ${setClause.join(", ")}
      WHERE id = $${++paramCount}
      RETURNING *
    `;

    const result = await sql(query, values);

    if (!result.length) {
      return Response.json({ error: "Time entry not found" }, { status: 404 });
    }

    return Response.json({ timeEntry: result[0] });
  } catch (error) {
    console.error("Error updating time entry:", error);
    return Response.json(
      { error: "Failed to update time entry" },
      { status: 500 },
    );
  }
}

export async function DELETE(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return Response.json(
        { error: "Time entry ID is required" },
        { status: 400 },
      );
    }

    // If non-owner, validate ownership
    if (user.role !== "owner") {
      const tm =
        await sql`SELECT id FROM team_members WHERE email = ${user.username} LIMIT 1`;
      if (!tm.length)
        return Response.json(
          { error: "Team member not found" },
          { status: 404 },
        );
      const entry =
        await sql`SELECT id FROM time_tracking WHERE id = ${parseInt(id)} AND team_member_id = ${tm[0].id}`;
      if (!entry.length)
        return Response.json(
          { error: "Not found or access denied" },
          { status: 404 },
        );
    }

    const result = await sql`
      DELETE FROM time_tracking
      WHERE id = ${parseInt(id)}
      RETURNING id
    `;

    if (!result.length) {
      return Response.json({ error: "Time entry not found" }, { status: 404 });
    }

    return Response.json({ message: "Time entry deleted successfully" });
  } catch (error) {
    console.error("Error deleting time entry:", error);
    return Response.json(
      { error: "Failed to delete time entry" },
      { status: 500 },
    );
  }
}
