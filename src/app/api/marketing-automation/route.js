import sql from "@/app/api/utils/sql";
import { getCurrentUser } from "@/app/api/utils/auth";
import { generalLimiter } from "@/app/api/utils/rate-limit";
import { auditLog } from "@/app/api/utils/audit";
import { queueEmailWorkflows } from "@/app/api/utils/email-workflows";

const events = new Set([
  "estimate_follow_up",
  "dormant_lead",
  "review_request",
  "referral_request",
]);

async function candidates(event) {
  if (event === "estimate_follow_up")
    return sql`SELECT DISTINCT ON (l.id) l.id AS lead_id, l.name, l.email, e.id AS related_id, e.estimate_number AS reference FROM leads l JOIN estimates e ON e.lead_id = l.id WHERE l.deleted_at IS NULL AND l.marketing_consent_status = 'opted_in' AND l.email <> '' AND l.status NOT IN ('won', 'lost') AND e.status = 'sent' AND COALESCE(e.updated_at, e.created_at) <= CURRENT_TIMESTAMP - INTERVAL '3 days' AND NOT EXISTS (SELECT 1 FROM estimates approved WHERE approved.lead_id = l.id AND approved.status = 'approved') ORDER BY l.id, e.created_at DESC`;
  if (event === "dormant_lead")
    return sql`SELECT l.id AS lead_id, l.name, l.email, l.id AS related_id, l.status AS reference FROM leads l WHERE l.deleted_at IS NULL AND l.marketing_consent_status = 'opted_in' AND l.email <> '' AND l.status IN ('contacted', 'qualified', 'follow_up') AND COALESCE(l.last_contacted_at, l.updated_at, l.created_at) <= CURRENT_TIMESTAMP - INTERVAL '30 days'`;
  if (event === "review_request")
    return sql`SELECT DISTINCT ON (l.id) l.id AS lead_id, l.name, l.email, p.id AS related_id, p.project_name AS reference FROM leads l JOIN projects p ON p.lead_id = l.id WHERE l.deleted_at IS NULL AND l.marketing_consent_status = 'opted_in' AND l.email <> '' AND p.status = 'completed' AND COALESCE(p.end_date, p.updated_at::date) <= CURRENT_DATE - 2 ORDER BY l.id, p.updated_at DESC`;
  return sql`SELECT DISTINCT ON (l.id) l.id AS lead_id, l.name, l.email, p.id AS related_id, p.project_name AS reference FROM leads l JOIN projects p ON p.lead_id = l.id WHERE l.deleted_at IS NULL AND l.marketing_consent_status = 'opted_in' AND l.email <> '' AND p.status = 'completed' AND COALESCE(p.end_date, p.updated_at::date) <= CURRENT_DATE - 14 ORDER BY l.id, p.updated_at DESC`;
}

export async function GET(request) {
  const limited = generalLimiter(request);
  if (limited) return limited;
  const user = await getCurrentUser(request);
  if (user?.role !== "owner")
    return Response.json({ error: "Owner access required" }, { status: 403 });
  const event = new URL(request.url).searchParams.get("event");
  if (!events.has(event))
    return Response.json({ error: "Valid event is required" }, { status: 400 });
  const rows = await candidates(event);
  return Response.json({
    event,
    execution_enabled: process.env.EMAIL_AUTOMATIONS_ENABLED === "true",
    candidate_count: rows.length,
    candidates: rows,
  });
}

export async function POST(request) {
  const limited = generalLimiter(request);
  if (limited) return limited;
  const user = await getCurrentUser(request);
  if (user?.role !== "owner")
    return Response.json({ error: "Owner access required" }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  if (!events.has(body.event) || body.confirm_queue !== true)
    return Response.json(
      { error: "Valid event and confirm_queue=true are required" },
      { status: 400 },
    );
  const rows = await candidates(body.event);
  let queued = 0;
  for (const row of rows) {
    const result = await queueEmailWorkflows({
      event: body.event,
      recipientEmail: row.email,
      relatedType: body.event,
      relatedId: row.related_id,
      data: {
        lead_id: row.lead_id,
        lead_name: row.name,
        reference: row.reference,
        requires_marketing_consent: true,
      },
    });
    queued += result.queued || 0;
  }
  await auditLog({
    request,
    action: "marketing_automation.queue",
    userId: user.id,
    username: user.username,
    resource: "marketing_automation",
    resourceId: body.event,
    changes: {
      candidates: rows.length,
      queued,
      execution_enabled: process.env.EMAIL_AUTOMATIONS_ENABLED === "true",
    },
    status: "success",
  });
  return Response.json({
    event: body.event,
    candidates: rows.length,
    queued,
    execution_enabled: process.env.EMAIL_AUTOMATIONS_ENABLED === "true",
  });
}
