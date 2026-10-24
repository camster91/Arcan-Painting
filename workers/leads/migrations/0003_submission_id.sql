-- Caller-generated idempotency key. Existing rows remain valid for legacy
-- callers; new submissions always receive a key before persistence.
ALTER TABLE enquiries ADD COLUMN submission_id TEXT;
ALTER TABLE enquiries ADD COLUMN payload_hash TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS enquiries_submission_id_unique ON enquiries(submission_id);
