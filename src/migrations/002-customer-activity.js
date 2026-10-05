// Additive and idempotent; invoked after the existing foundational schema.
export const customerActivityDDL = [
  `CREATE TABLE IF NOT EXISTS customer_activity_events (
    id SERIAL PRIMARY KEY,
    event_key VARCHAR(64) NOT NULL UNIQUE,
    content_hash VARCHAR(64) NOT NULL,
    lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    summary TEXT NOT NULL,
    actor_id INTEGER,
    actor_name VARCHAR(255),
    visibility VARCHAR(20) NOT NULL DEFAULT 'internal',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS idx_customer_activity_lead_time ON customer_activity_events(lead_id, created_at, id)`,
];

export async function ensureCustomerActivitySchema(db) {
  for (const query of customerActivityDDL) await db(query);
}
