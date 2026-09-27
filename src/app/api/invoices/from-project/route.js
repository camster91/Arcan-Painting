import sql from "@/app/api/utils/sql";
import { getCurrentUser } from "@/app/api/utils/auth";
import { auditLog } from "@/app/api/utils/audit";
import { createProjectInvoice } from "@/app/api/utils/project-invoice";

// POST { project_id, kind: "deposit" | "final", deposit_percent?, due_days? }
export async function POST(request) {
  const user = await getCurrentUser(request);
  if (!user || !["owner", "admin"].includes(user.role)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const projectId = parseInt(body.project_id, 10);
    if (!projectId) return Response.json({ error: "project_id is required" }, { status: 400 });

    const result = await createProjectInvoice(sql, {
      projectId,
      kind: body.kind,
      depositPercent: body.deposit_percent ?? 25,
      dueDays: body.due_days,
      userId: user.id,
    });
    if (result.error) return Response.json({ error: result.error }, { status: result.status });

    await auditLog({
      request,
      action: "invoice.create_from_project",
      userId: user.id,
      username: user.username,
      resource: "invoice",
      resourceId: result.invoice.id,
      changes: { project_id: projectId, kind: body.kind, total: result.invoice.total_amount },
      status: "success",
    });
    return Response.json({ invoice: result.invoice }, { status: 201 });
  } catch (error) {
    console.error("Error creating invoice from project:", error);
    return Response.json({ error: "Failed to create invoice" }, { status: 500 });
  }
}
