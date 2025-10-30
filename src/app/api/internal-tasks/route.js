import sql from "@/app/api/utils/sql";
// Using local admin session cookie like other admin APIs

async function ensureSchema() {
  await sql(`
    CREATE TABLE IF NOT EXISTS internal_tasks (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      status VARCHAR(20) DEFAULT 'todo',
      priority VARCHAR(20) DEFAULT 'medium',
      assignee_id INTEGER REFERENCES team_members(id) ON DELETE SET NULL,
      due_date DATE,
      created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await sql(
    `CREATE INDEX IF NOT EXISTS idx_internal_tasks_status ON internal_tasks(status);`,
  );
  await sql(
    `CREATE INDEX IF NOT EXISTS idx_internal_tasks_priority ON internal_tasks(priority);`,
  );
  await sql(
    `CREATE INDEX IF NOT EXISTS idx_internal_tasks_assignee ON internal_tasks(assignee_id);`,
  );
  await sql(
    `CREATE INDEX IF NOT EXISTS idx_internal_tasks_due_date ON internal_tasks(due_date);`,
  );
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
function parseCookies(h) {
  const out = {};
  if (!h) return out;
  h.split(";").forEach((p) => {
    const [k, v] = p.split("=");
    if (!k) return;
    out[k.trim()] = decodeURIComponent((v || "").trim());
  });
  return out;
}
async function requireAdmin(request) {
  try {
    await ensureAuthTables();
  } catch {}
  const cookies = parseCookies(request.headers.get("cookie"));
  const token = cookies["admin_session"];
  if (!token) return false;
  const rows =
    await sql`SELECT expires_at FROM auth_sessions WHERE token = ${token} LIMIT 1`;
  const row = rows[0];
  if (!row) return false;
  const nowIso = new Date().toISOString();
  if (row.expires_at && row.expires_at < nowIso) {
    await sql`DELETE FROM auth_sessions WHERE token = ${token}`;
    return false;
  }
  return true;
}

function buildFilters(searchParams) {
  const where = [];
  const values = [];
  let i = 1;
  const status = searchParams.get("status");
  const priority = searchParams.get("priority");
  const assigneeId = searchParams.get("assignee_id");
  const search = searchParams.get("search");
  const overdue = searchParams.get("overdue");
  if (status && status !== "all") {
    where.push(`status = $${i++}`);
    values.push(status);
  }
  if (priority && priority !== "all") {
    where.push(`priority = $${i++}`);
    values.push(priority);
  }
  if (assigneeId) {
    where.push(`assignee_id = $${i++}`);
    values.push(parseInt(assigneeId, 10));
  }
  if (search) {
    where.push(
      `(LOWER(title) LIKE LOWER($${i}) OR LOWER(description) LIKE LOWER($${i}))`,
    );
    values.push(`%${search}%`);
    i++;
  }
  if (overdue === "true") {
    where.push(
      `due_date IS NOT NULL AND due_date < CURRENT_DATE AND status <> 'done'`,
    );
  }
  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";
  return { whereClause, values };
}

export async function GET(request) {
  const ok = await requireAdmin(request);
  if (!ok) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    await ensureSchema();
    const url = new URL(request.url);
    const { whereClause, values } = buildFilters(url.searchParams);
    const tasks = await sql(
      `SELECT t.*, tm.name AS assignee_name, tm.email AS assignee_email
       FROM internal_tasks t
       LEFT JOIN team_members tm ON tm.id = t.assignee_id
       ${whereClause}
       ORDER BY 
         CASE t.status WHEN 'in_progress' THEN 0 WHEN 'todo' THEN 1 WHEN 'blocked' THEN 2 WHEN 'done' THEN 3 ELSE 4 END,
         COALESCE(t.due_date, DATE '9999-12-31') ASC,
         CASE t.priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 ELSE 4 END ASC,
         t.id DESC`,
      values,
    );
    const statsRows = await sql(
      `SELECT status, COUNT(*) AS count FROM internal_tasks GROUP BY status`,
    );
    const stats = statsRows.reduce((acc, row) => {
      acc[row.status] = Number(row.count);
      return acc;
    }, {});
    const overdueRow = await sql(
      `SELECT COUNT(*) AS count FROM internal_tasks WHERE due_date IS NOT NULL AND due_date < CURRENT_DATE AND status <> 'done'`,
    );
    const teamMembers = await sql(
      `SELECT id, name, email FROM team_members WHERE status = 'active' ORDER BY name ASC`,
    );
    return Response.json({
      tasks,
      stats,
      overdue: Number(overdueRow[0]?.count || 0),
      teamMembers,
    });
  } catch (e) {
    console.error("GET /api/internal-tasks error", e);
    return Response.json({ error: "Failed to load tasks" }, { status: 500 });
  }
}

export async function POST(request) {
  const ok = await requireAdmin(request);
  if (!ok) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    await ensureSchema();
    const body = await request.json();
    const {
      title,
      description = null,
      status = "todo",
      priority = "medium",
      assignee_id = null,
      due_date = null,
    } = body || {};
    if (!title || typeof title !== "string") {
      return Response.json({ error: "Title is required" }, { status: 400 });
    }
    const rows = await sql(
      `INSERT INTO internal_tasks (title, description, status, priority, assignee_id, due_date)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [title, description, status, priority, assignee_id, due_date],
    );
    return Response.json({ task: rows[0] }, { status: 201 });
  } catch (e) {
    console.error("POST /api/internal-tasks error", e);
    return Response.json({ error: "Failed to create task" }, { status: 500 });
  }
}

export async function PUT(request) {
  const ok = await requireAdmin(request);
  if (!ok) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    await ensureSchema();
    const body = await request.json();
    const { id, ...updates } = body || {};
    if (!id)
      return Response.json({ error: "Task id is required" }, { status: 400 });

    const setClauses = [];
    const values = [];
    let i = 1;
    const allowed = [
      "title",
      "description",
      "status",
      "priority",
      "assignee_id",
      "due_date",
    ];
    for (const key of allowed) {
      if (key in updates) {
        setClauses.push(`${key} = $${i++}`);
        values.push(updates[key]);
      }
    }
    setClauses.push(`updated_at = CURRENT_TIMESTAMP`);
    if (setClauses.length === 1) {
      return Response.json(
        { error: "No updatable fields provided" },
        { status: 400 },
      );
    }
    values.push(id);
    const rows = await sql(
      `UPDATE internal_tasks SET ${setClauses.join(", ")} WHERE id = $${i} RETURNING *`,
      values,
    );
    if (!rows[0])
      return Response.json({ error: "Task not found" }, { status: 404 });
    return Response.json({ task: rows[0] });
  } catch (e) {
    console.error("PUT /api/internal-tasks error", e);
    return Response.json({ error: "Failed to update task" }, { status: 500 });
  }
}

export async function DELETE(request) {
  const ok = await requireAdmin(request);
  if (!ok) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    await ensureSchema();
    const url = new URL(request.url);
    const id = Number(url.searchParams.get("id"));
    if (!id)
      return Response.json({ error: "Task id is required" }, { status: 400 });
    const rows = await sql(
      `DELETE FROM internal_tasks WHERE id = $1 RETURNING id`,
      [id],
    );
    if (!rows[0])
      return Response.json({ error: "Task not found" }, { status: 404 });
    return Response.json({ success: true });
  } catch (e) {
    console.error("DELETE /api/internal-tasks error", e);
    return Response.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
