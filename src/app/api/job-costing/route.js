import sql from "@/app/api/utils/sql";
import { getCurrentUser } from "@/app/api/utils/auth";
import { generalLimiter } from "@/app/api/utils/rate-limit";
import { calculateJobCostSummary } from "@/app/api/utils/project-expenses-domain";

export async function GET(request) {
  const limited = generalLimiter(request); if (limited) return limited;
  const user = await getCurrentUser(request); if (user?.role !== "owner") return Response.json({ error: "Owner access required" }, { status: 403 });
  const projectId = Number(new URL(request.url).searchParams.get("project_id"));
  if (!Number.isInteger(projectId)) return Response.json({ error: "Valid project_id is required" }, { status: 400 });
  const [[project], [labor], [expenses], [billing], categories] = await Promise.all([
    sql`SELECT p.id, p.project_name, p.status, COALESCE(p.final_cost, c.total_amount, e.total_cost, 0) AS contract_value, COALESCE(e.labor_cost, 0) AS estimated_labor, COALESCE(e.material_cost, 0) AS estimated_materials FROM projects p LEFT JOIN estimates e ON e.id = p.estimate_id LEFT JOIN contracts c ON c.project_id = p.id AND c.status IN ('signed', 'completed') WHERE p.id = ${projectId} ORDER BY c.created_at DESC LIMIT 1`,
    sql`SELECT COALESCE(SUM(total_cost), 0) AS labor_actual, COALESCE(SUM(total_hours), 0) AS labor_hours FROM time_tracking WHERE project_id = ${projectId} AND status = 'completed'`,
    sql`SELECT COALESCE(SUM(total_amount), 0) AS expense_actual FROM project_expenses WHERE project_id = ${projectId} AND status = 'recorded'`,
    sql`SELECT
      (SELECT COALESCE(SUM(i.total_amount), 0) FROM invoices i WHERE i.project_id = ${projectId} AND i.status NOT IN ('draft', 'void', 'cancelled')) AS invoiced,
      (SELECT COALESCE(SUM(pay.amount), 0) FROM payments pay JOIN invoices i ON i.id = pay.invoice_id WHERE i.project_id = ${projectId} AND pay.status = 'cleared') AS collected`,
    sql`SELECT category, COALESCE(SUM(total_amount), 0) AS total FROM project_expenses WHERE project_id = ${projectId} AND status = 'recorded' GROUP BY category ORDER BY category`,
  ]);
  if (!project) return Response.json({ error: "Project not found" }, { status: 404 });
  const summary = calculateJobCostSummary({ contractValue: project.contract_value, estimatedLabor: project.estimated_labor, estimatedMaterials: project.estimated_materials, laborActual: labor.labor_actual, expenseActual: expenses.expense_actual, invoiced: billing.invoiced, collected: billing.collected });
  return Response.json({ project, summary: { ...summary, labor_hours: Number(labor.labor_hours || 0) }, expense_categories: categories });
}
