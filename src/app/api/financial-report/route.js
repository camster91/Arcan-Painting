import sql from "@/app/api/utils/sql";
import { getCurrentUser } from "@/app/api/utils/auth";
import { generalLimiter } from "@/app/api/utils/rate-limit";
import { agingBucket, toCsv } from "@/app/api/utils/accounting-export-domain";

const columns = [
  "record_type",
  "date",
  "number",
  "project",
  "customer",
  "vendor",
  "category",
  "status",
  "net_amount",
  "tax_amount",
  "total_amount",
  "reference",
];

export async function GET(request) {
  const limited = generalLimiter(request);
  if (limited) return limited;
  const user = await getCurrentUser(request);
  if (user?.role !== "owner")
    return Response.json({ error: "Owner access required" }, { status: 403 });
  const format = new URL(request.url).searchParams.get("format") || "json";
  const receivables =
    await sql`SELECT i.id, i.invoice_number, i.due_date, i.amount_due, i.total_amount, i.payment_status, GREATEST(0, CURRENT_DATE - COALESCE(i.due_date, CURRENT_DATE))::int AS days_overdue, COALESCE(l.name, '') AS customer, COALESCE(p.project_name, '') AS project FROM invoices i LEFT JOIN leads l ON l.id = i.lead_id LEFT JOIN projects p ON p.id = i.project_id WHERE i.status NOT IN ('draft', 'void', 'cancelled') AND i.amount_due > 0 ORDER BY i.due_date ASC NULLS LAST`;
  const buckets = {
    current: 0,
    days_1_30: 0,
    days_31_60: 0,
    days_61_90: 0,
    days_90_plus: 0,
  };
  for (const invoice of receivables)
    buckets[agingBucket(invoice.days_overdue)] += Number(
      invoice.amount_due || 0,
    );
  const aging = Object.fromEntries(
    Object.entries(buckets).map(([key, value]) => [
      key,
      Math.round((value + Number.EPSILON) * 100) / 100,
    ]),
  );
  if (format === "json")
    return Response.json({
      as_of: new Date().toISOString(),
      aging,
      total_receivable: Object.values(aging).reduce(
        (sum, value) => sum + value,
        0,
      ),
      invoices: receivables,
    });
  if (format !== "csv")
    return Response.json(
      { error: "format must be json or csv" },
      { status: 400 },
    );
  const [invoices, payments, expenses, purchases] = await Promise.all([
    sql`SELECT 'invoice' AS record_type, i.issue_date AS date, i.invoice_number AS number, COALESCE(p.project_name, '') AS project, COALESCE(l.name, '') AS customer, '' AS vendor, i.invoice_type AS category, i.payment_status AS status, i.subtotal AS net_amount, i.tax_amount, i.total_amount, '' AS reference FROM invoices i LEFT JOIN projects p ON p.id = i.project_id LEFT JOIN leads l ON l.id = i.lead_id WHERE i.status NOT IN ('void', 'cancelled')`,
    sql`SELECT 'payment' AS record_type, pay.payment_date AS date, pay.payment_number AS number, COALESCE(p.project_name, '') AS project, COALESCE(l.name, '') AS customer, '' AS vendor, pay.payment_method AS category, pay.status, pay.amount AS net_amount, 0 AS tax_amount, pay.amount AS total_amount, COALESCE(pay.payment_reference, '') AS reference FROM payments pay LEFT JOIN invoices i ON i.id = pay.invoice_id LEFT JOIN projects p ON p.id = i.project_id LEFT JOIN leads l ON l.id = COALESCE(pay.lead_id, i.lead_id)`,
    sql`SELECT 'expense' AS record_type, e.incurred_on AS date, 'EXP-' || e.id AS number, COALESCE(p.project_name, '') AS project, '' AS customer, COALESCE(e.vendor, '') AS vendor, e.category, e.status, e.amount AS net_amount, e.tax_amount, e.total_amount, COALESCE(e.receipt_url, '') AS reference FROM project_expenses e JOIN projects p ON p.id = e.project_id`,
    sql`SELECT 'purchase_order' AS record_type, po.created_at::date AS date, po.purchase_order_number AS number, COALESCE(p.project_name, '') AS project, '' AS customer, po.vendor, po.category, po.status, po.amount AS net_amount, po.tax_amount, po.total_amount, COALESCE(po.order_reference, '') AS reference FROM purchase_orders po JOIN projects p ON p.id = po.project_id`,
  ]);
  const body = toCsv(
    [...invoices, ...payments, ...expenses, ...purchases].sort((a, b) =>
      String(a.date || "").localeCompare(String(b.date || "")),
    ),
    columns,
  );
  const date = new Date().toISOString().slice(0, 10);
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="arcan-accounting-${date}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
