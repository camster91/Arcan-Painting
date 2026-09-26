import sql from "@/app/api/utils/sql";
import { getCurrentUser } from "@/app/api/utils/auth";

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

    // Approving twice must not create a second job for the same estimate.
    const existing = await sql`SELECT id, project_name, status FROM projects WHERE estimate_id = ${id} LIMIT 1`;
    if (existing.length) {
      return Response.json(
        { error: "This estimate already has a project", project: existing[0] },
        { status: 409 },
      );
    }

    // Approve estimate and create project in a transaction
    const [_, projectRows] = await sql.transaction(async (txn) => {
      const updateResult = await txn`UPDATE estimates SET status = 'approved', updated_at = CURRENT_TIMESTAMP WHERE id = ${id}`;
      const insertResult = await txn`
        INSERT INTO projects (
          estimate_id, lead_id, project_name, status, final_cost, completion_percentage, created_at, updated_at
        ) VALUES (
          ${id}, ${est.lead_id}, ${projectName || est.project_title}, 'scheduled', ${est.total_cost || null}, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        ) RETURNING id, project_name, status
      `;
      return [updateResult, insertResult];
    });

    return Response.json({ success: true, project: projectRows[0] });
  } catch (err) {
    console.error("approve estimate error", err);
    return Response.json({ error: "Failed to approve" }, { status: 500 });
  }
}
