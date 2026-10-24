-- Separate intake store; this does not migrate or replace the existing CRM.
CREATE TABLE IF NOT EXISTS enquiries (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  service_type TEXT NOT NULL,
  preferred_contact TEXT NOT NULL CHECK (preferred_contact IN ('email', 'phone')),
  location TEXT NOT NULL,
  project_description TEXT NOT NULL,
  attribution TEXT NOT NULL DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS enquiry_outbox (
  enquiry_id TEXT PRIMARY KEY REFERENCES enquiries(id),
  created_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent'))
);
CREATE INDEX IF NOT EXISTS enquiry_outbox_pending ON enquiry_outbox(status, created_at);
