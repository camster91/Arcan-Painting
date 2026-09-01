import sql from "@/app/api/utils/sql";
import { getCurrentUser } from "@/app/api/utils/auth";
import { auditLog } from "@/app/api/utils/audit";
import { generalLimiter } from "@/app/api/utils/rate-limit";
import { validateProjectExpense } from "@/app/api/utils/project-expenses-domain";

const owner = (user) => user?.role === "owner";
async function hasAccess(user, projectId) {
  if (owner(user)) return true;
  const rows = await sql`SELECT p.id FROM projects p LEFT JOIN team_members tm ON tm.id = p.assigned_painter_id WHERE p.id = ${projectId} AND (LOWER(tm.email) = LOWER(${user.username}) OR EXISTS (SELECT 1 FROM project_crew_members pcm JOIN team_members ctm ON ctm.id = pcm.team_member_id WHERE pcm.project_id = p.id AND pcm.removed_at IS NULL AND LOWER(ctm.email) = LOWER(${user.username})))`;
  return rows.length > 0;
}

export async function GET(request) {
  const limited = generalLimiter(request); if (limited) return limited;
  const user = await getCurrentUser(request); if (!owner(user)) return Response.json({ error: "Owner access required" }, { status: 403 });
  const projectId = Number(new URL(request.url).searchParams.get("project_id"));
  if (!Number.isInteger(projectId)) return Response.json({ error: "Valid project_id is required" }, { status: 400 });
  const expenses = await sql`SELECT * FROM project_expenses WHERE project_id = ${projectId} ORDER BY incurred_on DESC, created_at DESC`;
  return Response.json({ expenses });
}

export async function POST(request) {
  const limited = generalLimiter(request); if (limited) return limited;
  const user = await getCurrentUser(request); if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => ({})); const projectId = Number(body.project_id);
  if (!Number.isInteger(projectId)) return Response.json({ error: "Valid project_id is required" }, { status: 400 });
  if (!(await hasAccess(user, projectId))) return Response.json({ error: "Forbidden" }, { status: 403 });
  let expense; try { expense = validateProjectExpense(body); } catch (error) { return Response.json({ error: error.message }, { status: 400 }); }
  const [row] = await sql`INSERT INTO project_expenses (project_id, category, description, vendor, amount, tax_amount, total_amount, incurred_on, receipt_url, recorded_by, recorded_by_name) VALUES (${projectId}, ${expense.category}, ${expense.description}, ${expense.vendor}, ${expense.amount}, ${expense.taxAmount}, ${expense.totalAmount}, ${expense.incurredOn}, ${expense.receiptUrl}, ${user.id}, ${user.username}) RETURNING *`;
  await auditLog({ request, action: "project_expense.create", userId: user.id, username: user.username, resource: "project_expense", resourceId: row.id, changes: { project_id: projectId, category: row.category, total_amount: row.total_amount }, status: "success" });
  return Response.json({ expense: row }, { status: 201 });
}

export async function PUT(request) {
  const user = await getCurrentUser(request); if (!owner(user)) return Response.json({ error: "Owner access required" }, { status: 403 });
  const body = await request.json().catch(() => ({})); const id = Number(body.id);
  if (!Number.isInteger(id) || body.status !== "void") return Response.json({ error: "A valid expense id and void status are required" }, { status: 400 });
  const [expense] = await sql`UPDATE project_expenses SET status = 'void', voided_at = COALESCE(voided_at, CURRENT_TIMESTAMP), voided_by = ${user.id}, updated_at = CURRENT_TIMESTAMP WHERE id = ${id} AND status = 'recorded' RETURNING *`;
  if (!expense) return Response.json({ error: "Recorded expense not found" }, { status: 404 });
  await auditLog({ request, action: "project_expense.void", userId: user.id, username: user.username, resource: "project_expense", resourceId: id, changes: { project_id: expense.project_id, total_amount: expense.total_amount }, status: "success" });
  return Response.json({ expense });
}
