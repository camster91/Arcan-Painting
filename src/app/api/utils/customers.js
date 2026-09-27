/**
 * Customers are the people Arcan has quoted or worked for. Leads stay as the
 * enquiry record; each lead points at at most one customer (leads.customer_id),
 * and estimates, jobs and invoices reach the customer through their lead.
 */

const normalEmail = (email) => (email || "").trim().toLowerCase();
const digits = (phone) => (phone || "").replace(/\D/g, "");

/**
 * Link a lead to a customer, creating the customer if needed. A lead whose
 * email (or, failing that, phone) matches an existing customer joins that
 * customer, so a repeat client keeps one history.
 *
 * @param db the `sql` helper or a transaction handle
 * @returns the customer id, or null if the lead does not exist
 */
export async function ensureCustomerForLead(db, leadId) {
  const [lead] = await db`
    SELECT id, name, email, phone, address, customer_id FROM leads WHERE id = ${leadId}
  `;
  if (!lead) return null;
  if (lead.customer_id) return lead.customer_id;

  let customerId = null;
  const email = normalEmail(lead.email);
  if (email) {
    const [match] = await db`SELECT id FROM customers WHERE LOWER(email) = ${email} ORDER BY id LIMIT 1`;
    customerId = match?.id ?? null;
  }
  if (!customerId && digits(lead.phone).length >= 7) {
    const candidates = await db`SELECT id, phone FROM customers WHERE phone IS NOT NULL`;
    customerId = candidates.find((c) => digits(c.phone) === digits(lead.phone))?.id ?? null;
  }
  if (!customerId) {
    const [created] = await db`
      INSERT INTO customers (name, email, phone, address)
      VALUES (${lead.name}, ${email || null}, ${lead.phone || null}, ${lead.address || null})
      RETURNING id
    `;
    customerId = created.id;
  }

  await db`UPDATE leads SET customer_id = ${customerId} WHERE id = ${lead.id}`;
  return customerId;
}

/**
 * One-time (idempotent) backfill: every won lead and every lead with a job
 * becomes a customer. Runs after migrations on boot.
 */
export async function backfillCustomers(db) {
  const leads = await db`
    SELECT DISTINCT l.id FROM leads l
    LEFT JOIN projects p ON p.lead_id = l.id
    WHERE l.customer_id IS NULL AND l.deleted_at IS NULL
      AND (l.status = 'won' OR p.id IS NOT NULL)
    ORDER BY l.id
  `;
  for (const { id } of leads) await ensureCustomerForLead(db, id);
  return leads.length;
}
