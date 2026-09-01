import sql from "@/app/api/utils/sql";
import { getCurrentUser } from "@/app/api/utils/auth";
import { hasPermission } from "@/app/api/utils/permissions";
import { generalLimiter } from "@/app/api/utils/rate-limit";
import { calculateJobCostSummary } from "@/app/api/utils/project-expenses-domain";

const ALLOWED_PERIODS = new Set([30, 90, 365]);

export async function GET(request) {
  const limited = generalLimiter(request);
  if (limited) return limited;
  const user = await getCurrentUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(user, "job_cost.read"))
    return Response.json({ error: "Forbidden" }, { status: 403 });

  const rawDays = new URL(request.url).searchParams.get("days") || "90";
  const days = rawDays === "all" ? null : Number(rawDays);
  if (days !== null && !ALLOWED_PERIODS.has(days))
    return Response.json(
      { error: "days must be 30, 90, 365, or all" },
      { status: 400 },
    );

  const values = [];
  const periodFilter = days
    ? `WHERE p.created_at >= CURRENT_DATE - ($1::int * INTERVAL '1 day')`
    : "";
  if (days) values.push(days);
  const projects = await sql(
    `SELECT p.id, p.project_name, p.status, p.created_at,
      COALESCE(p.final_cost, contract.total_amount, e.total_cost, 0) AS contract_value,
      COALESCE(e.labor_cost, 0) AS estimated_labor,
      COALESCE(e.material_cost, 0) AS estimated_materials,
      COALESCE(labor.labor_actual, 0) AS labor_actual,
      COALESCE(labor.labor_hours, 0) AS labor_hours,
      COALESCE(expenses.expense_actual, 0) AS expense_actual,
      COALESCE(commitments.committed_cost, 0) AS committed_cost,
      COALESCE(billing.invoiced, 0) AS invoiced,
      COALESCE(billing.collected, 0) AS collected
    FROM projects p
    LEFT JOIN estimates e ON e.id = p.estimate_id
    LEFT JOIN LATERAL (
      SELECT c.total_amount FROM contracts c
      WHERE c.project_id = p.id AND c.status IN ('signed', 'completed')
      ORDER BY c.created_at DESC LIMIT 1
    ) contract ON TRUE
    LEFT JOIN LATERAL (
      SELECT SUM(tt.total_cost) AS labor_actual, SUM(tt.total_hours) AS labor_hours
      FROM time_tracking tt WHERE tt.project_id = p.id AND tt.status = 'completed'
    ) labor ON TRUE
    LEFT JOIN LATERAL (
      SELECT SUM(pe.total_amount) AS expense_actual FROM project_expenses pe
      WHERE pe.project_id = p.id AND pe.status = 'recorded'
    ) expenses ON TRUE
    LEFT JOIN LATERAL (
      SELECT SUM(po.total_amount) AS committed_cost FROM purchase_orders po
      WHERE po.project_id = p.id AND po.status IN ('approved', 'ordered')
    ) commitments ON TRUE
    LEFT JOIN LATERAL (
      SELECT
        SUM(i.total_amount) FILTER (WHERE i.status NOT IN ('draft', 'void', 'cancelled')) AS invoiced,
        (SELECT SUM(pay.amount) FROM payments pay JOIN invoices pi ON pi.id = pay.invoice_id
          WHERE pi.project_id = p.id AND pay.status = 'cleared') AS collected
      FROM invoices i WHERE i.project_id = p.id
    ) billing ON TRUE
    ${periodFilter}
    ORDER BY p.created_at DESC, p.id DESC`,
    values,
  );

  const rows = projects.map((project) => ({
    id: project.id,
    project_name: project.project_name,
    status: project.status,
    created_at: project.created_at,
    labor_hours: Number(project.labor_hours || 0),
    ...calculateJobCostSummary({
      contractValue: project.contract_value,
      estimatedLabor: project.estimated_labor,
      estimatedMaterials: project.estimated_materials,
      laborActual: project.labor_actual,
      expenseActual: project.expense_actual,
      committedCost: project.committed_cost,
      invoiced: project.invoiced,
      collected: project.collected,
    }),
  }));
  const totals = calculateJobCostSummary({
    contractValue: rows.reduce((sum, row) => sum + row.contract_value, 0),
    estimatedLabor: rows.reduce((sum, row) => sum + row.estimated_labor, 0),
    estimatedMaterials: rows.reduce(
      (sum, row) => sum + row.estimated_materials,
      0,
    ),
    laborActual: rows.reduce((sum, row) => sum + row.labor_actual, 0),
    expenseActual: rows.reduce((sum, row) => sum + row.expense_actual, 0),
    committedCost: rows.reduce((sum, row) => sum + row.committed_cost, 0),
    invoiced: rows.reduce((sum, row) => sum + row.invoiced, 0),
    collected: rows.reduce((sum, row) => sum + row.collected, 0),
  });

  return Response.json({
    as_of: new Date().toISOString(),
    period_days: days,
    totals,
    projects: rows.sort(
      (a, b) =>
        (a.projected_margin_percent ?? Number.POSITIVE_INFINITY) -
        (b.projected_margin_percent ?? Number.POSITIVE_INFINITY),
    ),
  });
}
