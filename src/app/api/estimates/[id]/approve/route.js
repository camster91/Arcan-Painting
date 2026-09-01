import sql from "@/app/api/utils/sql";
import { getCurrentUser } from "@/app/api/utils/auth";
import { auditLog } from "@/app/api/utils/audit";

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

    // Lock the estimate so retries and double-clicks cannot create duplicate jobs.
    const result = await sql.transaction(async (txn) => {
      const estimates = await txn`
        SELECT id, lead_id, project_title, total_cost, status
        FROM estimates
        WHERE id = ${id}
        FOR UPDATE
      `;
      if (!estimates.length) return { error: "Estimate not found", status: 404 };
      const estimate = estimates[0];
      if (["rejected", "expired", "cancelled"].includes(estimate.status)) {
        return { error: `A ${estimate.status} estimate cannot be approved`, status: 409 };
      }

      const existingProjects = await txn`
        SELECT id, project_name, status
        FROM projects
        WHERE estimate_id = ${id}
        ORDER BY created_at ASC
        LIMIT 1
      `;
      if (existingProjects.length) {
        if (estimate.status !== "approved") {
          await txn`UPDATE estimates SET status = 'approved', updated_at = CURRENT_TIMESTAMP WHERE id = ${id}`;
        }
        return { project: existingProjects[0], created: false };
      }

      await txn`UPDATE estimates SET status = 'approved', updated_at = CURRENT_TIMESTAMP WHERE id = ${id}`;
      const projects = await txn`
        INSERT INTO projects (
          estimate_id, lead_id, project_name, status, final_cost, completion_percentage, created_at, updated_at
        ) VALUES (
          ${id}, ${estimate.lead_id}, ${projectName?.trim() || estimate.project_title}, 'scheduled', ${estimate.total_cost || null}, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        ) RETURNING id, project_name, status
      `;
      return { project: projects[0], created: true };
    });

    if (result.error) return Response.json({ error: result.error }, { status: result.status });

    await auditLog({
      request,
      action: result.created ? "estimate.approve_and_create_project" : "estimate.approve_retry",
      userId: user.id,
      username: user.username,
      resource: "estimate",
      resourceId: id,
      changes: { project_id: result.project.id, created: result.created },
      status: "success",
    });

    return Response.json({ success: true, project: result.project, created: result.created });
  } catch (err) {
    console.error("approve estimate error", err);
    return Response.json({ error: "Failed to approve" }, { status: 500 });
  }
}
