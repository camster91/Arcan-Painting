import sql from "@/app/api/utils/sql";

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

async function getCurrentUser(request) {
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
  const cookies = parseCookies(request.headers.get("cookie"));
  const token = cookies["admin_session"];
  if (!token) return null;
  const rows = await sql`
    SELECT u.id, u.username, u.role, s.expires_at
    FROM auth_sessions s
    JOIN auth_users u ON u.id = s.user_id
    WHERE s.token = ${token}
    LIMIT 1
  `;
  const user = rows[0];
  if (!user) return null;
  const nowIso = new Date().toISOString();
  if (user.expires_at && user.expires_at < nowIso) {
    await sql`DELETE FROM auth_sessions WHERE token = ${token}`;
    return null;
  }
  return { id: user.id, username: user.username, role: user.role };
}

export async function POST(request, { params }) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "owner") {
      return Response.json(
        { error: "Forbidden - Owners only" },
        { status: 403 },
      );
    }

    const id = parseInt(params.id, 10);
    if (!id)
      return Response.json({ error: "Invalid estimate id" }, { status: 400 });

    const body = await request.json().catch(() => ({}));
    const projectName = body?.project_name;

    // Load estimate
    const [estRows] = await Promise.all([
      sql`SELECT id, lead_id, project_title, total_cost FROM estimates WHERE id = ${id} LIMIT 1`,
    ]);
    if (!estRows.length)
      return Response.json({ error: "Estimate not found" }, { status: 404 });
    const est = estRows[0];

    // Approve estimate and create project in a transaction
    const [_, projectRows] = await sql.transaction((txn) => [
      txn`UPDATE estimates SET status = 'approved', updated_at = CURRENT_TIMESTAMP WHERE id = ${id}`,
      txn`
        INSERT INTO projects (
          estimate_id, lead_id, project_name, status, final_cost, completion_percentage, created_at, updated_at
        ) VALUES (
          ${id}, ${est.lead_id}, ${projectName || est.project_title}, 'scheduled', ${est.total_cost || null}, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        ) RETURNING id, project_name, status
      `,
    ]);

    return Response.json({ success: true, project: projectRows[0] });
  } catch (err) {
    console.error("approve estimate error", err);
    return Response.json({ error: "Failed to approve" }, { status: 500 });
  }
}
