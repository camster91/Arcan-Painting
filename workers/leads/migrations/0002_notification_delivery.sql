ALTER TABLE enquiry_outbox ADD COLUMN attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE enquiry_outbox ADD COLUMN next_attempt_at INTEGER NOT NULL DEFAULT 0;
ALTER TABLE enquiry_outbox ADD COLUMN lease_until INTEGER NOT NULL DEFAULT 0;
ALTER TABLE enquiry_outbox ADD COLUMN lease_token TEXT;
ALTER TABLE enquiry_outbox ADD COLUMN provider_message_id TEXT;
ALTER TABLE enquiry_outbox ADD COLUMN accepted_at TEXT;
CREATE INDEX IF NOT EXISTS enquiry_outbox_due ON enquiry_outbox(status, next_attempt_at, lease_until);
