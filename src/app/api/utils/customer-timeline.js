// Read-only projection of canonical rows. This is internal staff activity, not
// an immutable audit log or customer-portal feed. Do not infer email ownership
// from matching addresses: only explicitly linked delivery logs are included.
export const TIMELINE_LIMIT = 200;

// Prefer an explicit lead ID; fallback links must not claim another lead's row.
const invoiceLead = (alias) => `COALESCE(${alias}.lead_id, (SELECT lead_id FROM contracts WHERE id = ${alias}.contract_id), (SELECT lead_id FROM projects WHERE id = ${alias}.project_id))`;
const invoicePredicate = `${invoiceLead("invoices")} = $1`;
const paymentPredicate = `COALESCE(payments.lead_id, (SELECT ${invoiceLead("i")} FROM invoices i WHERE i.id = payments.invoice_id), (SELECT lead_id FROM contracts WHERE id = payments.contract_id)) = $1`;
const sources = [
  ["lead", "leads", "Lead created", "lead_source", "NULL", "NULL", "id = $1 AND deleted_at IS NULL", [["created", "created_at"]]],
  ["appointment", "appointments", "Appointment recorded", "NULL", "NULL", "NULL", "lead_id = $1", [["created", "created_at"]]],
  ["follow_up", "follow_ups", "Follow-up recorded", "follow_up_type", "NULL", "NULL", "lead_id = $1", [["created", "created_at"]]],
  ["estimate", "estimates", "Estimate", "estimate_number", "total_cost", "created_by", "lead_id = $1", [["created", "created_at"], ["accepted", "accepted_at"]]],
  ["contract", "contracts", "Contract", "contract_number", "total_amount", "created_by", "lead_id = $1", [["created", "created_at"], ["sent", "sent_at"], ["viewed", "viewed_at"], ["customer_signed", "client_signed_at"], ["contractor_signed", "contractor_signed_at"]]],
  ["project", "projects", "Job created", "project_name", "NULL", "NULL", "lead_id = $1", [["created", "created_at"]]],
  ["invoice", "invoices", "Invoice", "invoice_number", "total_amount", "created_by", invoicePredicate, [["created", "created_at"], ["sent", "sent_at"], ["paid", "paid_at"]]],
  ["payment", "payments", "Payment recorded", "payment_number", "amount", "recorded_by", paymentPredicate, [["created", "created_at"]]],
  ["email", "email_logs", "Email delivery attempt", "template_name", "NULL", "user_id", `(related_type = 'lead' AND related_id = $1) OR (related_type = 'estimate' AND related_id IN (SELECT id FROM estimates WHERE lead_id = $1)) OR (related_type = 'contract' AND related_id IN (SELECT id FROM contracts WHERE lead_id = $1)) OR (related_type = 'invoice' AND related_id IN (SELECT id FROM invoices WHERE ${invoicePredicate}))`, [["attempted", "sent_at"]]],
];

// Stable ordering before LIMIT is required on both engines:
// https://www.postgresql.org/docs/current/queries-limit.html
// https://dev.mysql.com/doc/refman/8.4/en/select.html
export const timelineQueries = sources.flatMap(([type, table, title, detail, amount, actor, predicate, milestones]) =>
  milestones.map(([milestone, timestamp]) => ({
    type, title, milestone,
    query: `SELECT id, ${detail} AS detail, ${amount} AS amount, ${actor} AS actor_id, ${type === "email" ? "status" : "NULL"} AS delivery_status, ${timestamp} AS occurred_at FROM ${table} WHERE (${predicate}) AND ${timestamp} IS NOT NULL ORDER BY ${timestamp} DESC, id DESC LIMIT ${TIMELINE_LIMIT + 1}`,
  })),
);

timelineQueries.push({
  type: "activity", title: "Staff activity", milestone: "recorded",
  query: `SELECT id, event_type, summary AS detail, actor_id, actor_name, NULL AS amount, NULL AS delivery_status, created_at AS occurred_at FROM customer_activity_events WHERE lead_id = $1 AND visibility = 'internal' ORDER BY created_at DESC, id DESC LIMIT ${TIMELINE_LIMIT + 1}`,
});

export async function loadCustomerTimeline(db, leadId) {
  const batches = await Promise.all(timelineQueries.map(async (source) => {
    const rows = await db(source.query, [leadId]);
    return rows.map((row) => ({
      id: `${source.type}:${row.id}:${source.milestone}`,
      event_type: row.event_type || source.type,
      entity_id: String(row.id),
      milestone: source.milestone,
      title: source.type === "activity" ? (row.event_type === "staff_note" ? "Staff note" : "Lead status changed") : source.milestone === "created" || source.milestone === "attempted" ? source.title : `${source.title} ${source.milestone.replaceAll("_", " ")}`,
      detail: row.detail || null,
      amount: row.amount == null ? null : String(row.amount),
      actor: row.actor_id == null || source.type !== "activity" && source.milestone !== "created" && source.milestone !== "attempted" ? null : { user_id: row.actor_id, ...(row.actor_name ? { name: row.actor_name } : {}) },
      visibility: "internal",
      delivery_status: row.delivery_status || null,
      occurred_at: row.occurred_at,
    }));
  }));
  const events = batches.flat().sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime() || a.id.localeCompare(b.id));
  return { events: events.slice(0, TIMELINE_LIMIT), truncated: events.length > TIMELINE_LIMIT };
}
