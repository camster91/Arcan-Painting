import sql from "@/app/api/utils/sql";
import { auditLog } from "@/app/api/utils/audit";
import { createRateLimiter } from "@/app/api/utils/rate-limit";
import {
  canCustomerApproveEstimate,
  canCustomerDecideChangeOrder,
  canCustomerSignContract,
  hashCustomerPortalToken,
  isCustomerPortalToken,
  sanitizeCustomerPhotoUrls,
} from "@/app/api/utils/customer-portal";

const portalLimiter = createRateLimiter({ windowMs: 60_000, max: 30, prefix: "customer-portal" });

async function resolveAccess(token, { touch = true } = {}) {
  if (!isCustomerPortalToken(token)) return null;
  const hash = hashCustomerPortalToken(token);
  const [access] = await sql`
    SELECT id, lead_id, expires_at
    FROM customer_portal_tokens
    WHERE token_hash = ${hash} AND revoked_at IS NULL AND expires_at > CURRENT_TIMESTAMP
    LIMIT 1
  `;
  if (access && touch) await sql`UPDATE customer_portal_tokens SET last_used_at = CURRENT_TIMESTAMP WHERE id = ${access.id}`;
  return access || null;
}

async function portalSnapshot(leadId) {
  const [[customer], estimates, contracts, projects, changeOrders, invoices, payments, projectUpdates] = await Promise.all([
    sql`SELECT id, name FROM leads WHERE id = ${leadId} AND deleted_at IS NULL`,
    sql`SELECT id, estimate_number, project_title, project_description, total_cost, estimated_duration_days, status, valid_until, created_at FROM estimates WHERE lead_id = ${leadId} AND status IN ('sent', 'approved') ORDER BY created_at DESC`,
    sql`SELECT id, contract_number, title, description, scope_of_work, terms_and_conditions, payment_terms, warranty_terms, total_amount, deposit_amount, deposit_percentage, status, start_date, completion_date, estimated_duration_days, client_signed_at, signed_by_name, sent_at FROM contracts WHERE lead_id = ${leadId} AND status NOT IN ('draft', 'cancelled', 'void') ORDER BY created_at DESC`,
    sql`SELECT id, project_name, start_date, end_date, status, final_cost, completion_percentage FROM projects WHERE lead_id = ${leadId} AND status <> 'cancelled' ORDER BY created_at DESC`,
    sql`SELECT id, change_order_number, project_id, title, description, reason, amount, tax_rate, tax_amount, total_amount, schedule_impact_days, status, approved_at, rejected_at FROM change_orders WHERE lead_id = ${leadId} AND status IN ('sent', 'approved', 'rejected') ORDER BY created_at DESC`,
    sql`SELECT id, invoice_number, project_id, title, description, invoice_type, status, payment_status, issue_date, due_date, subtotal, tax_amount, total_amount, amount_paid, amount_due, sent_at, paid_at FROM invoices WHERE lead_id = ${leadId} AND status <> 'draft' ORDER BY created_at DESC`,
    sql`SELECT id, payment_number, invoice_id, amount, payment_method, payment_date, status, created_at FROM payments WHERE lead_id = ${leadId} AND status = 'cleared' ORDER BY COALESCE(payment_date, created_at::date) DESC, created_at DESC`,
    sql`SELECT pp.id, pp.project_id, pp.report_date, pp.work_description, pp.progress_percentage, pp.photos, pp.is_milestone, pp.milestone_description, pp.created_at, p.project_name FROM project_progress pp JOIN projects p ON p.id = pp.project_id WHERE p.lead_id = ${leadId} AND pp.customer_visible = TRUE ORDER BY pp.report_date DESC, pp.created_at DESC LIMIT 100`,
  ]);
  if (!customer) return null;
  const safeProjectUpdates = projectUpdates.map((update) => ({ ...update, photos: sanitizeCustomerPhotoUrls(update.photos) }));
  return { customer, estimates, contracts, projects, change_orders: changeOrders, invoices, payments, project_updates: safeProjectUpdates };
}

async function approveEstimate(leadId, estimateId) {
  return sql.transaction(async (txn) => {
    const [estimate] = await txn`SELECT id, lead_id, project_title, total_cost, status FROM estimates WHERE id = ${estimateId} FOR UPDATE`;
    if (!estimate || Number(estimate.lead_id) !== leadId) return { error: "Estimate not found", status: 404 };
    const [existing] = await txn`SELECT id, project_name, status FROM projects WHERE estimate_id = ${estimateId} ORDER BY created_at LIMIT 1`;
    if (estimate.status === "approved" && existing) return { project: existing, created: false };
    if (!canCustomerApproveEstimate(estimate.status)) return { error: "This estimate is not awaiting approval", status: 409 };
    await txn`UPDATE estimates SET status = 'approved', updated_at = CURRENT_TIMESTAMP WHERE id = ${estimateId}`;
    const [project] = existing ? [existing] : await txn`
      INSERT INTO projects (estimate_id, lead_id, project_name, status, final_cost, completion_percentage, created_at, updated_at)
      VALUES (${estimateId}, ${leadId}, ${estimate.project_title}, 'scheduled', ${estimate.total_cost || null}, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id, project_name, status
    `;
    return { project, created: !existing };
  });
}

async function signContract(leadId, contractId, name, consent) {
  if (!consent || typeof name !== "string" || name.trim().length < 2 || name.trim().length > 255) return { error: "Your full name and consent are required", status: 400 };
  return sql.transaction(async (txn) => {
    const [contract] = await txn`SELECT id, lead_id, status, signed_by_name, client_signed_at FROM contracts WHERE id = ${contractId} FOR UPDATE`;
    if (!contract || Number(contract.lead_id) !== leadId) return { error: "Contract not found", status: 404 };
    if (contract.client_signed_at || contract.status === "signed") return { contract, created: false };
    if (!canCustomerSignContract(contract.status)) return { error: "This contract is not awaiting signature", status: 409 };
    const signature = JSON.stringify({ type: "typed-name", name: name.trim(), consent: true, version: 1 });
    const [updated] = await txn`
      UPDATE contracts SET status = 'signed', signed_at = CURRENT_TIMESTAMP,
        client_signed_at = CURRENT_TIMESTAMP, signed_by_name = ${name.trim()},
        client_signature_data = ${signature}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${contractId} RETURNING id, status, signed_by_name, client_signed_at
    `;
    return { contract: updated, created: true };
  });
}

async function decideChangeOrder(leadId, changeOrderId, decision, name) {
  if (!["approved", "rejected"].includes(decision)) return { error: "Decision must be approved or rejected", status: 400 };
  if (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 255) return { error: "Your full name is required", status: 400 };
  return sql.transaction(async (txn) => {
    const [order] = await txn`SELECT * FROM change_orders WHERE id = ${changeOrderId} FOR UPDATE`;
    if (!order || Number(order.lead_id) !== leadId) return { error: "Change order not found", status: 404 };
    if (order.status === decision) return { changeOrder: order, created: false };
    if (!canCustomerDecideChangeOrder(order.status)) return { error: "This change order is no longer awaiting a decision", status: 409 };
    const [updated] = await txn`
      UPDATE change_orders SET status = ${decision},
        approved_by = CASE WHEN ${decision} = 'approved' THEN ${name.trim()} ELSE approved_by END,
        approved_at = CASE WHEN ${decision} = 'approved' THEN CURRENT_TIMESTAMP ELSE approved_at END,
        rejected_at = CASE WHEN ${decision} = 'rejected' THEN CURRENT_TIMESTAMP ELSE rejected_at END,
        updated_at = CURRENT_TIMESTAMP WHERE id = ${changeOrderId} RETURNING *
    `;
    if (decision === "approved") await txn`
      UPDATE projects SET final_cost = COALESCE(final_cost, 0) + ${Number(order.total_amount)},
        end_date = CASE WHEN end_date IS NOT NULL THEN end_date + ${Number(order.schedule_impact_days)} ELSE end_date END,
        updated_at = CURRENT_TIMESTAMP WHERE id = ${order.project_id}
    `;
    return { changeOrder: updated, created: true };
  });
}

export async function GET(request, { params }) {
  const limited = portalLimiter(request); if (limited) return limited;
  const access = await resolveAccess(params.token);
  if (!access) return Response.json({ error: "This portal link is invalid or has expired" }, { status: 401 });
  const snapshot = await portalSnapshot(Number(access.lead_id));
  if (!snapshot) return Response.json({ error: "Customer not found" }, { status: 404 });
  return Response.json(snapshot, { headers: { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } });
}

export async function POST(request, { params }) {
  const limited = portalLimiter(request); if (limited) return limited;
  const access = await resolveAccess(params.token);
  if (!access) return Response.json({ error: "This portal link is invalid or has expired" }, { status: 401 });
  const leadId = Number(access.lead_id);
  const body = await request.json().catch(() => ({}));
  const id = Number(body.id);
  if (!Number.isInteger(id)) return Response.json({ error: "Valid record id is required" }, { status: 400 });
  let result;
  if (body.action === "approve_estimate") result = await approveEstimate(leadId, id);
  else if (body.action === "sign_contract") result = await signContract(leadId, id, body.signed_by_name, body.consent);
  else if (body.action === "decide_change_order") result = await decideChangeOrder(leadId, id, body.decision, body.signed_by_name);
  else return Response.json({ error: "Unsupported portal action" }, { status: 400 });
  if (result.error) return Response.json({ error: result.error }, { status: result.status });

  await auditLog({ request, action: `customer_portal.${body.action}`, username: "customer", resource: body.action.replace(/^.*_/, ""), resourceId: id, changes: { lead_id: leadId, decision: body.decision, created: result.created }, status: "success" });
  return Response.json({ success: true, result, portal: await portalSnapshot(leadId) }, { headers: { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } });
}
