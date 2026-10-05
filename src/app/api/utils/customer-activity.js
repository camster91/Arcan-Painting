import { createHash, randomUUID } from "node:crypto";

const hash = (value) => createHash("sha256").update(value).digest("hex");

export async function appendCustomerActivity(tx, { leadId, key, type, summary, user }) {
  const eventKey = hash(`${leadId}:${user.id}:${key}`);
  const contentHash = hash(JSON.stringify({ type, summary }));
  const existing = await tx`SELECT id, content_hash FROM customer_activity_events WHERE event_key = ${eventKey}`;
  if (existing.length) return existing[0].content_hash === contentHash
    ? { id: existing[0].id, replayed: true }
    : { error: "This save key was already used for different content", status: 409 };
  const rows = await tx`
    INSERT INTO customer_activity_events (event_key, content_hash, lead_id, event_type, summary, actor_id, actor_name, visibility)
    VALUES (${eventKey}, ${contentHash}, ${leadId}, ${type}, ${summary}, ${user.id}, ${user.username || null}, 'internal')
    RETURNING id
  `;
  return { id: rows[0].id, replayed: false };
}

export async function saveCustomerNote(db, { leadId, key, text, user }) {
  return db.transaction(async (tx) => {
    // Both PostgreSQL and InnoDB require the locking read inside a transaction:
    // https://www.postgresql.org/docs/current/explicit-locking.html
    // https://mariadb.com/docs/server/reference/sql-statements/data-manipulation/selecting-data/for-update
    const leads = await tx`SELECT id FROM leads WHERE id = ${leadId} AND deleted_at IS NULL FOR UPDATE`;
    if (!leads.length) return { error: "Lead not found", status: 404 };
    return appendCustomerActivity(tx, { leadId, key, type: "staff_note", summary: text, user });
  });
}

export async function appendLeadStatusChange(tx, { leadId, previousStatus, status, user }) {
  if (status === undefined || previousStatus === status) return;
  const result = await appendCustomerActivity(tx, { leadId, key: randomUUID(), type: "lead_status", summary: `Lead status changed from ${previousStatus || "unknown"} to ${status}`, user });
  if (result.error) throw new Error(result.error);
}
