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
  const authHeader =
    request.headers.get("Authorization") ||
    request.headers.get("authorization");
  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    const token = authHeader.slice(7);
    const sessions = await sql`
      SELECT * FROM auth_sessions WHERE token = ${token} AND expires_at > NOW()
    `;
    if (sessions.length) {
      const users = await sql`
        SELECT id, username, role FROM auth_users WHERE id = ${sessions[0].user_id} LIMIT 1
      `;
      if (users.length) return users[0];
    }
  }
  // Fallback: cookie-based session
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

async function ensureProjectAccess(user, projectId) {
  if (!user) return false;
  if (user.role === "owner") return true;
  // Painters need to be assigned to the project
  const rows = await sql`
    SELECT p.id
    FROM projects p
    LEFT JOIN team_members tm ON p.assigned_painter_id = tm.id
    WHERE p.id = ${projectId} AND tm.email = ${user.username}
    LIMIT 1
  `;
  return rows.length > 0;
}

export async function GET(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const project_id = searchParams.get("project_id");
    if (!project_id) {
      return Response.json(
        { error: "project_id is required" },
        { status: 400 },
      );
    }

    const hasAccess = await ensureProjectAccess(user, parseInt(project_id));
    if (!hasAccess)
      return Response.json({ error: "Forbidden" }, { status: 403 });

    const steps = await sql`
      SELECT * FROM completion_workflows
      WHERE project_id = ${parseInt(project_id)}
      ORDER BY step_order ASC
    `;

    return Response.json({ steps });
  } catch (e) {
    console.error("GET /api/completion-workflows error", e);
    return Response.json(
      { error: "Failed to load workflows" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const {
      project_id,
      step_title,
      step_description,
      step_order,
      is_required = true,
      estimated_hours,
    } = body || {};

    if (!project_id || !step_title) {
      return Response.json(
        { error: "project_id and step_title are required" },
        { status: 400 },
      );
    }

    const hasAccess = await ensureProjectAccess(user, parseInt(project_id));
    if (!hasAccess)
      return Response.json({ error: "Forbidden" }, { status: 403 });

    const result = await sql`
      INSERT INTO completion_workflows (
        project_id,
        step_title,
        step_description,
        step_order,
        is_required,
        estimated_hours,
        created_at,
        updated_at
      ) VALUES (
        ${parseInt(project_id)},
        ${step_title},
        ${step_description || null},
        ${parseInt(step_order) || 1},
        ${is_required},
        ${estimated_hours ? parseFloat(estimated_hours) : null},
        ${new Date().toISOString()},
        ${new Date().toISOString()}
      )
      RETURNING *
    `;

    return Response.json({ step: result[0] }, { status: 201 });
  } catch (e) {
    console.error("POST /api/completion-workflows error", e);
    return Response.json(
      { error: "Failed to create workflow step" },
      { status: 500 },
    );
  }
}

export async function PUT(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { id, is_completed } = body || {};
    if (!id || typeof is_completed !== "boolean") {
      return Response.json(
        { error: "id and is_completed are required" },
        { status: 400 },
      );
    }

    // Verify access to the workflow's project
    const rows =
      await sql`SELECT project_id FROM completion_workflows WHERE id = ${id}`;
    if (!rows.length)
      return Response.json({ error: "Not found" }, { status: 404 });

    const hasAccess = await ensureProjectAccess(user, rows[0].project_id);
    if (!hasAccess)
      return Response.json({ error: "Forbidden" }, { status: 403 });

    // Resolve team_member id for completed_by, if possible
    const tmRows = await sql`
      SELECT id FROM team_members WHERE email = ${user.username} LIMIT 1
    `;
    const completedBy = tmRows[0]?.id || null;

    const result = await sql`
      UPDATE completion_workflows
      SET is_completed = ${is_completed},
          completed_at = ${is_completed ? new Date().toISOString() : null},
          completed_by = ${is_completed ? completedBy : null},
          updated_at = ${new Date().toISOString()}
      WHERE id = ${id}
      RETURNING *
    `;

    return Response.json({ step: result[0] });
  } catch (e) {
    console.error("PUT /api/completion-workflows error", e);
    return Response.json(
      { error: "Failed to update workflow" },
      { status: 500 },
    );
  }
}
