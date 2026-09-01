import sql from "@/app/api/utils/sql";
import { getCurrentUser, unauthorizedResponse } from "@/app/api/utils/auth";
import { generalLimiter } from "@/app/api/utils/rate-limit";

export async function GET(request, { params }) {
  const limited = generalLimiter(request);
  if (limited) return limited;
  const user = await getCurrentUser(request);
  if (!user) return unauthorizedResponse();

  const leadId = Number(params.id);
  if (!Number.isInteger(leadId) || leadId <= 0) {
    return Response.json({ error: "Invalid lead id" }, { status: 400 });
  }

  try {
    const leads = await sql`SELECT id, name FROM leads WHERE id = ${leadId} AND deleted_at IS NULL`;
    if (!leads.length) return Response.json({ error: "Lead not found" }, { status: 404 });

    const events = await sql`
      SELECT * FROM (
        SELECT 'lead'::text AS event_type, l.id::text AS entity_id,
          'Lead created'::text AS title, l.lead_source::text AS detail,
          l.status::text AS status, l.estimated_value::numeric AS amount, l.created_at AS occurred_at
        FROM leads l WHERE l.id = ${leadId}
        UNION ALL
        SELECT 'appointment', a.id::text, 'Site visit / appointment', a.notes, a.status, NULL::numeric, a.created_at
        FROM appointments a WHERE a.lead_id = ${leadId}
        UNION ALL
        SELECT 'follow_up', f.id::text, 'Follow-up: ' || COALESCE(f.follow_up_type, 'task'), f.notes,
          f.status, NULL::numeric, COALESCE(f.created_at, f.follow_up_date::timestamp)
        FROM follow_ups f WHERE f.lead_id = ${leadId}
        UNION ALL
        SELECT 'estimate', e.id::text, 'Estimate ' || e.estimate_number, e.project_title,
          e.status, e.total_cost, e.created_at
        FROM estimates e WHERE e.lead_id = ${leadId}
        UNION ALL
        SELECT 'contract', c.id::text, 'Contract ' || c.contract_number, c.title,
          c.status, c.total_amount, c.created_at
        FROM contracts c WHERE c.lead_id = ${leadId}
        UNION ALL
        SELECT 'project', p.id::text, 'Project', p.project_name,
          p.status, p.final_cost, p.created_at
        FROM projects p WHERE p.lead_id = ${leadId}
        UNION ALL
        SELECT 'invoice', i.id::text, 'Invoice ' || i.invoice_number, i.title,
          i.payment_status, i.total_amount, i.created_at
        FROM invoices i WHERE i.lead_id = ${leadId}
        UNION ALL
        SELECT 'payment', pay.id::text, 'Payment ' || pay.payment_number, pay.payment_method,
          pay.status, pay.amount, pay.created_at
        FROM payments pay
        LEFT JOIN invoices i ON pay.invoice_id = i.id
        LEFT JOIN contracts c ON pay.contract_id = c.id
        WHERE COALESCE(pay.lead_id, i.lead_id, c.lead_id) = ${leadId}
        UNION ALL
        SELECT 'email', el.id::text, 'Email: ' || COALESCE(el.subject, 'No subject'), el.error_message,
          el.status, NULL::numeric, el.sent_at
        FROM email_logs el
        JOIN leads l ON LOWER(el.to_email) = LOWER(l.email)
        WHERE l.id = ${leadId}
      ) timeline
      ORDER BY occurred_at DESC, event_type ASC
      LIMIT 200
    `;

    return Response.json({ lead: leads[0], events });
  } catch (error) {
    console.error("Error loading lead timeline:", error);
    return Response.json({ error: "Failed to load customer timeline" }, { status: 500 });
  }
}
