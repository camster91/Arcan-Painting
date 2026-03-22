/**
 * Migration: 001-initial-schema
 * Run once at app startup to create all required tables.
 * Idempotent — safe to re-run (uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS).
 */
import sql from "@/app/api/utils/sql.js";

let migrationRun = false;

export async function runMigrations() {
  if (migrationRun) return; // Only run once per process lifetime
  migrationRun = true;

  try {
    // ── auth_users ──────────────────────────────────────────────────────────
    await sql`
      CREATE TABLE IF NOT EXISTS auth_users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'owner',
        password_is_hashed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    // Forward-compat columns (safe to run multiple times)
    await sql`ALTER TABLE auth_users ADD COLUMN IF NOT EXISTS password_is_hashed BOOLEAN DEFAULT FALSE`;
    await sql`ALTER TABLE auth_users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`;

    // ── auth_sessions ───────────────────────────────────────────────────────
    await sql`
      CREATE TABLE IF NOT EXISTS auth_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES auth_users(id) ON DELETE CASCADE,
        token VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL
      )
    `;

    // ── password_reset_tokens ───────────────────────────────────────────────
    await sql`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES auth_users(id) ON DELETE CASCADE,
        token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // ── leads (soft-delete support) ─────────────────────────────────────────
    await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP DEFAULT NULL`;
    await sql`ALTER TABLE auth_sessions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP DEFAULT NULL`;

    // ── auth_verification_codes (magic code auth) ───────────────────────────
    await sql`
      CREATE TABLE IF NOT EXISTS auth_verification_codes (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        code VARCHAR(10) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL,
        used_at TIMESTAMP
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_auth_codes_username ON auth_verification_codes(username)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_auth_codes_code ON auth_verification_codes(code)`;

    // ── agent_runs (from agents/migrate.js) ─────────────────────────────────
    await sql`
      CREATE TABLE IF NOT EXISTS agent_runs (
        id SERIAL PRIMARY KEY,
        agent_id VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        input JSONB,
        output JSONB,
        error TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP
      )
    `;

    // ── audit_logs ──────────────────────────────────────────────────────────
    await sql`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        action VARCHAR(255) NOT NULL,
        user_id INTEGER,
        username VARCHAR(255),
        status VARCHAR(50) DEFAULT 'success',
        ip_address VARCHAR(45),
        user_agent TEXT,
        changes JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // ── Performance indexes ──────────────────────────────────────────────────
    // leads table
    await sql`CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_leads_deleted_at ON leads(deleted_at) WHERE deleted_at IS NULL`;
    await sql`CREATE INDEX IF NOT EXISTS idx_leads_follow_up_date ON leads(follow_up_date)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email)`;

    // estimates table
    await sql`CREATE INDEX IF NOT EXISTS idx_estimates_lead_id ON estimates(lead_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_estimates_status ON estimates(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_estimates_created_at ON estimates(created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_estimates_created_by ON estimates(created_by)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_estimates_estimate_number ON estimates(estimate_number)`;

    // projects table
    await sql`CREATE INDEX IF NOT EXISTS idx_projects_lead_id ON projects(lead_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_projects_estimate_id ON projects(estimate_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_projects_assigned_painter_id ON projects(assigned_painter_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC)`;

    // auth_sessions — hot path on every request
    await sql`CREATE INDEX IF NOT EXISTS idx_auth_sessions_token ON auth_sessions(token)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id ON auth_sessions(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires_at ON auth_sessions(expires_at)`;

    // follow_ups table
    await sql`CREATE INDEX IF NOT EXISTS idx_follow_ups_lead_id ON follow_ups(lead_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_follow_ups_status ON follow_ups(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_follow_ups_follow_up_date ON follow_ups(follow_up_date)`;

    // audit_logs
    await sql`CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id)`;

    // agent_runs
    await sql`CREATE INDEX IF NOT EXISTS idx_agent_runs_status ON agent_runs(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_agent_runs_agent_id ON agent_runs(agent_id)`;

    // ── marketing_connections ─────────────────────────────────────────────────
    await sql`
      CREATE TABLE IF NOT EXISTS marketing_connections (
        id SERIAL PRIMARY KEY,
        platform VARCHAR(50) NOT NULL UNIQUE,
        access_token TEXT,
        refresh_token TEXT,
        token_expiry TIMESTAMP,
        scopes TEXT,
        account_email VARCHAR(255),
        account_name VARCHAR(255),
        metadata JSONB DEFAULT '{}',
        is_active BOOLEAN DEFAULT true,
        connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // ── marketing_campaigns ───────────────────────────────────────────────────
    await sql`
      CREATE TABLE IF NOT EXISTS marketing_campaigns (
        id SERIAL PRIMARY KEY,
        platform VARCHAR(50),
        campaign_name VARCHAR(255),
        campaign_id VARCHAR(255),
        status VARCHAR(50),
        budget NUMERIC,
        spend NUMERIC DEFAULT 0,
        impressions INTEGER DEFAULT 0,
        clicks INTEGER DEFAULT 0,
        conversions INTEGER DEFAULT 0,
        start_date DATE,
        end_date DATE,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // ── email_sequences ───────────────────────────────────────────────────────
    await sql`
      CREATE TABLE IF NOT EXISTS email_sequences (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        target_audience VARCHAR(255),
        subject_template TEXT,
        body_template TEXT,
        follow_up_days INTEGER DEFAULT 3,
        status VARCHAR(50) DEFAULT 'draft',
        sent_count INTEGER DEFAULT 0,
        open_count INTEGER DEFAULT 0,
        reply_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // ── outreach_contacts ─────────────────────────────────────────────────────
    await sql`
      CREATE TABLE IF NOT EXISTS outreach_contacts (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        email VARCHAR(255),
        company VARCHAR(255),
        role VARCHAR(255),
        platform VARCHAR(50),
        sequence_id INTEGER REFERENCES email_sequences(id),
        status VARCHAR(50) DEFAULT 'not_contacted',
        last_contacted_at TIMESTAMP,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // ── ai_conversations ──────────────────────────────────────────────────────
    await sql`
      CREATE TABLE IF NOT EXISTS ai_conversations (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(255),
        role VARCHAR(20),
        content TEXT,
        model VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Marketing indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_marketing_connections_platform ON marketing_connections(platform)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_platform ON marketing_campaigns(platform)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_status ON marketing_campaigns(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_email_sequences_status ON email_sequences(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_outreach_contacts_sequence_id ON outreach_contacts(sequence_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_outreach_contacts_status ON outreach_contacts(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_ai_conversations_session_id ON ai_conversations(session_id)`;

    console.log("[migrations] 001-initial-schema: complete");
  } catch (err) {
    // Reset flag so next request retries
    migrationRun = false;
    console.error("[migrations] 001-initial-schema: FAILED", err.message);
    throw err;
  }
}

// Cached promise — run once, share across concurrent startup callers
let _migrationPromise = null;

export function ensureSchema() {
  if (!_migrationPromise) {
    _migrationPromise = runMigrations().catch((err) => {
      _migrationPromise = null; // Allow retry on next call
      throw err;
    });
  }
  return _migrationPromise;
}
