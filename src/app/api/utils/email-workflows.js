import sql from "./sql.js";

const supportedEvents = new Set([
  "estimate_sent",
  "estimate_approved",
  "invoice_sent",
  "payment_received",
  "project_start",
]);

/**
 * Persist retry-safe workflow jobs for a business event.
 * This never sends email inline. Production automation remains inert unless the
 * operator explicitly enables EMAIL_AUTOMATIONS_ENABLED=true and configures the worker.
 */
export async function queueEmailWorkflows({ event, recipientEmail, data = {}, relatedType, relatedId }) {
  if (process.env.EMAIL_AUTOMATIONS_ENABLED !== "true") {
    return { enabled: false, queued: 0 };
  }
  if (!supportedEvents.has(event)) throw new Error(`Unsupported email workflow event: ${event}`);
  const recipient = String(recipientEmail || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
    return { enabled: true, queued: 0, reason: "missing_recipient" };
  }

  const workflows = await sql`
    SELECT w.id, w.delay_hours, t.name AS template_name
    FROM email_workflows w
    JOIN email_templates t ON w.template_id = t.id
    WHERE w.trigger_event = ${event} AND w.is_active = true AND t.is_active = true
  `;
  let queued = 0;
  for (const workflow of workflows) {
    const rows = await sql`
      INSERT INTO delayed_emails (
        workflow_id, template_name, recipient_email, data, scheduled_for,
        related_type, related_id, status
      ) VALUES (
        ${workflow.id}, ${workflow.template_name}, ${recipient}, ${JSON.stringify(data)},
        CURRENT_TIMESTAMP + (${Number(workflow.delay_hours) || 0} * INTERVAL '1 hour'),
        ${relatedType || null}, ${relatedId || null}, 'pending'
      )
      ON CONFLICT (workflow_id, related_id) WHERE related_id IS NOT NULL DO NOTHING
      RETURNING id
    `;
    queued += rows.length;
  }
  return { enabled: true, queued };
}
