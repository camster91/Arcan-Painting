import sql from "@/app/api/utils/sql";
import { getCurrentUser } from "@/app/api/utils/auth";
import { auditLog } from "@/app/api/utils/audit";
import { generalLimiter } from "@/app/api/utils/rate-limit";
import { canTransitionProjectIssue, validateProjectIssueInput } from "@/app/api/utils/project-issues-domain";

const isOwner = (user) => user?.role === "owner";
async function canAccess(user, projectId, query = sql) {
  if (isOwner(user)) return true;
  const rows = await query`SELECT p.id FROM projects p LEFT JOIN team_members tm ON tm.id = p.assigned_painter_id WHERE p.id = ${projectId} AND (LOWER(tm.email) = LOWER(${user.username}) OR EXISTS (
    SELECT 1 FROM project_crew_members pcm JOIN team_members ctm ON ctm.id = pcm.team_member_id
    WHERE pcm.project_id = p.id AND pcm.removed_at IS NULL AND LOWER(ctm.email) = LOWER(${user.username})
  ))`;
  return rows.length > 0;
}

export async function GET(request) {
  const limited = generalLimiter(request); if (limited) return limited;
  const user = await getCurrentUser(request); if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const projectId = Number(new URL(request.url).searchParams.get("project_id"));
  if (!Number.isInteger(projectId)) return Response.json({ error: "Valid project_id is required" }, { status: 400 });
  if (!(await canAccess(user, projectId))) return Response.json({ error: "Forbidden" }, { status: 403 });
  const issues = await sql`SELECT pi.*, tm.name AS assigned_to_name FROM project_issues pi LEFT JOIN team_members tm ON tm.id = pi.assigned_to WHERE pi.project_id = ${projectId} ORDER BY CASE pi.severity WHEN 'critical' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END, pi.created_at DESC`;
  return Response.json({ issues });
}

export async function POST(request) {
  const limited = generalLimiter(request); if (limited) return limited;
  const user = await getCurrentUser(request); if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => ({})); const projectId = Number(body.project_id);
  if (!Number.isInteger(projectId)) return Response.json({ error: "Valid project_id is required" }, { status: 400 });
  if (!(await canAccess(user, projectId))) return Response.json({ error: "Forbidden" }, { status: 403 });
  let input; try { input = validateProjectIssueInput(body); } catch (error) { return Response.json({ error: error.message }, { status: 400 }); }
  const assignedTo = isOwner(user) && Number.isInteger(Number(body.assigned_to)) ? Number(body.assigned_to) : null;
  if (assignedTo) { const members = await sql`SELECT id FROM team_members WHERE id = ${assignedTo} AND status = 'active'`; if (!members.length) return Response.json({ error: "Assigned team member is inactive or missing" }, { status: 409 }); }
  if (body.due_date && !/^\d{4}-\d{2}-\d{2}$/.test(body.due_date)) return Response.json({ error: "Due date is invalid" }, { status: 400 });
  const [issue] = await sql`INSERT INTO project_issues (project_id, issue_type, severity, title, description, assigned_to, due_date, created_by, created_by_name) VALUES (${projectId}, ${input.type}, ${input.severity}, ${input.title}, ${input.description}, ${assignedTo}, ${body.due_date || null}, ${user.id}, ${user.username}) RETURNING *`;
  await auditLog({ request, action: "project_issue.create", userId: user.id, username: user.username, resource: "project_issue", resourceId: issue.id, changes: { project_id: projectId, severity: input.severity, issue_type: input.type }, status: "success" });
  return Response.json({ issue }, { status: 201 });
}

export async function PUT(request) {
  const user = await getCurrentUser(request); if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => ({})); const id = Number(body.id);
  if (!Number.isInteger(id)) return Response.json({ error: "Valid issue id is required" }, { status: 400 });
  const result = await sql.transaction(async (txn) => {
    const [issue] = await txn`SELECT * FROM project_issues WHERE id = ${id} FOR UPDATE`;
    if (!issue) return { error: "Issue not found", status: 404 };
    if (!(await canAccess(user, Number(issue.project_id), txn))) return { error: "Forbidden", status: 403 };
    const next = body.status || issue.status;
    if (!canTransitionProjectIssue(issue.status, next, { owner: isOwner(user) })) return { error: `Issue cannot move from ${issue.status} to ${next}`, status: 409 };
    if (next === "resolved" && (typeof body.resolution !== "string" || body.resolution.trim().length < 3)) return { error: "A resolution is required before resolving an issue", status: 400 };
    if (body.resolution?.length > 5000) return { error: "Resolution must be 5000 characters or fewer", status: 400 };
    let editable = { type: issue.issue_type, severity: issue.severity, title: issue.title, description: issue.description };
    if (isOwner(user) && ["issue_type", "severity", "title", "description"].some((key) => body[key] !== undefined)) {
      try { editable = validateProjectIssueInput({ issue_type: body.issue_type ?? issue.issue_type, severity: body.severity ?? issue.severity, title: body.title ?? issue.title, description: body.description ?? issue.description }); }
      catch (error) { return { error: error.message, status: 400 }; }
    }
    let assignedTo = issue.assigned_to; let dueDate = issue.due_date;
    if (isOwner(user) && body.assigned_to !== undefined) {
      assignedTo = body.assigned_to === null ? null : Number(body.assigned_to);
      if (assignedTo !== null && !Number.isInteger(assignedTo)) return { error: "Assigned team member is invalid", status: 400 };
      if (assignedTo !== null) { const members = await txn`SELECT id FROM team_members WHERE id = ${assignedTo} AND status = 'active'`; if (!members.length) return { error: "Assigned team member is inactive or missing", status: 409 }; }
    }
    if (isOwner(user) && body.due_date !== undefined) { if (body.due_date && !/^\d{4}-\d{2}-\d{2}$/.test(body.due_date)) return { error: "Due date is invalid", status: 400 }; dueDate = body.due_date || null; }
    const [updated] = await txn`UPDATE project_issues SET issue_type = ${editable.type}, severity = ${editable.severity}, title = ${editable.title}, description = ${editable.description}, status = ${next}, resolution = ${body.resolution ?? issue.resolution}, assigned_to = ${assignedTo}, due_date = ${dueDate}, resolved_at = CASE WHEN ${next} = 'resolved' THEN COALESCE(resolved_at, CURRENT_TIMESTAMP) WHEN status = 'resolved' AND ${next} <> 'resolved' THEN NULL ELSE resolved_at END, updated_at = CURRENT_TIMESTAMP WHERE id = ${id} RETURNING *`;
    return { issue: updated, previous: issue.status };
  });
  if (result.error) return Response.json({ error: result.error }, { status: result.status });
  await auditLog({ request, action: "project_issue.update", userId: user.id, username: user.username, resource: "project_issue", resourceId: id, changes: { from_status: result.previous, to_status: result.issue.status, severity: result.issue.severity }, status: "success" });
  return Response.json({ issue: result.issue });
}
