import sql from "@/app/api/utils/sql";
import { getCurrentUser, unauthorizedResponse } from "@/app/api/utils/auth";
import { generalLimiter } from "@/app/api/utils/rate-limit";
import { auditLog } from "@/app/api/utils/audit";

export async function GET(request) {
  const limited = generalLimiter(request); if (limited) return limited;
  const user = await getCurrentUser(request); if (!user) return unauthorizedResponse();
  const params = new URL(request.url).searchParams;
  const page = Math.max(1, Number(params.get("page")) || 1); const limit = 50; const offset = (page - 1) * limit;
  const days = Math.min(3650, Math.max(1, Number(params.get("days")) || 30));
  const status = params.get("status"); const template = params.get("template");
  const logs = await sql`
    SELECT * FROM email_logs
    WHERE sent_at >= CURRENT_TIMESTAMP - (${days} * INTERVAL '1 day')
      AND (${status || null}::text IS NULL OR status = ${status || null})
      AND (${template || null}::text IS NULL OR template_name = ${template || null})
    ORDER BY sent_at DESC LIMIT ${limit} OFFSET ${offset}
  `;
  const [summary] = await sql`
    SELECT COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE status = 'sent')::int AS sent,
      COUNT(*) FILTER (WHERE status = 'failed')::int AS failed,
      COUNT(*) FILTER (WHERE sent_at >= CURRENT_DATE)::int AS today
    FROM email_logs
    WHERE sent_at >= CURRENT_TIMESTAMP - (${days} * INTERVAL '1 day')
      AND (${status || null}::text IS NULL OR status = ${status || null})
      AND (${template || null}::text IS NULL OR template_name = ${template || null})
  `;
  const total = summary.total || 0; const sent = summary.sent || 0;
  return Response.json({ logs, stats: { ...summary, success_rate: total ? Math.round(sent / total * 1000) / 10 : 0 }, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
}

export async function DELETE(request) {
  const user = await getCurrentUser(request); if (!user || user.role !== "owner") return Response.json({ error: "Owner access required" }, { status: 403 });
  const days = Math.max(30, Number(new URL(request.url).searchParams.get("days")) || 90);
  const deleted = await sql`DELETE FROM email_logs WHERE sent_at < CURRENT_TIMESTAMP - (${days} * INTERVAL '1 day') RETURNING id`;
  await auditLog({ request, action: "email_logs.cleanup", userId: user.id, username: user.username, resource: "email_log", changes: { days, deleted_count: deleted.length }, status: "success" });
  return Response.json({ success: true, deleted_count: deleted.length });
}
