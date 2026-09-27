import sql from "@/app/api/utils/sql";
import { getCurrentUser } from "@/app/api/utils/auth";
import { approveEstimate } from "@/app/api/utils/approve-estimate";

export async function POST(request, { params }) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "owner") {
      return Response.json({ error: "Forbidden - Owners only" }, { status: 403 });
    }

    const id = parseInt(params.id, 10);
    if (!id) return Response.json({ error: "Invalid estimate id" }, { status: 400 });

    const body = await request.json().catch(() => ({}));
    const result = await sql.transaction((tx) => approveEstimate(tx, id, { projectName: body?.project_name }));
    if (result.error) return Response.json({ error: result.error }, { status: result.status });

    // Approving twice must not create a second job for the same estimate.
    if (!result.created) {
      return Response.json({ error: "This estimate already has a project", project: result.project }, { status: 409 });
    }
    return Response.json({ success: true, project: result.project });
  } catch (err) {
    console.error("approve estimate error", err);
    return Response.json({ error: "Failed to approve" }, { status: 500 });
  }
}
