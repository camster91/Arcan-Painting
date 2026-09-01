import sql from "@/app/api/utils/sql";
import { getCurrentUser } from "@/app/api/utils/auth";
import { auditLog } from "@/app/api/utils/audit";
import { requireCsrf } from "@/app/api/utils/csrf";
import {
  RETENTION_POLICY,
  anonymizationConfirmation,
  privacyHoldReason,
} from "@/app/api/utils/privacy-domain";

async function owner(request) {
  const user = await getCurrentUser(request);
  return user?.role === "owner" ? user : null;
}

async function customerExport(leadId) {
  const [[lead], appointments, followUps, estimates, contracts, projects, changeOrders, invoices, payments] = await Promise.all([
    sql`SELECT * FROM leads WHERE id = ${leadId}`,
    sql`SELECT * FROM appointments WHERE lead_id = ${leadId} ORDER BY created_at`,
    sql`SELECT * FROM follow_ups WHERE lead_id = ${leadId} ORDER BY created_at`,
    sql`SELECT * FROM estimates WHERE lead_id = ${leadId} ORDER BY created_at`,
    sql`SELECT * FROM contracts WHERE lead_id = ${leadId} ORDER BY created_at`,
    sql`SELECT * FROM projects WHERE lead_id = ${leadId} ORDER BY created_at`,
    sql`SELECT * FROM change_orders WHERE lead_id = ${leadId} ORDER BY created_at`,
    sql`SELECT * FROM invoices WHERE lead_id = ${leadId} ORDER BY created_at`,
    sql`SELECT pay.* FROM payments pay LEFT JOIN invoices i ON i.id = pay.invoice_id LEFT JOIN contracts c ON c.id = pay.contract_id WHERE COALESCE(pay.lead_id, i.lead_id, c.lead_id) = ${leadId} ORDER BY pay.created_at`,
  ]);
  if (!lead) return null;
  return { lead, appointments, follow_ups: followUps, estimates, contracts, projects, change_orders: changeOrders, invoices, payments };
}

export async function GET(request) {
  const user = await owner(request);
  if (!user) return Response.json({ error: "Owner access required" }, { status: 403 });
  const leadId = Number(new URL(request.url).searchParams.get("lead_id"));
  if (!Number.isInteger(leadId)) {
    return Response.json({ retention_policy: RETENTION_POLICY });
  }
  const data = await customerExport(leadId);
  if (!data) return Response.json({ error: "Customer not found" }, { status: 404 });
  await auditLog({ request, action: "privacy.customer_export", userId: user.id, username: user.username, resource: "lead", resourceId: leadId, changes: { included_sections: Object.keys(data) } });
  return Response.json(
    { exported_at: new Date().toISOString(), retention_policy: RETENTION_POLICY, customer_data: data },
    { headers: { "Cache-Control": "private, no-store", "Content-Disposition": `attachment; filename="customer-${leadId}-data.json"` } },
  );
}

export async function POST(request) {
  const csrfError = requireCsrf(request);
  if (csrfError) return csrfError;
  const user = await owner(request);
  if (!user) return Response.json({ error: "Owner access required" }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  const leadId = Number(body.lead_id);
  if (!Number.isInteger(leadId) || body.confirmation !== anonymizationConfirmation(leadId)) {
    return Response.json({ error: `Confirmation must exactly match ${anonymizationConfirmation(leadId)}` }, { status: 400 });
  }

  const [facts] = await sql`SELECT
    (SELECT COUNT(*) FROM invoices WHERE lead_id = ${leadId} AND amount_due > 0 AND status NOT IN ('void', 'cancelled')) AS unsettled_invoices,
    (SELECT COUNT(*) FROM projects WHERE lead_id = ${leadId} AND status NOT IN ('completed', 'cancelled')) AS active_projects,
    (SELECT COUNT(*) FROM contracts WHERE lead_id = ${leadId} AND client_signed_at IS NOT NULL) AS signed_contracts,
    (SELECT COUNT(*) FROM payments pay LEFT JOIN invoices i ON i.id = pay.invoice_id LEFT JOIN contracts c ON c.id = pay.contract_id WHERE COALESCE(pay.lead_id, i.lead_id, c.lead_id) = ${leadId}) AS financial_records`;
  const hold = privacyHoldReason(facts);
  if (hold) return Response.json({ error: "Retention hold", reason: hold, retention_policy: RETENTION_POLICY }, { status: 409 });

  const result = await sql.transaction(async (tx) => {
    const [lead] = await tx`SELECT id FROM leads WHERE id = ${leadId} FOR UPDATE`;
    if (!lead) return null;
    await tx`UPDATE customer_portal_tokens SET revoked_at = COALESCE(revoked_at, CURRENT_TIMESTAMP) WHERE lead_id = ${leadId}`;
    await tx`UPDATE appointments SET name = 'Anonymized customer', email = '', phone = '', address = '', notes = NULL WHERE lead_id = ${leadId}`;
    await tx`UPDATE follow_ups SET notes = NULL, status = CASE WHEN status = 'pending' THEN 'cancelled' ELSE status END WHERE lead_id = ${leadId}`;
    await tx`UPDATE delayed_emails SET status = 'cancelled' WHERE data->>'lead_id' = ${String(leadId)} AND status IN ('pending', 'processing')`;
    const [updated] = await tx`UPDATE leads SET name = 'Anonymized customer', email = ${`anonymized+${leadId}@invalid.local`}, phone = '', address = '', project_description = NULL, notes = NULL, meta_lead_id = NULL, attribution = '{}'::jsonb, marketing_consent_status = 'opted_out', marketing_consent_at = CURRENT_TIMESTAMP, marketing_consent_source = 'privacy_request', deleted_at = COALESCE(deleted_at, CURRENT_TIMESTAMP), updated_at = CURRENT_TIMESTAMP WHERE id = ${leadId} RETURNING id`;
    return updated;
  });
  if (!result) return Response.json({ error: "Customer not found" }, { status: 404 });
  await auditLog({ request, action: "privacy.customer_anonymize", userId: user.id, username: user.username, resource: "lead", resourceId: leadId, changes: { portal_access_revoked: true, marketing_opted_out: true } });
  return Response.json({ success: true, lead_id: leadId, anonymized_at: new Date().toISOString() });
}
