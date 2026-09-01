import sql from "@/app/api/utils/sql";
import { getCurrentUser } from "@/app/api/utils/auth";
import { hasPermission } from "@/app/api/utils/permissions";
import { generalLimiter } from "@/app/api/utils/rate-limit";
import { summarizeFunnel } from "@/app/api/utils/funnel-domain";
import { toCsv } from "@/app/api/utils/accounting-export-domain";

const allowedDays = new Set([7, 30, 90, 365]);

export async function GET(request) {
  const limited = generalLimiter(request);
  if (limited) return limited;
  const user = await getCurrentUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(user, "marketing.read"))
    return Response.json({ error: "Forbidden" }, { status: 403 });
  const url = new URL(request.url);
  const days = allowedDays.has(Number(url.searchParams.get("days")))
    ? Number(url.searchParams.get("days"))
    : 30;
  const format = url.searchParams.get("format") || "json";
  const start = new Date();
  start.setUTCDate(start.getUTCDate() - days);
  const startDate = start.toISOString();
  const rows = await sql`WITH lead_facts AS (
    SELECT l.id, l.created_at, l.status, l.service_type, l.lost_reason,
      COALESCE(NULLIF(l.attribution->>'utmSource', ''), l.lead_source, 'unknown') AS source,
      COALESCE(NULLIF(l.attribution->>'utmCampaign', ''), '(none)') AS campaign,
      COALESCE(NULLIF(l.attribution->>'landingPage', ''), '(unknown)') AS landing_page,
      CASE WHEN l.status IN ('qualified', 'proposal_sent', 'won') OR l.qualification_score >= 60 THEN 1 ELSE 0 END AS qualified,
      CASE WHEN EXISTS (SELECT 1 FROM estimates e WHERE e.lead_id = l.id AND e.status NOT IN ('draft', 'cancelled', 'void')) THEN 1 ELSE 0 END AS estimated,
      COALESCE((SELECT SUM(pay.amount) FROM payments pay JOIN invoices i ON i.id = pay.invoice_id WHERE i.lead_id = l.id AND pay.status = 'cleared'), 0) AS revenue,
      CASE WHEN l.won_at IS NOT NULL THEN EXTRACT(EPOCH FROM (l.won_at - l.created_at)) / 86400 ELSE NULL END AS sales_cycle_days
    FROM leads l WHERE l.deleted_at IS NULL AND l.created_at >= ${startDate}
  ) SELECT source, campaign, landing_page, service_type,
      COUNT(*)::int AS leads, SUM(qualified)::int AS qualified, SUM(estimated)::int AS estimates,
      COUNT(*) FILTER (WHERE status = 'won')::int AS won, COUNT(*) FILTER (WHERE status = 'lost')::int AS lost,
      COALESCE(SUM(revenue), 0) AS revenue, AVG(sales_cycle_days) AS average_sales_cycle_days
    FROM lead_facts GROUP BY source, campaign, landing_page, service_type ORDER BY revenue DESC, leads DESC`;
  const [spendRow] =
    await sql`SELECT COALESCE(SUM(spend), 0) AS spend FROM marketing_campaigns WHERE start_date >= ${startDate}::date OR (start_date IS NULL AND created_at >= ${startDate})`;
  const totals = summarizeFunnel(
    rows.reduce(
      (result, row) => ({
        leads: result.leads + Number(row.leads),
        qualified: result.qualified + Number(row.qualified),
        estimates: result.estimates + Number(row.estimates),
        won: result.won + Number(row.won),
        lost: result.lost + Number(row.lost),
        revenue: result.revenue + Number(row.revenue),
        spend: Number(spendRow?.spend || 0),
      }),
      {
        leads: 0,
        qualified: 0,
        estimates: 0,
        won: 0,
        lost: 0,
        revenue: 0,
        spend: 0,
      },
    ),
  );
  const lostReasons =
    await sql`SELECT COALESCE(NULLIF(lost_reason, ''), 'Unspecified') AS reason, COUNT(*)::int AS count FROM leads WHERE deleted_at IS NULL AND status = 'lost' AND created_at >= ${startDate} GROUP BY 1 ORDER BY count DESC`;
  const breakdown = rows.map((row) => ({
    ...row,
    ...summarizeFunnel({ ...row, spend: 0 }),
    average_sales_cycle_days:
      row.average_sales_cycle_days == null
        ? null
        : Math.round(Number(row.average_sales_cycle_days) * 10) / 10,
  }));
  if (format === "csv") {
    const columns = [
      "source",
      "campaign",
      "landing_page",
      "service_type",
      "leads",
      "qualified",
      "estimates",
      "won",
      "lost",
      "close_rate_percent",
      "revenue",
      "average_ticket",
      "average_sales_cycle_days",
    ];
    return new Response(toCsv(breakdown, columns), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="arcan-funnel-${new Date().toISOString().slice(0, 10)}.csv"`,
        "Cache-Control": "private, no-store",
      },
    });
  }
  if (format !== "json")
    return Response.json(
      { error: "format must be json or csv" },
      { status: 400 },
    );
  return Response.json(
    {
      days,
      generated_at: new Date().toISOString(),
      totals,
      breakdown,
      lost_reasons: lostReasons,
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
