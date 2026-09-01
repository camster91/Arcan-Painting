import sql from "@/app/api/utils/sql";
import { getCurrentUser, unauthorizedResponse } from "@/app/api/utils/auth";
import { generalLimiter } from "@/app/api/utils/rate-limit";
import { auditLog } from "@/app/api/utils/audit";

async function operator(request) {
  const user = await getCurrentUser(request);
  return user && ["owner", "admin"].includes(user.role) ? user : null;
}

export async function GET(request) {
  const limited = generalLimiter(request); if (limited) return limited;
  const user = await operator(request); if (!user) return unauthorizedResponse();
  const templates = await sql`
    SELECT id, name, display_name, subject_template, body_template,
      body_template AS html_template, text_template, category, is_active,
      created_at, updated_at
    FROM email_templates ORDER BY display_name ASC, name ASC
  `;
  return Response.json({ templates });
}

export async function POST(request) {
  const user = await operator(request); if (!user) return unauthorizedResponse();
  const body = await request.json().catch(() => ({}));
  const name = body.name?.trim(); const displayName = body.display_name?.trim(); const subject = body.subject_template?.trim();
  if (!name || !displayName || !subject) return Response.json({ error: "Name, display name, and subject are required" }, { status: 400 });
  if (!/^[a-z0-9_-]+$/i.test(name)) return Response.json({ error: "Name may contain only letters, numbers, underscores, and dashes" }, { status: 400 });
  try {
    const [template] = await sql`
      INSERT INTO email_templates (name, display_name, subject_template, body_template, text_template, category, is_active, updated_at)
      VALUES (${name}, ${displayName}, ${subject}, ${body.html_template || body.body_template || ""}, ${body.text_template || null}, ${body.category || "general"}, true, CURRENT_TIMESTAMP)
      RETURNING *, body_template AS html_template
    `;
    await auditLog({ request, action: "email_template.create", userId: user.id, username: user.username, resource: "email_template", resourceId: template.id, changes: { name }, status: "success" });
    return Response.json({ template }, { status: 201 });
  } catch (error) {
    if (error.code === "23505") return Response.json({ error: "Template name already exists" }, { status: 409 });
    return Response.json({ error: "Failed to create template" }, { status: 500 });
  }
}

export async function PUT(request) {
  const user = await operator(request); if (!user) return unauthorizedResponse();
  const body = await request.json().catch(() => ({}));
  const id = Number(body.id); if (!Number.isInteger(id)) return Response.json({ error: "Valid template id is required" }, { status: 400 });
  const [template] = await sql`
    UPDATE email_templates SET
      display_name = COALESCE(${body.display_name ?? null}, display_name),
      subject_template = COALESCE(${body.subject_template ?? null}, subject_template),
      body_template = COALESCE(${body.html_template ?? body.body_template ?? null}, body_template),
      text_template = COALESCE(${body.text_template ?? null}, text_template),
      category = COALESCE(${body.category ?? null}, category),
      is_active = COALESCE(${body.is_active ?? null}, is_active),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id} RETURNING *, body_template AS html_template
  `;
  if (!template) return Response.json({ error: "Template not found" }, { status: 404 });
  await auditLog({ request, action: "email_template.update", userId: user.id, username: user.username, resource: "email_template", resourceId: id, changes: body, status: "success" });
  return Response.json({ template });
}

export async function DELETE(request) {
  const user = await operator(request); if (!user) return unauthorizedResponse();
  const { id } = await request.json().catch(() => ({}));
  const deleted = await sql`DELETE FROM email_templates WHERE id = ${Number(id)} RETURNING id, name`;
  if (!deleted.length) return Response.json({ error: "Template not found" }, { status: 404 });
  await auditLog({ request, action: "email_template.delete", userId: user.id, username: user.username, resource: "email_template", resourceId: id, changes: { name: deleted[0].name }, status: "success" });
  return Response.json({ success: true });
}
