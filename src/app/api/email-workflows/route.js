import sql from "@/app/api/utils/sql";
import { getCurrentUser, unauthorizedResponse } from "@/app/api/utils/auth";
import { generalLimiter } from "@/app/api/utils/rate-limit";
import { auditLog } from "@/app/api/utils/audit";

const triggers = new Set(["estimate_sent", "estimate_approved", "invoice_sent", "payment_received", "project_start"]);
async function operator(request) {
  const user = await getCurrentUser(request);
  return user && ["owner", "admin"].includes(user.role) ? user : null;
}

export async function GET(request) {
  const limited = generalLimiter(request); if (limited) return limited;
  const user = await operator(request); if (!user) return unauthorizedResponse();
  const workflows = await sql`
    SELECT w.*, t.name AS template_name, t.display_name AS template_display_name
    FROM email_workflows w LEFT JOIN email_templates t ON w.template_id = t.id
    ORDER BY w.created_at DESC
  `;
  return Response.json({ workflows, execution_enabled: false });
}

export async function POST(request) {
  const user = await operator(request); if (!user) return unauthorizedResponse();
  const body = await request.json().catch(() => ({}));
  const templateId = Number(body.template_id); const delay = Number(body.delay_hours || 0);
  if (!body.name?.trim() || !triggers.has(body.trigger_event) || !Number.isInteger(templateId) || delay < 0) {
    return Response.json({ error: "Valid name, trigger, template, and non-negative delay are required" }, { status: 400 });
  }
  const templates = await sql`SELECT id FROM email_templates WHERE id = ${templateId} AND is_active = true`;
  if (!templates.length) return Response.json({ error: "Active template not found" }, { status: 400 });
  const [workflow] = await sql`
    INSERT INTO email_workflows (name, trigger_event, template_id, delay_hours, conditions, is_active)
    VALUES (${body.name.trim()}, ${body.trigger_event}, ${templateId}, ${delay}, ${JSON.stringify(body.conditions || {})}, ${Boolean(body.is_active)})
    RETURNING *
  `;
  await auditLog({ request, action: "email_workflow.create", userId: user.id, username: user.username, resource: "email_workflow", resourceId: workflow.id, changes: { trigger_event: body.trigger_event, execution_enabled: false }, status: "success" });
  return Response.json({ workflow, execution_enabled: false }, { status: 201 });
}

export async function PUT(request) {
  const user = await operator(request); if (!user) return unauthorizedResponse();
  const body = await request.json().catch(() => ({})); const id = Number(body.id);
  if (!Number.isInteger(id)) return Response.json({ error: "Valid workflow id is required" }, { status: 400 });
  const [workflow] = await sql`
    UPDATE email_workflows SET
      name = COALESCE(${body.name ?? null}, name),
      trigger_event = COALESCE(${body.trigger_event ?? null}, trigger_event),
      template_id = COALESCE(${body.template_id ?? null}, template_id),
      delay_hours = COALESCE(${body.delay_hours ?? null}, delay_hours),
      conditions = COALESCE(${body.conditions ? JSON.stringify(body.conditions) : null}::jsonb, conditions),
      is_active = COALESCE(${body.is_active ?? null}, is_active)
    WHERE id = ${id} RETURNING *
  `;
  if (!workflow) return Response.json({ error: "Workflow not found" }, { status: 404 });
  await auditLog({ request, action: "email_workflow.update", userId: user.id, username: user.username, resource: "email_workflow", resourceId: id, changes: body, status: "success" });
  return Response.json({ workflow, execution_enabled: false });
}

export async function DELETE(request) {
  const user = await operator(request); if (!user) return unauthorizedResponse();
  const { id } = await request.json().catch(() => ({}));
  const deleted = await sql`DELETE FROM email_workflows WHERE id = ${Number(id)} RETURNING id, name`;
  if (!deleted.length) return Response.json({ error: "Workflow not found" }, { status: 404 });
  await auditLog({ request, action: "email_workflow.delete", userId: user.id, username: user.username, resource: "email_workflow", resourceId: id, changes: { name: deleted[0].name }, status: "success" });
  return Response.json({ success: true });
}
