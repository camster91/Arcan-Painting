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
    // If the leads table was never created (rare — typically from a prior migration
    // or manual SQL), create it now with the columns the new code expects.
    // The CREATE TABLE is idempotent; existing tables are left untouched.
    await sql`
      CREATE TABLE IF NOT EXISTS leads (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        service_type VARCHAR(100),
        project_description TEXT,
        preferred_contact VARCHAR(20) DEFAULT 'phone',
        status VARCHAR(50) DEFAULT 'new',
        lead_source VARCHAR(100) DEFAULT 'website',
        meta_lead_id VARCHAR(100),
        estimated_value NUMERIC,
        qualification_score INTEGER,
        follow_up_date DATE,
        address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP DEFAULT NULL
      )
    `;
    await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP DEFAULT NULL`;
    await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_source VARCHAR(100) DEFAULT 'website'`;
    await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS meta_lead_id VARCHAR(100)`;
    // Columns referenced by the leads PUT/POST route that the original
    // CREATE TABLE didn't include. Safe to re-run; each is a no-op if it
    // already exists.
    await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS notes TEXT`;
    await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb`;
    await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS contact_method VARCHAR(20)`;
    await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS qualification_notes TEXT`;
    await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMP`;
    await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_contact_method VARCHAR(20)`;
    await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS attribution JSONB DEFAULT '{}'::jsonb`;
    await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS lost_reason VARCHAR(255)`;
    await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS qualified_at TIMESTAMP`;
    await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS proposal_sent_at TIMESTAMP`;
    await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS won_at TIMESTAMP`;
    await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS lost_at TIMESTAMP`;
    await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS status_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`;
    await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS marketing_consent_status VARCHAR(20) DEFAULT 'unknown'`;
    await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS marketing_consent_at TIMESTAMP`;
    await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS marketing_consent_source VARCHAR(100)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_leads_lead_source ON leads(lead_source) WHERE deleted_at IS NULL`;
    await sql`CREATE INDEX IF NOT EXISTS idx_leads_meta_lead_id ON leads(meta_lead_id) WHERE deleted_at IS NULL`;
    await sql`ALTER TABLE auth_sessions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP DEFAULT NULL`;

    // ── email_templates (referenced by email-workflows engine) ─────────────
    await sql`
      CREATE TABLE IF NOT EXISTS email_templates (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        display_name VARCHAR(255),
        subject_template TEXT NOT NULL,
        body_template TEXT NOT NULL,
        text_template TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // ── email_workflows (referenced by triggerWorkflow in email-workflows/route.js) ─
    await sql`
      CREATE TABLE IF NOT EXISTS email_workflows (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        trigger_event VARCHAR(100) NOT NULL,
        template_id INTEGER REFERENCES email_templates(id) ON DELETE SET NULL,
        delay_hours INTEGER DEFAULT 0,
        conditions JSONB DEFAULT '{}'::jsonb,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await sql`ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'general'`;
    await sql`ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`;
    await sql`CREATE INDEX IF NOT EXISTS idx_email_workflows_trigger ON email_workflows(trigger_event) WHERE is_active = true`;

    // ── delayed_emails (queue for delay_hours > 0 workflows) ───────────────────
    // Each row is an email to be sent at scheduled_for. The worker at
    // /api/delayed-emails/process picks up pending rows whose time has come.
    await sql`
      CREATE TABLE IF NOT EXISTS delayed_emails (
        id SERIAL PRIMARY KEY,
        workflow_id INTEGER REFERENCES email_workflows(id) ON DELETE CASCADE,
        template_name VARCHAR(255) NOT NULL,
        recipient_email VARCHAR(255) NOT NULL,
        data JSONB DEFAULT '{}'::jsonb,
        scheduled_for TIMESTAMP NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        attempts INTEGER DEFAULT 0,
        last_error TEXT,
        sent_at TIMESTAMP,
        related_type VARCHAR(50),
        related_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_delayed_emails_pending ON delayed_emails(scheduled_for) WHERE status = 'pending'`;
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_delayed_emails_unique ON delayed_emails(workflow_id, related_id) WHERE related_id IS NOT NULL`;
    await sql`ALTER TABLE delayed_emails ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMP`;

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
    // Persist brute-force protection with each issued code so an application
    // restart cannot reset the verification-attempt budget.
    await sql`ALTER TABLE auth_verification_codes ADD COLUMN IF NOT EXISTS failed_attempts INTEGER NOT NULL DEFAULT 0`;
    await sql`ALTER TABLE auth_verification_codes ADD COLUMN IF NOT EXISTS locked_at TIMESTAMP`;

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
    // Columns the admin UI / store.js expect. The original table was
    // missing these — the in-memory store carried them, and we want DB
    // rows to look the same to callers.
    await sql`ALTER TABLE agent_runs ADD COLUMN IF NOT EXISTS agent_name VARCHAR(255)`;
    await sql`ALTER TABLE agent_runs ADD COLUMN IF NOT EXISTS reference_type VARCHAR(50)`;
    await sql`ALTER TABLE agent_runs ADD COLUMN IF NOT EXISTS reference_id VARCHAR(50)`;
    await sql`ALTER TABLE agent_runs ADD COLUMN IF NOT EXISTS started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`;
    await sql`ALTER TABLE agent_runs ADD COLUMN IF NOT EXISTS duration_ms INTEGER`;
    await sql`CREATE INDEX IF NOT EXISTS idx_agent_runs_agent_id_created ON agent_runs(agent_id, created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_agent_runs_status ON agent_runs(status)`;

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

    // ── estimates (added 2026-06-11 — bootstrap, was missing from this migration) ──
    await sql`
      CREATE TABLE IF NOT EXISTS estimates (
        id SERIAL PRIMARY KEY,
        lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
        estimate_number VARCHAR(50) UNIQUE NOT NULL,
        project_title VARCHAR(255) NOT NULL,
        project_description TEXT,
        labor_cost DECIMAL(12, 2) DEFAULT 0,
        material_cost DECIMAL(12, 2) DEFAULT 0,
        total_cost DECIMAL(12, 2) DEFAULT 0,
        estimated_duration_days INTEGER,
        status VARCHAR(50) DEFAULT 'draft',
        valid_until DATE,
        notes TEXT,
        created_by INTEGER REFERENCES auth_users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // ── projects (added 2026-06-11 — bootstrap, was missing from this migration) ──
    await sql`
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        estimate_id INTEGER REFERENCES estimates(id) ON DELETE SET NULL,
        lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
        project_name VARCHAR(255) NOT NULL,
        start_date DATE,
        end_date DATE,
        status VARCHAR(50) DEFAULT 'scheduled',
        final_cost DECIMAL(12, 2),
        completion_percentage INTEGER DEFAULT 0,
        last_progress_update TIMESTAMP,
        progress_notes TEXT,
        assigned_painter_id INTEGER,
        crew_assigned TEXT,
        notes TEXT,
        site_lat DECIMAL(10, 7),
        site_lng DECIMAL(10, 7),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // ── follow_ups (added 2026-06-11 — bootstrap, was missing from this migration) ──
    await sql`
      CREATE TABLE IF NOT EXISTS follow_ups (
        id SERIAL PRIMARY KEY,
        lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
        follow_up_date DATE NOT NULL,
        follow_up_type VARCHAR(50) DEFAULT 'call',
        status VARCHAR(50) DEFAULT 'pending',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // ── contracts (added 2026-06-11) ─────────────────────────────────────────
    await sql`
      CREATE TABLE IF NOT EXISTS contracts (
        id SERIAL PRIMARY KEY,
        contract_number VARCHAR(50) UNIQUE NOT NULL,
        estimate_id INTEGER REFERENCES estimates(id) ON DELETE SET NULL,
        lead_id INTEGER REFERENCES leads(id) ON DELETE SET NULL,
        project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        scope_of_work TEXT,
        terms_and_conditions TEXT,
        payment_terms TEXT,
        warranty_terms TEXT,
        total_amount DECIMAL(12, 2) DEFAULT 0,
        deposit_amount DECIMAL(12, 2),
        deposit_percentage DECIMAL(5, 2),
        status VARCHAR(50) DEFAULT 'draft',
        start_date DATE,
        completion_date DATE,
        estimated_duration_days INTEGER,
        signed_at TIMESTAMP,
        signed_by_name VARCHAR(255),
        client_signed_at TIMESTAMP,
        client_signature_data TEXT,
        contractor_signed_at TIMESTAMP,
        contractor_signature_data TEXT,
        sent_at TIMESTAMP,
        viewed_at TIMESTAMP,
        contract_pdf_url TEXT,
        signed_contract_pdf_url TEXT,
        created_by INTEGER REFERENCES auth_users(id),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // ── invoices (added 2026-06-11) ──────────────────────────────────────────
    await sql`
      CREATE TABLE IF NOT EXISTS invoices (
        id SERIAL PRIMARY KEY,
        invoice_number VARCHAR(50) UNIQUE NOT NULL,
        contract_id INTEGER REFERENCES contracts(id) ON DELETE SET NULL,
        lead_id INTEGER REFERENCES leads(id) ON DELETE SET NULL,
        project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
        title VARCHAR(255),
        description TEXT,
        invoice_type VARCHAR(50) DEFAULT 'progress',
        status VARCHAR(50) DEFAULT 'draft',
        payment_status VARCHAR(50) DEFAULT 'unpaid',
        issue_date DATE,
        due_date DATE,
        subtotal DECIMAL(12, 2) DEFAULT 0,
        tax_rate DECIMAL(5, 2) DEFAULT 0,
        tax_amount DECIMAL(12, 2) DEFAULT 0,
        total_amount DECIMAL(12, 2) DEFAULT 0,
        amount_paid DECIMAL(12, 2) DEFAULT 0,
        amount_due DECIMAL(12, 2) DEFAULT 0,
        notes TEXT,
        sent_at TIMESTAMP,
        sent_date DATE,
        paid_at TIMESTAMP,
        created_by INTEGER REFERENCES auth_users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // ── invoice_line_items (added 2026-06-11) ────────────────────────────────
    await sql`
      CREATE TABLE IF NOT EXISTS invoice_line_items (
        id SERIAL PRIMARY KEY,
        invoice_id INTEGER REFERENCES invoices(id) ON DELETE CASCADE,
        description TEXT NOT NULL,
        quantity DECIMAL(12, 2) DEFAULT 1,
        unit_price DECIMAL(12, 2) DEFAULT 0,
        line_total DECIMAL(12, 2) DEFAULT 0,
        category VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // ── payments (added 2026-06-11) ──────────────────────────────────────────
    await sql`
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        payment_number VARCHAR(50) UNIQUE NOT NULL,
        invoice_id INTEGER REFERENCES invoices(id) ON DELETE SET NULL,
        contract_id INTEGER REFERENCES contracts(id) ON DELETE SET NULL,
        lead_id INTEGER REFERENCES leads(id) ON DELETE SET NULL,
        amount DECIMAL(12, 2) DEFAULT 0,
        payment_method VARCHAR(50),
        payment_reference VARCHAR(255),
        payment_date DATE,
        status VARCHAR(50) DEFAULT 'pending',
        stripe_payment_intent_id VARCHAR(255),
        notes TEXT,
        processed_by VARCHAR(255),
        recorded_by INTEGER REFERENCES auth_users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // ── team_members (added 2026-06-11) ──────────────────────────────────────
    await sql`
      CREATE TABLE IF NOT EXISTS team_members (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(50),
        role VARCHAR(50) DEFAULT 'painter',
        status VARCHAR(50) DEFAULT 'active',
        hire_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await sql`ALTER TABLE team_members ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC(10, 2)`;
    await sql`ALTER TABLE team_members ADD COLUMN IF NOT EXISTS specialties TEXT`;
    await sql`ALTER TABLE team_members ADD COLUMN IF NOT EXISTS notes TEXT`;

    // A project may have a lead painter plus any number of active crew members.
    await sql`
      CREATE TABLE IF NOT EXISTS project_crew_members (
        id SERIAL PRIMARY KEY,
        project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        team_member_id INTEGER NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
        crew_role VARCHAR(50) DEFAULT 'crew',
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        removed_at TIMESTAMP,
        UNIQUE(project_id, team_member_id)
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_project_crew_active_member ON project_crew_members(team_member_id, project_id) WHERE removed_at IS NULL`;

    // ── team_invites ────────────────────────────────────────────────────────
    await sql`
      CREATE TABLE IF NOT EXISTS team_invites (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'painter',
        token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        accepted_at TIMESTAMP,
        created_by_user_id INTEGER REFERENCES auth_users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_team_invites_email ON team_invites(email)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_team_invites_token ON team_invites(token)`;

    // ── email_logs (added 2026-06-11) ────────────────────────────────────────
    await sql`
      CREATE TABLE IF NOT EXISTS email_logs (
        id SERIAL PRIMARY KEY,
        to_email VARCHAR(255) NOT NULL,
        from_email VARCHAR(255) NOT NULL,
        subject VARCHAR(500),
        template_name VARCHAR(255),
        status VARCHAR(50) DEFAULT 'failed',
        resend_id VARCHAR(255),
        error_message TEXT,
        related_type VARCHAR(50),
        related_id INTEGER,
        user_id INTEGER,
        metadata JSONB DEFAULT '{}'::jsonb,
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // ── estimate_settings (added 2026-06-11) ─────────────────────────────────
    await sql`
      CREATE TABLE IF NOT EXISTS estimate_settings (
        id SERIAL PRIMARY KEY,
        estimate_id INTEGER REFERENCES estimates(id) ON DELETE CASCADE,
        tax_rate NUMERIC(5,2),
        overhead_pct NUMERIC(5,2),
        markup_pct NUMERIC(5,2),
        currency VARCHAR(10),
        crew_hourly_cost NUMERIC(10,2),
        billable_rate NUMERIC(10,2),
        default_method VARCHAR(10),
        default_coats INTEGER,
        primer_on BOOLEAN,
        waste_paint_pct NUMERIC(5,2),
        waste_tape_pct NUMERIC(5,2),
        waste_poly_pct NUMERIC(5,2),
        setup_minutes_per_area INTEGER,
        cleanup_buffer_pct NUMERIC(5,2),
        travel_minutes INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // ── estimate_areas (added 2026-06-11) ────────────────────────────────────
    await sql`
      CREATE TABLE IF NOT EXISTS estimate_areas (
        id SERIAL PRIMARY KEY,
        estimate_id INTEGER REFERENCES estimates(id) ON DELETE CASCADE,
        name VARCHAR(255),
        length NUMERIC(10,2),
        width NUMERIC(10,2),
        height NUMERIC(10,2),
        wall_sqft NUMERIC(12,2),
        ceiling_sqft NUMERIC(12,2),
        notes TEXT,
        exclusions TEXT,
        production_assumptions TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // ── estimate_surfaces (added 2026-06-11) ────────────────────────────────
    await sql`
      CREATE TABLE IF NOT EXISTS estimate_surfaces (
        id SERIAL PRIMARY KEY,
        area_id INTEGER REFERENCES estimate_areas(id) ON DELETE CASCADE,
        surface_type VARCHAR(50),
        measurement NUMERIC(12,2),
        unit VARCHAR(10),
        method VARCHAR(10),
        coats INTEGER,
        primer BOOLEAN,
        production_rate NUMERIC(12,2),
        coverage_rate NUMERIC(12,2),
        door_sides INTEGER,
        profile_type VARCHAR(50),
        opening_sqft NUMERIC(12,2),
        coating_product TEXT,
        color_name TEXT,
        sheen TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await sql`ALTER TABLE estimate_areas ADD COLUMN IF NOT EXISTS exclusions TEXT`;
    await sql`ALTER TABLE estimate_areas ADD COLUMN IF NOT EXISTS production_assumptions TEXT`;
    await sql`ALTER TABLE estimate_surfaces ADD COLUMN IF NOT EXISTS coating_product TEXT`;
    await sql`ALTER TABLE estimate_surfaces ADD COLUMN IF NOT EXISTS color_name TEXT`;
    await sql`ALTER TABLE estimate_surfaces ADD COLUMN IF NOT EXISTS sheen TEXT`;

    // ── estimate_prep_items (added 2026-06-11) ──────────────────────────────
    await sql`
      CREATE TABLE IF NOT EXISTS estimate_prep_items (
        id SERIAL PRIMARY KEY,
        area_id INTEGER REFERENCES estimate_areas(id) ON DELETE CASCADE,
        prep_type VARCHAR(50),
        quantity NUMERIC(12,2),
        unit VARCHAR(10),
        rate NUMERIC(12,2),
        hours NUMERIC(12,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // ── estimate_materials (added 2026-06-11) ───────────────────────────────
    await sql`
      CREATE TABLE IF NOT EXISTS estimate_materials (
        id SERIAL PRIMARY KEY,
        estimate_id INTEGER REFERENCES estimates(id) ON DELETE CASCADE,
        item_name TEXT,
        quantity NUMERIC(12,2),
        unit VARCHAR(10),
        unit_cost NUMERIC(10,2),
        total_cost NUMERIC(12,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // ── Fix audit_logs (added 2026-06-11) ──────────────────────────────────
    await sql`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        username VARCHAR(255),
        action VARCHAR(255) NOT NULL,
        resource VARCHAR(255),
        resource_id VARCHAR(255),
        ip VARCHAR(64),
        user_agent TEXT,
        changes JSONB,
        status VARCHAR(50) DEFAULT 'success',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await sql`ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS resource VARCHAR(255)`;
    await sql`ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS resource_id VARCHAR(255)`;
    await sql`ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS ip VARCHAR(64)`;

    // ── Add deleted_at to follow_ups (added 2026-06-11) ─────────────────────
    await sql`ALTER TABLE follow_ups ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP`;

    // ── Seed initial team_members from existing auth_users (added 2026-06-11)
    const existingTeamMembers =
      await sql`SELECT COUNT(*)::int as count FROM team_members`;
    if (existingTeamMembers[0].count === 0) {
      const users = await sql`SELECT username, role FROM auth_users`;
      for (const user of users) {
        const namePart = user.username.split("@")[0];
        const displayName = namePart
          .split(/[._-]/)
          .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
          .join(" ");
        await sql`
          INSERT INTO team_members (name, email, role)
          VALUES (${displayName}, ${user.username}, ${user.role || "painter"})
          ON CONFLICT (email) DO NOTHING
        `;
      }
    }

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
    await sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS last_progress_update TIMESTAMP`;
    await sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS progress_notes TEXT`;

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

    // ── ad_creatives ──────────────────────────────────────────────────────────
    await sql`
      CREATE TABLE IF NOT EXISTS ad_creatives (
        id SERIAL PRIMARY KEY,
        campaign_name VARCHAR(255),
        platform VARCHAR(50) NOT NULL,
        ad_type VARCHAR(50),
        headline TEXT,
        primary_text TEXT,
        description TEXT,
        call_to_action VARCHAR(100),
        target_audience TEXT,
        service VARCHAR(100),
        location VARCHAR(100),
        status VARCHAR(50) DEFAULT 'draft',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // ── ads_accounts ──────────────────────────────────────────────────────────
    await sql`
      CREATE TABLE IF NOT EXISTS ads_accounts (
        id SERIAL PRIMARY KEY,
        platform VARCHAR(50) NOT NULL,
        account_id VARCHAR(255),
        account_name VARCHAR(255),
        access_token TEXT,
        refresh_token TEXT,
        token_expiry TIMESTAMP,
        currency VARCHAR(10) DEFAULT 'CAD',
        is_active BOOLEAN DEFAULT true,
        connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // ── live_campaigns ────────────────────────────────────────────────────────
    await sql`
      CREATE TABLE IF NOT EXISTS live_campaigns (
        id SERIAL PRIMARY KEY,
        platform VARCHAR(50) NOT NULL,
        platform_campaign_id VARCHAR(255),
        creative_id INTEGER REFERENCES ad_creatives(id),
        campaign_name VARCHAR(255),
        status VARCHAR(50) DEFAULT 'active',
        daily_budget NUMERIC,
        total_budget NUMERIC,
        spent NUMERIC DEFAULT 0,
        impressions INTEGER DEFAULT 0,
        clicks INTEGER DEFAULT 0,
        conversions INTEGER DEFAULT 0,
        start_date DATE,
        end_date DATE,
        target_url VARCHAR(500) DEFAULT 'https://arcanpainting.ca',
        targeting JSONB DEFAULT '{}',
        platform_data JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // ── cold_email_prospects ───────────────────────────────────────────────
    await sql`
      CREATE TABLE IF NOT EXISTS cold_email_prospects (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        email VARCHAR(255) UNIQUE,
        company VARCHAR(255),
        role VARCHAR(100),
        city VARCHAR(100),
        source VARCHAR(100),
        status VARCHAR(50) DEFAULT 'new',
        sequence_step INTEGER DEFAULT 0,
        last_emailed_at TIMESTAMP,
        replied_at TIMESTAMP,
        converted_at TIMESTAMP,
        notes TEXT,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // ── cold_email_sends ────────────────────────────────────────────────────
    await sql`
      CREATE TABLE IF NOT EXISTS cold_email_sends (
        id SERIAL PRIMARY KEY,
        prospect_id INTEGER REFERENCES cold_email_prospects(id),
        sequence_step INTEGER,
        subject VARCHAR(500),
        body TEXT,
        mailgun_id VARCHAR(255),
        status VARCHAR(50) DEFAULT 'sent',
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // ── cold_email_templates ────────────────────────────────────────────────
    await sql`
      CREATE TABLE IF NOT EXISTS cold_email_templates (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        target_role VARCHAR(100),
        sequence_step INTEGER DEFAULT 1,
        subject_template TEXT NOT NULL,
        body_template TEXT NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // ── Seed default cold email templates ────────────────────────────────────
    // Only insert if table is empty (idempotent)
    const existingTemplates =
      await sql`SELECT COUNT(*)::int as count FROM cold_email_templates`;
    if (existingTemplates[0].count === 0) {
      await sql`
        INSERT INTO cold_email_templates (name, target_role, sequence_step, subject_template, body_template) VALUES
        ('RE Agent Intro', 'real_estate_agent', 1,
         'Partnering with you — painting services for your listings in {{city}}',
         'Hi {{name}},

I hope this finds you well! My name is Gerardo, and I run Arcan Painting — a professional painting company serving the Greater Toronto Area.

I wanted to reach out because I know how much a fresh coat of paint can make a difference when you''re preparing a property for sale. We specialize in quick turnarounds for real estate listings — often completing full interior paint jobs in 2-3 days to help you hit your listing date.

We work with several agents across {{city}} and the GTA, and our clients regularly tell us it''s one of the best ROI improvements before listing.

Would you be open to a quick 10-minute call to explore if we might be a good fit for your future listings?

Best,
Gerardo
Arcan Painting
(416) 727-2148
arcanpainting.ca'),
        ('RE Agent Follow-Up', 'real_estate_agent', 2,
         'Quick follow-up — painting for your listings',
         'Hi {{name}},

I wanted to follow up on my message from a few days ago about painting services for real estate listings.

I understand you''re busy — just wanted to make sure this didn''t get buried. We''ve helped listings in {{city}} sell faster and for more by refreshing interiors before listing.

If timing isn''t right now, no worries at all — I''d love to be a resource for you when the need comes up.

Happy to send over some before/after photos from recent listings if that''s helpful.

Best,
Gerardo
Arcan Painting
(416) 727-2148'),
        ('Property Manager Intro', 'property_manager', 1,
         'Reliable painting contractor for your properties in {{city}}',
         'Hi {{name}},

My name is Gerardo from Arcan Painting. We provide professional interior and exterior painting services to property managers and landlords across the GTA.

I know that when a unit turns over or a property needs refreshing, you need someone reliable who shows up on time, communicates well, and does quality work without the headaches. That''s exactly what we focus on.

We offer:
- Fast turnarounds on unit turnovers
- Competitive bulk pricing for multiple units
- Fully insured and WSIB-compliant
- Free estimates within 24 hours

Would you be open to keeping us in mind for your next project? I''d love to provide a quote.

Best,
Gerardo
Arcan Painting
(416) 727-2148
arcanpainting.ca'),
        ('Property Manager Follow-Up', 'property_manager', 2,
         'Following up — painting for your managed properties',
         'Hi {{name}},

Quick follow-up on my earlier note about painting services for your properties in {{city}}.

We just finished a 12-unit refresh for a property manager in Mississauga — happy to share photos and pricing if you''d ever like to compare.

No pressure at all — just wanted to make sure you have us on your radar for when the need comes up.

Gerardo
Arcan Painting
(416) 727-2148'),
        ('HOA Manager Intro', 'hoa_manager', 1,
         'Reliable painting contractor for {{city}} HOAs and condos',
         'Hi {{name}},

My name is Gerardo from Arcan Painting. We work with HOA boards and condo corporations across the GTA who need a dependable painting contractor for common areas, hallways, lobbies, and exterior maintenance.

We understand HOA budgets and timelines — we provide detailed quotes, stick to agreed schedules, and document everything for your board meetings.

We currently service 3-5 condo/HOA properties per month in {{city}} and surrounding areas.

Would you be open to a quick call to see if we''d be a fit for your upcoming projects?

Gerardo
Arcan Painting
(416) 727-2148
arcanpainting.ca'),
        ('HOA Manager Follow-Up', 'hoa_manager', 2,
         'Follow-up — painting for your HOA properties in {{city}}',
         'Hi {{name}},

Following up on my note about painting services for HOA properties.

We recently completed a full common-area refresh for a 120-unit condo in Mississauga — new hallway paint, lobby feature wall, and exterior touch-ups — all done on schedule and within budget.

Happy to share photos and a sample quote if helpful.

Gerardo
Arcan Painting
(416) 727-2148'),
        ('Facilities Manager Intro', 'facilities_manager', 1,
         'Commercial painting maintenance for your facilities in {{city}}',
         'Hi {{name}},

I run Arcan Painting — we provide commercial painting services to facilities managers and building owners across the Greater Toronto Area.

We specialize in:
- Office and retail space repaints
- Exterior building maintenance
- Parking garage line marking and surface coatings
- After-hours and weekend scheduling to minimize disruption

Many of our commercial clients schedule us 3-4 times per year for ongoing maintenance. We''re fully insured and WSIB-compliant.

Would it make sense to connect for 10 minutes to discuss your upcoming painting needs?

Gerardo
Arcan Painting
(416) 727-2148
arcanpainting.ca'),
        ('Facilities Manager Follow-Up', 'facilities_manager', 2,
         'Quick follow-up — commercial painting for {{company}}',
         'Hi {{name}},

Just following up on my earlier note about commercial painting services for your facilities in {{city}}.

We work with several office buildings and retail plazas in the GTA on an ongoing maintenance basis. Happy to put together a no-obligation quote for any upcoming projects.

Gerardo
Arcan Painting
(416) 727-2148')
      `;
    }

    // ── Seed default email template + workflow for new_lead trigger ──────
    // Required so the Meta webhook's triggerWorkflow('new_lead', ...) call
    // has a template to send and a workflow to fire.
    const existingEmailTemplates =
      await sql`SELECT COUNT(*)::int as count FROM email_templates`;
    if (existingEmailTemplates[0].count === 0) {
      await sql`
        INSERT INTO email_templates (name, subject_template, body_template) VALUES
        ('new_lead_notification',
         'New lead: {{customer_name}} — {{service_type}}',
         '<h2>New Contact Form Submission</h2>
<p><strong>Name:</strong> {{customer_name}}</p>
<p><strong>Email:</strong> {{customer_email}}</p>
<p><strong>Phone:</strong> {{customer_phone}}</p>
<p><strong>Service:</strong> {{service_type}}</p>
<p><strong>Source:</strong> {{source}}</p>
<p><strong>Address:</strong> {{address}}</p>
<p><strong>Description:</strong> {{project_description}}</p>
<p><a href="{{app_url}}/admin/leads">View in admin</a></p>')
      `;
    }

    const existingEmailWorkflows =
      await sql`SELECT COUNT(*)::int as count FROM email_workflows`;
    if (existingEmailWorkflows[0].count === 0) {
      const newLeadTemplate =
        await sql`SELECT id FROM email_templates WHERE name = 'new_lead_notification' LIMIT 1`;
      if (newLeadTemplate[0]) {
        await sql`
          INSERT INTO email_workflows (name, trigger_event, template_id, delay_hours, conditions, is_active) VALUES
          ('new_lead_immediate', 'new_lead', ${newLeadTemplate[0].id}, 0, '{}'::jsonb, true)
        `;
      }
    }

    // Consent-aware lifecycle templates and workflows ship inactive. The owner must
    // review content and explicitly activate them before the gated queue can use them.
    await sql`
      INSERT INTO email_templates (name, display_name, subject_template, body_template, text_template, is_active) VALUES
      ('estimate_follow_up', 'Estimate follow-up', 'Any questions about your Arcan Painting estimate?', '<p>Hi {{lead_name}},</p><p>We wanted to check whether you have any questions about estimate {{reference}}.</p>', 'Hi {{lead_name}}, we wanted to check whether you have any questions about estimate {{reference}}.', true),
      ('dormant_lead', 'Dormant lead reactivation', 'Still planning your painting project?', '<p>Hi {{lead_name}},</p><p>If your painting project is still on your list, we would be happy to help when the timing is right.</p>', 'Hi {{lead_name}}, if your painting project is still on your list, we would be happy to help.', true),
      ('review_request', 'Review request', 'How did we do on {{reference}}?', '<p>Hi {{lead_name}},</p><p>Thank you for choosing Arcan Painting for {{reference}}. We would value your honest feedback.</p>', 'Hi {{lead_name}}, thank you for choosing Arcan Painting. We would value your honest feedback.', true),
      ('referral_request', 'Referral request', 'Know someone who needs a painter?', '<p>Hi {{lead_name}},</p><p>If you know someone who would benefit from careful painting work, we would appreciate an introduction.</p>', 'Hi {{lead_name}}, if you know someone who needs a painter, we would appreciate an introduction.', true)
      ON CONFLICT (name) DO NOTHING
    `;
    await sql`
      INSERT INTO email_workflows (name, trigger_event, template_id, delay_hours, conditions, is_active)
      SELECT seed.name, seed.event, t.id, 0, '{"requires_marketing_consent":true}'::jsonb, false
      FROM (VALUES
        ('estimate_follow_up_consent', 'estimate_follow_up', 'estimate_follow_up'),
        ('dormant_lead_consent', 'dormant_lead', 'dormant_lead'),
        ('review_request_consent', 'review_request', 'review_request'),
        ('referral_request_consent', 'referral_request', 'referral_request')
      ) AS seed(name, event, template_name)
      JOIN email_templates t ON t.name = seed.template_name
      WHERE NOT EXISTS (SELECT 1 FROM email_workflows existing WHERE existing.name = seed.name)
    `;

    // ── linkedin_posts ─────────────────────────────────────────────────────
    await sql`
      CREATE TABLE IF NOT EXISTS linkedin_posts (
        id SERIAL PRIMARY KEY,
        content TEXT NOT NULL,
        media_url TEXT,
        post_type VARCHAR(50) DEFAULT 'text',
        platform_post_id VARCHAR(255),
        status VARCHAR(50) DEFAULT 'draft',
        scheduled_for TIMESTAMP,
        posted_at TIMESTAMP,
        impressions INTEGER DEFAULT 0,
        likes INTEGER DEFAULT 0,
        comments INTEGER DEFAULT 0,
        shares INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // ── linkedin_outreach ───────────────────────────────────────────────────
    await sql`
      CREATE TABLE IF NOT EXISTS linkedin_outreach (
        id SERIAL PRIMARY KEY,
        prospect_name VARCHAR(255),
        prospect_title VARCHAR(255),
        prospect_company VARCHAR(255),
        prospect_linkedin_url VARCHAR(500),
        target_role VARCHAR(100),
        connection_message TEXT,
        followup_message TEXT,
        status VARCHAR(50) DEFAULT 'draft',
        sent_at TIMESTAMP,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // ── workflow_skills ────────────────────────────────────────────────────
    await sql`
      CREATE TABLE IF NOT EXISTS workflow_skills (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100),
        trigger_type VARCHAR(100),
        trigger_config JSONB DEFAULT '{}',
        actions JSONB NOT NULL DEFAULT '[]',
        is_active BOOLEAN DEFAULT false,
        run_count INTEGER DEFAULT 0,
        last_run_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // ── workflow_runs ─────────────────────────────────────────────────────
    await sql`
      CREATE TABLE IF NOT EXISTS workflow_runs (
        id SERIAL PRIMARY KEY,
        skill_id INTEGER REFERENCES workflow_skills(id),
        trigger_data JSONB,
        status VARCHAR(50) DEFAULT 'running',
        steps_completed INTEGER DEFAULT 0,
        steps_total INTEGER DEFAULT 0,
        result JSONB DEFAULT '{}',
        error_message TEXT,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP
      )
    `;

    // ── Seed default workflow skills ────────────────────────────────────
    const existingSkills =
      await sql`SELECT COUNT(*)::int as count FROM workflow_skills`;
    if (existingSkills[0].count === 0) {
      await sql`
        INSERT INTO workflow_skills (name, description, category, trigger_type, trigger_config, actions, is_active) VALUES
        ('Weekly Social Post Generator',
         'Every Monday, AI generates 3 social posts for the week with painting tips and project showcases.',
         'marketing', 'schedule',
         '{"cron": "0 9 * * 1"}',
         '[{"type": "ai_generate", "prompt": "Generate 3 social media posts for a painting company"}, {"type": "save_drafts"}]',
         false),
        ('New Lead Welcome Email',
         'When a new lead is created, automatically send a personalized welcome email.',
         'leads', 'event',
         '{"event": "lead.created"}',
         '[{"type": "ai_generate", "prompt": "Write a welcome email for a new painting lead"}, {"type": "send_email"}]',
         false),
        ('Estimate Follow-Up Reminder',
         'If an estimate has been pending for 3 days, send a gentle follow-up email to the lead.',
         'leads', 'schedule',
         '{"cron": "0 10 * * *", "condition": "estimates.status = pending AND age > 3 days"}',
         '[{"type": "query", "sql": "SELECT pending estimates older than 3 days"}, {"type": "send_email_batch"}]',
         false),
        ('Monthly Performance Report',
         'On the 1st of each month, compile leads, conversions, and revenue into a summary report.',
         'analytics', 'schedule',
         '{"cron": "0 8 1 * *"}',
         '[{"type": "query", "sql": "Aggregate monthly metrics"}, {"type": "ai_generate", "prompt": "Summarize monthly performance"}, {"type": "send_email"}]',
         false),
        ('Review Request After Project',
         'After a project is marked complete, wait 2 days then send a review request to the client.',
         'leads', 'event',
         '{"event": "project.completed", "delay": "2d"}',
         '[{"type": "delay", "duration": "2d"}, {"type": "ai_generate", "prompt": "Write a review request email"}, {"type": "send_email"}]',
         false),
        ('Cold Email Drip Campaign',
         'Automatically advance cold email prospects through the sequence on a daily schedule.',
         'outreach', 'schedule',
         '{"cron": "0 8 * * 1-5"}',
         '[{"type": "query", "sql": "Get prospects due for next step"}, {"type": "send_email_batch"}]',
         false),
        ('Ad Spend Alert',
         'If daily ad spend exceeds budget threshold, send an alert notification.',
         'marketing', 'schedule',
         '{"cron": "0 18 * * *", "condition": "daily_spend > budget_limit"}',
         '[{"type": "query", "sql": "Check daily spend vs budget"}, {"type": "send_notification"}]',
         false),
        ('Stale Lead Cleanup',
         'Weekly scan for leads with no activity in 30+ days. Tag them as stale and notify the team.',
         'leads', 'schedule',
         '{"cron": "0 9 * * 5"}',
         '[{"type": "query", "sql": "Find leads inactive > 30 days"}, {"type": "update_status", "status": "stale"}, {"type": "send_notification"}]',
         false),
        ('SEO Blog Post Generator',
         'Twice a month, AI drafts a blog post targeting local painting keywords for SEO.',
         'marketing', 'schedule',
         '{"cron": "0 9 1,15 * *"}',
         '[{"type": "ai_generate", "prompt": "Write an SEO blog post about painting services in the GTA"}, {"type": "save_drafts"}]',
         false)
      `;
    }

    // ── content_research ───────────────────────────────────────────────────
    await sql`
      CREATE TABLE IF NOT EXISTS content_research (
        id SERIAL PRIMARY KEY,
        research_type VARCHAR(100),
        title VARCHAR(500),
        summary TEXT,
        source_url TEXT,
        source_name VARCHAR(255),
        relevance_score INTEGER DEFAULT 5,
        content_ideas JSONB DEFAULT '[]',
        used_count INTEGER DEFAULT 0,
        tags JSONB DEFAULT '[]',
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // ── content_calendar ────────────────────────────────────────────────────
    await sql`
      CREATE TABLE IF NOT EXISTS content_calendar (
        id SERIAL PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        content_type VARCHAR(100),
        content TEXT,
        research_id INTEGER REFERENCES content_research(id),
        status VARCHAR(50) DEFAULT 'idea',
        scheduled_for TIMESTAMP,
        posted_at TIMESTAMP,
        platform_post_id VARCHAR(255),
        performance JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // ── citation_directories ──────────────────────────────────────────────────
    await sql`
      CREATE TABLE IF NOT EXISTS citation_directories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        url VARCHAR(500) NOT NULL,
        category VARCHAR(100),
        domain_authority INTEGER DEFAULT 0,
        is_free BOOLEAN DEFAULT true,
        submission_url VARCHAR(500),
        notes TEXT,
        priority VARCHAR(20) DEFAULT 'medium'
      )
    `;

    // ── citation_status ─────────────────────────────────────────────────────
    await sql`
      CREATE TABLE IF NOT EXISTS citation_status (
        id SERIAL PRIMARY KEY,
        directory_id INTEGER REFERENCES citation_directories(id),
        status VARCHAR(50) DEFAULT 'not_listed',
        listing_url VARCHAR(500),
        nap_correct BOOLEAN DEFAULT true,
        last_checked_at TIMESTAMP,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // ── Seed citation directories ──────────────────────────────────────────
    const existingDirs =
      await sql`SELECT COUNT(*)::int as count FROM citation_directories`;
    if (existingDirs[0].count === 0) {
      await sql`
        INSERT INTO citation_directories (name, url, category, domain_authority, is_free, submission_url, priority) VALUES
        ('Google Business Profile', 'https://business.google.com', 'general', 100, true, 'https://business.google.com/add', 'high'),
        ('Bing Places', 'https://www.bingplaces.com', 'general', 95, true, 'https://www.bingplaces.com', 'high'),
        ('Apple Maps', 'https://mapsconnect.apple.com', 'general', 90, true, 'https://mapsconnect.apple.com', 'high'),
        ('Facebook Business', 'https://facebook.com/business', 'general', 95, true, 'https://www.facebook.com/pages/create', 'high'),
        ('Yelp', 'https://www.yelp.ca', 'general', 92, true, 'https://biz.yelp.ca/signup', 'high'),
        ('HomeStars', 'https://homestars.com', 'home_services', 68, true, 'https://pro.homestars.com/signup', 'high'),
        ('Better Business Bureau', 'https://www.bbb.org', 'general', 85, false, 'https://www.bbb.org/canada/accreditation-application', 'high'),
        ('Yellow Pages Canada', 'https://www.yellowpages.ca', 'general', 75, true, 'https://www.yellowpages.ca/free-listing/', 'high'),
        ('Canada411', 'https://www.canada411.ca', 'canada', 72, true, 'https://www.canada411.ca/business/add-my-business/', 'high'),
        ('LinkedIn Company', 'https://linkedin.com/company', 'general', 98, true, 'https://www.linkedin.com/company/setup/new/', 'high'),
        ('Houzz', 'https://www.houzz.com', 'home_services', 80, true, 'https://www.houzz.com/pro/signup', 'medium'),
        ('Angi (Angies List)', 'https://www.angi.com', 'home_services', 72, true, 'https://pro.angi.com/signup', 'medium'),
        ('Thumbtack', 'https://www.thumbtack.com', 'home_services', 70, true, 'https://www.thumbtack.com/pro', 'medium'),
        ('Bark.com', 'https://www.bark.com', 'home_services', 65, true, 'https://www.bark.com/become-a-professional/', 'medium'),
        ('Kijiji', 'https://www.kijiji.ca', 'local', 82, true, 'https://www.kijiji.ca/p-post-ad.html', 'medium'),
        ('Oodle', 'https://www.oodle.com', 'general', 60, true, 'https://www.oodle.com/info/add_listing', 'medium'),
        ('Hotfrog Canada', 'https://www.hotfrog.ca', 'canada', 55, true, 'https://www.hotfrog.ca/AddBusiness.aspx', 'medium'),
        ('EZlocal', 'https://www.ezlocal.com', 'general', 52, true, 'https://www.ezlocal.com/add-business', 'medium'),
        ('Manta', 'https://www.manta.com', 'general', 68, true, 'https://www.manta.com/add-your-business', 'medium'),
        ('Foursquare', 'https://foursquare.com', 'general', 75, true, 'https://business.foursquare.com', 'medium'),
        ('FindLocal Canada', 'https://www.findlocal.ca', 'canada', 40, true, 'https://www.findlocal.ca/add-listing', 'low'),
        ('Canadian Business Directory', 'https://www.canadianbusinessdirectory.ca', 'canada', 35, true, 'https://www.canadianbusinessdirectory.ca/add-listing/', 'low'),
        ('Tupalo', 'https://tupalo.com', 'general', 48, true, 'https://tupalo.com/en/add-business', 'low'),
        ('Cylex Canada', 'https://www.cylex.ca', 'canada', 45, true, 'https://www.cylex.ca/add-business.html', 'low'),
        ('n49', 'https://www.n49.ca', 'canada', 42, true, 'https://www.n49.ca/add/', 'low'),
        ('iBegin', 'https://www.ibegin.com', 'canada', 38, true, 'https://www.ibegin.com/add/', 'low'),
        ('Brownbook', 'https://www.brownbook.net', 'general', 50, true, 'https://www.brownbook.net/add-business/', 'low'),
        ('Opendi Canada', 'https://ca.opendi.com', 'canada', 35, true, 'https://ca.opendi.com/add-business/', 'low'),
        ('Contractor Locator', 'https://contractorlocator.ca', 'contractor', 32, true, 'https://contractorlocator.ca/add-listing', 'medium'),
        ('Trusted Pros', 'https://www.trustedpros.ca', 'contractor', 45, true, 'https://www.trustedpros.ca/join', 'medium'),
        ('GoodContractors.ca', 'https://www.goodcontractors.ca', 'contractor', 30, true, 'https://www.goodcontractors.ca/register', 'medium')
      `;
    }

    // ── app_settings (added 2026-06-11 — bootstrap, was missing from this migration) ──
    await sql`
      CREATE TABLE IF NOT EXISTS app_settings (
        id SERIAL PRIMARY KEY,
        company_name VARCHAR(255),
        company_phone VARCHAR(50),
        company_email VARCHAR(255),
        company_address TEXT,
        company_tagline VARCHAR(255),
        onboarding_step INTEGER DEFAULT 1,
        onboarding_completed BOOLEAN DEFAULT false,
        google_prompted_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // ── Onboarding columns on app_settings ──────────────────────────────────
    await sql`ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false`;
    await sql`ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS google_prompted_at TIMESTAMP`;

    // Workflow indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_workflow_skills_category ON workflow_skills(category)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_workflow_skills_is_active ON workflow_skills(is_active)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_workflow_runs_skill_id ON workflow_runs(skill_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_workflow_runs_status ON workflow_runs(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_workflow_runs_started_at ON workflow_runs(started_at DESC)`;

    // Marketing indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_marketing_connections_platform ON marketing_connections(platform)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_platform ON marketing_campaigns(platform)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_status ON marketing_campaigns(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_email_sequences_status ON email_sequences(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_outreach_contacts_sequence_id ON outreach_contacts(sequence_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_outreach_contacts_status ON outreach_contacts(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_ai_conversations_session_id ON ai_conversations(session_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_ad_creatives_platform ON ad_creatives(platform)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_ad_creatives_status ON ad_creatives(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_ad_creatives_created_at ON ad_creatives(created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_ads_accounts_platform ON ads_accounts(platform)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_ads_accounts_is_active ON ads_accounts(is_active)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_live_campaigns_platform ON live_campaigns(platform)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_live_campaigns_status ON live_campaigns(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_live_campaigns_creative_id ON live_campaigns(creative_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_live_campaigns_created_at ON live_campaigns(created_at DESC)`;

    // LinkedIn indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_linkedin_posts_status ON linkedin_posts(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_linkedin_posts_scheduled_for ON linkedin_posts(scheduled_for)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_linkedin_posts_created_at ON linkedin_posts(created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_linkedin_outreach_status ON linkedin_outreach(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_linkedin_outreach_target_role ON linkedin_outreach(target_role)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_linkedin_outreach_created_at ON linkedin_outreach(created_at DESC)`;

    // Content research indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_content_research_type ON content_research(research_type)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_content_research_relevance ON content_research(relevance_score DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_content_research_expires_at ON content_research(expires_at)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_content_research_created_at ON content_research(created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_content_calendar_status ON content_calendar(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_content_calendar_research_id ON content_calendar(research_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_content_calendar_scheduled_for ON content_calendar(scheduled_for)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_content_calendar_created_at ON content_calendar(created_at DESC)`;

    // Cold email indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_cold_email_prospects_status ON cold_email_prospects(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_cold_email_prospects_role ON cold_email_prospects(role)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_cold_email_prospects_email ON cold_email_prospects(email)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_cold_email_prospects_created_at ON cold_email_prospects(created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_cold_email_sends_prospect_id ON cold_email_sends(prospect_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_cold_email_sends_sent_at ON cold_email_sends(sent_at DESC)`;

    // ── Bootstrap admin (only runs on fresh DBs with no users) ──────────────
    // Set BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD in env to enable.
    const bootstrapEmail = process.env.BOOTSTRAP_ADMIN_EMAIL;
    const bootstrapPassword = process.env.BOOTSTRAP_ADMIN_PASSWORD;
    if (bootstrapEmail && bootstrapPassword) {
      const existing = await sql`SELECT COUNT(*) as count FROM auth_users`;
      if (parseInt(existing[0]?.count) === 0) {
        const { hash: bootstrapHash } = await import("argon2");
        const hash = await bootstrapHash(bootstrapPassword);
        await sql`INSERT INTO auth_users (username, password, role, password_is_hashed) VALUES (${bootstrapEmail}, ${hash}, 'owner', true)`;
        console.log(
          `[bootstrap] Created initial owner account: ${bootstrapEmail}`,
        );
      }
    }

    // Citation indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_citation_directories_category ON citation_directories(category)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_citation_directories_priority ON citation_directories(priority)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_citation_directories_domain_authority ON citation_directories(domain_authority DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_citation_status_directory_id ON citation_status(directory_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_citation_status_status ON citation_status(status)`;

    // ── blog_posts ────────────────────────────────────────────────────────────
    await sql`
      CREATE TABLE IF NOT EXISTS blog_posts (
        id SERIAL PRIMARY KEY,
        slug VARCHAR(255) UNIQUE NOT NULL,
        title VARCHAR(500) NOT NULL,
        excerpt TEXT,
        body TEXT,
        cover_image_url TEXT,
        author_id INTEGER REFERENCES auth_users(id) ON DELETE SET NULL,
        status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
        published_at TIMESTAMP,
        meta_description TEXT,
        tags TEXT[] DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at DESC) WHERE status = 'published'`;

    // Seed starter posts (only runs on fresh tables with no rows)
    const postCount = await sql`SELECT COUNT(*) as count FROM blog_posts`;
    if (parseInt(postCount[0]?.count) === 0) {
      await seedBlogPosts(sql);
    }

    console.log("[migrations] 001-initial-schema: complete");
  } catch (err) {
    // Reset flag so next request retries
    migrationRun = false;
    console.error("[migrations] 001-initial-schema: FAILED", err.message);
    throw err;
  }
}

// ── Blog post seeder ────────────────────────────────────────────────────────
async function seedBlogPosts(sql) {
  const authorRes = await sql`SELECT id FROM auth_users ORDER BY id LIMIT 1`;
  const authorId = authorRes[0]?.id || null;

  const posts = [
    {
      slug: "choosing-right-paint-finish-toronto-home",
      title: "Choosing the Right Paint Finish for Your Toronto Home",
      excerpt:
        "Eggshell, satin, semi-gloss — the terminology trips up even seasoned homeowners. Here's the honest breakdown from a crew that's painted thousands of GTA rooms.",
      body: `## Why Finish Matters More Than Color

Walk into any GTA paint store and you'll see hundreds of color chips. But ask most homeowners what finish they want, and you'll get a blank stare. That's a mistake — the wrong sheen ages a room badly and costs you money.

## The Main Players

### Eggshell (Our Most-Recommended Interior Finish)

Eggshell sits between flat and satin on the sheen scale — roughly 10-25% gloss. It's the workhorse of residential interiors for good reason:

- **Hides minor wall imperfections** better than higher sheens
- **Cleans up easily** with a damp cloth — critical in Toronto's climate where salt and grime track in from November to April
- **No shine hotspots** under the harsh fluorescent lighting common in newer GTA homes
- **Works in every room** except kitchens and bathrooms

**Best for:** Living rooms, bedrooms, dining rooms, hallways, offices.

### Satin (High-Traffic and Kids' Zones)

Satin has about 25-35% gloss — enough to notice, not enough to be garish. It's more washable than eggshell:

- **Stands up to scrubbing** — great for households with kids or pets
- **Slight warm glow** that flat paint simply doesn't have
- **Shows wall prep flaws** more than eggshell, so factor that in

**Best for:** Kids' bedrooms, playrooms, mudrooms, high-traffic hallways.

### Semi-Gloss (Kitchens, Bathrooms, Trim)

Semi-gloss (55-65% gloss) is the traditional choice for:

- **Kitchen cabinets** — grease wipes off easily
- **Bathroom walls** — moisture resistance
- **Baseboards, door frames, and window trim** — scuffs and marks clean up without refinishing
- **Ceilings in moisture-prone areas** — bathrooms, above kitchen stoves

**Caution:** Semi-gloss on large wall areas creates visual noise. The reflection draws your eye to every bump and tape seam.

### Flat / Matte (Ceilings and Low-Traffic Areas)

Flat paint has 0-10% gloss. It hides imperfections brilliantly but:

- **Does not wash** — marks just smear
- **Absorbs stains** — kitchen splatter can permanently discolor

**Best for:** Ceilings (where you never touch the walls), adult bedrooms with perfect drywall.

## The Toronto Climate Factor

GTA homes swing from humid summers to dry winters. That affects paint performance:

- **Basements:** Use eggshell or satin with a mold-inhibiting primer. Toronto's older homes (Riverside, Leslieville, the Junction) often have damp foundation issues.
- **Attached garages:** Cold in winter, hot in summer. Semi-gloss on garage interior walls handles temperature swings better.
- **Sun-facing rooms:** High-gloss sheens amplify UV fading on dark colors. Stick to eggshell in south-facing rooms.

## The One Rule That Never Fails

**Lower sheen on large surfaces, higher sheen on trim and details.** Ceilings = flat. Walls = eggshell. Trim = semi-gloss. Cabinets = satin or semi-gloss.

Follow that framework and you'll never regret a paint job.`,
      cover_image_url:
        "https://images.unsplash.com/photo-1562663474-6cbb3eaace17?w=800&q=80",
      meta_description:
        "Eggshell vs satin vs semi-gloss: a Toronto painter's guide to choosing the right paint finish for every room in your GTA home.",
      tags: ["interior-painting", "toronto", "paint-finish", "guide"],
    },
    {
      slug: "exterior-paint-prep-toronto-winter",
      title:
        "Why Skipping Prep Work Is the Costliest Mistake in Exterior Painting",
      excerpt:
        "Pressure washing, scraping, priming — every step that gets skipped shows up 18 months later. Here's exactly what our crews do before the first brush stroke.",
      body: `## The Horror Story We Clean Up Every Spring

Every April, we get calls from homeowners who hired the cheapest bid last fall. The paint is peeling. Blistering. Fading in irregular patches. The quote they got was $2,000 less than ours — and the remediation costs $8,000.

The failure mode is almost always the same: inadequate prep.

## What Proper Exterior Prep Looks Like

### 1. Pressure Washing (Non-Negotiable)

Dirt, chalk, mildew, and loose paint must come off before anything else touches the surface. We use 2,500-3,000 PSI on vinyl and aluminum siding, being careful around:
- Windows and doors (never aim a pressure washer at seals)
- Soffit vents (water driven into attics causes mold)
- Old wood clapboard (too much pressure splinters the grain)

After washing, the house must dry for 24-48 hours. Painting over a damp surface = instant adhesion failure.

### 2. Scraping and Sanding

Loose paint bonds to nothing. We scrape every square inch where paint is lifting, then feather-sand the edges so the new coat transitions smoothly. This step alone can add hours to a job — which is why the $2,000-cheaper bidder skips it.

### 3. Caulking Gaps and Joints

Toronto's freeze-thaw cycle is brutal on exterior joints. Water gets into cracks, expands when it freezes, and pops caulking — and eventually paint — off entirely. We:
- Remove all failing caulking
- Re-caulk with a paintable silicone-latex hybrid (Dap 3.0 or equivalent)
- Prime any exposed bare wood

### 4. Priming Bare Spots

Bare wood, sponged metal, patches — these need primer before topcoat. Without it, the topcoat soaks in unevenly and the color looks blotchy within one season.

### 5. Protection of Plants and Hardscaping

We cover landscaping with breathable tarps, lay down drop cloths on patios and walkways, and remove or mask any lighting fixtures. A gallon of paint on a hosta kills it. We've seen it happen on jobs we didn't do — but we've never had a callback for it.

## Timeline for a Typical GTA Exterior

For a 2,000 sq ft GTA home:
- Prep (wash, scrape, caulk): 1-2 days
- Drying time: 1-2 days (if weather cooperates)
- Priming bare spots: half day
- First coat: 1 day
- Second coat: 1 day
- Touch-up and cleanup: half day

**Total: 4-6 days of actual work**, not including weather delays.

## What a Proper Quote Should Include

Ask any exterior painter to walk you through their prep process before signing. If they can't describe it in detail, move on. The price difference between a proper prep and a shortcut job shows up in 18 months — and the cost to fix it is always more than the original difference.

## Weather Windows in Toronto

The ideal painting window in the GTA:
- **May through mid-June** — temperatures 10-25°C, low humidity
- **Late August through September** — same range, but you're racing against October frosts
- **Never** below 10°C or above 35°C
- **Never** when rain is forecast within 24 hours

The most common failure we see from other companies: painting in October because "the customer wanted it done." The paint didn't fully cure before the first frost. Result: complete peel job the following spring.`,
      cover_image_url:
        "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80",
      meta_description:
        "Pressure washing, scraping, priming — every skipped prep step shows up within 18 months. Here's exactly what proper exterior paint prep looks like.",
      tags: ["exterior-painting", "prep", "toronto", "guide"],
    },
    {
      slug: "color-trends-gta-2026",
      title: "The 5 Paint Colors GTA Homeowners Are Actually Choosing in 2026",
      excerpt:
        "We pulled the color data from 200+ Arcan projects completed in 2025-2026. Here's what's working in Riverdale, High Park, and Bay Street penthouses alike.",
      body: `## What 200+ Projects Tell Us

We're not trend forecasters — we're painters. But we see color in ways that showrooms and swatches can't replicate. When you see the same navy front door on a 1920s semi in Riverdale and a modern condo in Liberty Village, you start to notice patterns.

## The Five Colors That Won 2025-2026

### 1. Uppity Blue (Sherwin-Williams 7106 / BM HC-190)

A mid-tone blue that works on exteriors and interiors. On brick, it reads as traditional without being colonial. On interior accent walls, it pairs with warm oak floors better than gray ever did.

**Where we used it:** Three full-exterior repaints, two feature walls, one set of built-in bookshelves.

### 2. Urbane Bronze (Benjamin Moore 2115-10)

A dark warm brown that's replacing black as the go-to exterior trim color in the GTA. Where charcoal and black read as stark against red brick, bronze flows. It's especially effective on:
- Front doors
- Porch columns
- Garage doors on mid-century homes

### 3. Pale Silver (Sherwin-Williams 7641)

The gray cycle is over, but gray's gentler cousin is still going strong. Pale silver reads as neutral without the coldness of pure gray. Toronto developers have been painting walls this color for a decade — and homeowners are now following.

**Works in:** North-facing rooms (where warmer tones look dingy), open-concept main floors, condo interiors.

### 4. Raindrift (Benjamin Moore OC-52)

A blue-gray with more blue than gray. It's the default answer to "I want something calming but not boring." We've specified it in:
- Master bedrooms (it reads as spa-like in the right light)
- Bathrooms (more interesting than white, still clean)
- Ceilings in basements (where flat paint is appropriate but white feels clinical)

### 5. Manchester Tan (Benjamin Moore OC-51)

The "greige" category has been diluted by thousands of variants, but Manchester Tan is the original. It works on every wall, in every light, in every room type. If a homeowner can't commit to a color direction, this is our default recommendation.

**Note:** This color has been in the BM palette for over a decade. It reads as timeless rather than trendy — which is the goal for most of our clients.

## What We're Painting Over

### What's Declining

- **Alabaster White (SW 7011)** — Too stark. Replaced by warmer off-whites.
- **Charcoal front doors** — Still popular but being replaced by deep greens and navy.
- **All-gray-everything** — The gray wave is done. Warm neutrals are the replacement.

### What's Still Going Strong

- **Black exterior trim** — Works on modern and contemporary architecture. Traditional homes look better in bronze.
- **Dark green** — All shades, from deep forest to sage. Specifically popular in the Junction, Leslieville, and Riverdale.
- **Warm white walls** — Not pure white, but cream, ivory, and warm off-white. Pure white reads as commercial.

## Our Recommendation

If you're stuck, start with one of the five above. They're proven in GTA conditions, work with the architectural stock we have in this city, and won't look dated in five years.`,
      cover_image_url:
        "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
      meta_description:
        "We painted 200+ GTA homes in 2025-2026. These are the five colors that showed up most often — and why they work in Toronto's climate and architecture.",
      tags: ["color-guide", "toronto", "trends", "interior-painting"],
    },
    {
      slug: "interior-painting-cost-toronto-2026",
      title: "What Interior Painting Actually Costs in the GTA in 2026",
      excerpt:
        "A room-by-room breakdown based on real Arcan quotes issued in 2025. We include what other contractors hide: the variables that make your quote $2,000 or $12,000 for the same square footage.",
      body: `## Why Interior Painting Quotes Vary by 4x for the Same Space

We quote a 400 sq ft basement apartment at $3,200. Another contractor quotes $7,800. Same layout. Same paint. The difference is prep — and it's not even the main variable.

Here's the real breakdown.

## Per-Square-Foot Numbers (What We're Actually Charging in 2026)

### Ceilings
**$1.50–$2.50 per sq ft** (paint and labor)

Most GTA painters charge by the room or by the job, not by the sq ft — but when we break it down, ceilings run $1.50-2.50/sq ft because:
- Popcorn ceilings (common in GTA high-rises and 1970s-80s semis) require either sealing or removal
- Vaulted ceilings need staging equipment
- Insurance requirements for WSIB coverage on ladder work add overhead

### Walls
**$2.50–$4.00 per sq ft**

This is where the range gets wide. Factors that push to the high end:
- **Number of coats** — Covering a dark color with light requires three coats minimum. Two coats is only possible with similar colors.
- **Patch and repair** — Bare drywall paper showing through requires skim-coating. Bare plaster in older homes (Parkdale, Bloor West Village) requires different treatment entirely.
- **Texture** — Skip-triple, orange peel, and knockdown textures are common in GTA homes built between 1960-1990. They need to be dealt with before painting.

### Trim (Baseboards, Door Frames, Window Casings)
**$3.00–$6.00 per linear ft**

Trim is priced per linear foot because the prep-to-paint ratio is higher than walls. Cutting in around trim takes significantly more time than rolling walls.

### Closets and Utility Rooms
**$300–$600 flat rate**

These are often treated as add-on work. We typically price them at $300-600 depending on size because they're simple — one color, minimal prep.

## The Variables That Affect Your Quote

### 1. Number of Colors
Every color change requires:
- Taping adjacent surfaces (30-60 min per wall)
- Tinting the paint (when using custom colors, small batches take time)
- Drying time between coats (30-60 min in a heated space)

Three colors in a kitchen/dining/living open concept can add $400-800 to a job.

### 2. Condition of Walls
New drywall (condos, new builds): Minimal prep. One coat of primer, two coats of finish.
Repaint (existing walls): Assess for nail holes, cracks, scuffs. Expect $0.15-0.30/sq ft in patch costs if we're doing it right.
Older plaster: Entirely different skill set. Potentially $1.00+/sq ft.

### 3. Access
- Condo/apartment: Elevator requirements, building rules about hallway use, parking for crew
- House with contents: Furniture moving is a variable. We charge $200-400 for full packing/unpacking of a room.
- Multi-level: Staging requirements on stairs above 12 ft

### 4. Ceiling Height
Standard 8 ft: Normal rolling. Included in standard rates.
9-10 ft: Added time for extension poles, potential staging. Add 15-20%.
11+ ft: Requires scaffolding or lifts. Significant cost increase.

## What a Typical GTA Interior Costs

### 2-Bedroom Condo (800 sq ft interior)
- Full walls, two coats, one color: **$2,800–$3,800**
- Add ceilings: **+$1,200–$1,600**
- Add trim (all baseboards, door frames): **+$1,500–$2,200**
- **Total: $5,500–$7,600**

### 3-Bedroom Semi-Detached (1,400 sq ft interior)
- Full walls, two coats, one color: **$4,800–$6,200**
- Add ceilings: **+$2,100–$2,800**
- Add trim: **+$2,800–$4,000**
- **Total: $9,700–$13,000**

### 4-Bedroom Detached (2,200 sq ft interior)
- Full walls, two coats, one color: **$6,800–$8,800**
- Add ceilings: **+$3,300–$4,400**
- Add trim: **+$4,200–$6,000**
- **Total: $14,300–$19,200**

## What You Should Demand from Any Quote

1. **Per-room or per-area breakdown** — Not just a lump sum
2. **Number of coats per surface** — Should be specified
3. **Paint brand and line** — Budget paints (Behr, some Home Depot brands) are explicitly excluded in quality contractor quotes
4. **Prep description** — Ask "what will you do about the cracks in the corners?"
5. **Furniture moving terms** — Who moves what, and what happens if something is damaged?

A quote that doesn't answer these questions is a quote you shouldn't sign.`,
      cover_image_url:
        "https://images.unsplash.com/photo-1562663474-6cbb3eaace17?w=800&q=80",
      meta_description:
        "What interior painting actually costs in the GTA in 2026. Room-by-room breakdown from real Arcan quotes. Includes the variables that make quotes vary by 4x.",
      tags: ["cost-guide", "toronto", "interior-painting", "guide"],
    },
    {
      slug: "diy-vs-hire-professional-painter",
      title:
        "DIY vs. Hiring a Pro: An Honest Cost-Benefit Analysis for GTA Homeowners",
      excerpt:
        "We get calls from people who just want a quote — and then they disappear for three months and come back frustrated. Here's the math, without the sales pitch.",
      body: `## Why We Write This Honestly

We're painters. Every job we don't quote is a job we don't get. So writing this means some homeowners will choose the DIY route. That's fine. We want homeowners to make an informed decision — even if it's not the one that fills our calendar.

## The DIY Math (Real Numbers)

### Paint and Materials for a 400 sq ft Basement Apartment

- **Paint:** 2 gallons @ $60/gallon (good quality, BM or SW) = $120
- **Primer:** 1 gallon = $40
- **Supplies (tape, brushes, rollers, trays, drop cloths):** $80-120
- **Patch compound:** $20
- **Total materials: $260–$280**

That's for a single room, single color, no unusual conditions.

### The Hidden Costs Most DIY Budgets Miss

1. **Your time:** A 400 sq ft room takes 6-10 hours to paint properly (prep + two coats + drying time between coats). At $30/hr opportunity cost, that's $180-300 in time.
2. **Equipment rental:** Extension ladder if you don't own one ($50-80/day)
3. **Touch-up paint:** You'll buy more than you need. Leftover partial cans aren't returnable.
4. **Mistakes:** A visible lap mark, inconsistent coverage, or paint on the ceiling = either living with it or hiring someone to fix it ($400-800 minimum for a room)

### DIY Realistic Total: $500–$700 for a Simple Room

For a straightforward repaint in good condition, with no major prep, the DIY cost is roughly 20-30% of a professional quote. The math works — **if** nothing goes wrong.

## When DIY Makes Sense

- **You're painting a single room, one color, with no major prep needed**
- **You're experienced with a roller and brush** — cutting in cleanly takes practice
- **You have a weekend to dedicate** — professional crews do in one day what DIY takes a weekend
- **The walls are in good condition** — no cracks, holes, or patches
- **You're using the same or very similar color** — less prep, fewer coats

## When You Should Hire Out

- **More than two rooms** — The time investment multiplies. Three rooms = a full week of evenings and weekend.
- **Color change (dark to light or vice versa)** — Requires three coats minimum. The cost of materials and time exceeds the professional quote difference.
- **Prep-heavy walls** — Cracks, holes, textured surfaces, water damage. These require skills that aren't YouTube-learnable in an afternoon.
- **High-visibility areas** — Front entrance, living room, kitchen. The cost of a visible mistake is higher than the painting cost.
- **Rental properties** — Speed matters. A professional crew does in a day what takes a DIYer a week. Time = money you could be earning elsewhere.
- **Any exterior work above one storey** — Falls and ladder accidents are the leading cause of DIY painting failures. Not just paint failures — actual injuries.

## The Three Questions That Should Determine Your Decision

1. **How many hours will this take?** If the answer is more than 16 hours total (two rooms, two coats each), the time cost alone may exceed the professional quote.
2. **How visible is this area?** A hallway is forgiving. A kitchen with open shelving is not.
3. **What happens if I get it wrong?** If the answer is "I hire someone to fix it," you've already spent the professional rate — plus the DIY materials.

## Our Bias

We think professional painting is worth it for most interior work above 600 sq ft, any exterior work, and any situation where the walls need more than minor patching. We also think DIY is completely reasonable for a single room refresh with similar colors and good wall conditions.

The homeowners who get frustrated are the ones who underestimate the time and skill required, and overestimate their ability to fix mistakes once made. If you're honest with yourself about your skill level and available time, you'll make the right call — whether that's calling us or doing it yourself.`,
      cover_image_url:
        "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80",
      meta_description:
        "An honest cost-benefit analysis of DIY vs. hiring a professional painter in the GTA. Real numbers, no sales pitch. When it's worth it to DIY and when it isn't.",
      tags: ["diy-vs-pro", "toronto", "guide", "cost-guide"],
    },
  ];

  for (const post of posts) {
    await sql`
      INSERT INTO blog_posts (slug, title, excerpt, body, cover_image_url, author_id, status, published_at, meta_description, tags)
      VALUES (
        ${post.slug},
        ${post.title},
        ${post.excerpt},
        ${post.body},
        ${post.cover_image_url},
        ${authorId},
        'published',
        CURRENT_TIMESTAMP,
        ${post.meta_description},
        ${post.tags}
      )
    `;
  }
  console.log("[seed] blog_posts: inserted", posts.length, "starter posts");
}

// ── v2: add the tables that routes query but v1 forgot. These were
// extracted from the INSERT/SELECT statements in the corresponding API
// route files. If a route adds a new column, mirror it here. All CREATE
// statements are idempotent (IF NOT EXISTS), so re-running the migration
// is safe.
async function ensureMissingTables() {
  // Availability slots (admin can publish bookable time windows)
  await sql`
    CREATE TABLE IF NOT EXISTS availability_slots (
      id SERIAL PRIMARY KEY,
      slot_date DATE NOT NULL,
      start_time TIME NOT NULL,
      end_time TIME NOT NULL,
      capacity INTEGER NOT NULL DEFAULT 1,
      status VARCHAR(50) NOT NULL DEFAULT 'open',
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_availability_slots_date ON availability_slots(slot_date)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_availability_slots_status ON availability_slots(status)`;

  // Appointments (a booking against an availability slot)
  await sql`
    CREATE TABLE IF NOT EXISTS appointments (
      id SERIAL PRIMARY KEY,
      slot_id INTEGER REFERENCES availability_slots(id) ON DELETE CASCADE,
      lead_id INTEGER REFERENCES leads(id) ON DELETE SET NULL,
      name VARCHAR(255),
      email VARCHAR(255),
      phone VARCHAR(50),
      address TEXT,
      notes TEXT,
      status VARCHAR(50) DEFAULT 'booked',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_appointments_slot ON appointments(slot_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_appointments_lead ON appointments(lead_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status)`;

  // Notifications (admin inbox)
  await sql`
    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      type VARCHAR(50) NOT NULL,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      user_id INTEGER,
      email VARCHAR(255),
      related_id INTEGER,
      related_type VARCHAR(50),
      is_read BOOLEAN DEFAULT FALSE,
      send_email BOOLEAN DEFAULT FALSE,
      data JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC)`;

  // Completion workflows (per-project checklist)
  await sql`
    CREATE TABLE IF NOT EXISTS completion_workflows (
      id SERIAL PRIMARY KEY,
      project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
      step_title VARCHAR(255) NOT NULL,
      step_description TEXT,
      step_order INTEGER DEFAULT 1,
      is_required BOOLEAN DEFAULT TRUE,
      estimated_hours NUMERIC,
      is_completed BOOLEAN DEFAULT FALSE,
      completed_at TIMESTAMP,
      completed_by INTEGER REFERENCES team_members(id) ON DELETE SET NULL,
      actual_hours NUMERIC,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_completion_workflows_project ON completion_workflows(project_id)`;
  await sql`ALTER TABLE completion_workflows ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT FALSE`;
  await sql`ALTER TABLE completion_workflows ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP`;
  await sql`ALTER TABLE completion_workflows ADD COLUMN IF NOT EXISTS completed_by INTEGER REFERENCES team_members(id) ON DELETE SET NULL`;
  await sql`ALTER TABLE completion_workflows ADD COLUMN IF NOT EXISTS actual_hours NUMERIC`;
  await sql`ALTER TABLE completion_workflows ADD COLUMN IF NOT EXISTS notes TEXT`;

  // Project progress (daily site reports)
  await sql`
    CREATE TABLE IF NOT EXISTS project_progress (
      id SERIAL PRIMARY KEY,
      project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
      report_date DATE NOT NULL,
      work_description TEXT,
      progress_percentage INTEGER,
      hours_worked NUMERIC,
      team_members_present JSONB DEFAULT '[]'::jsonb,
      materials_used TEXT,
      challenges_faced TEXT,
      next_steps TEXT,
      weather_conditions VARCHAR(255),
      client_interaction TEXT,
      quality_notes TEXT,
      photos JSONB DEFAULT '[]'::jsonb,
      reported_by VARCHAR(255),
      is_milestone BOOLEAN DEFAULT FALSE,
      milestone_description TEXT,
      customer_visible BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_project_progress_project ON project_progress(project_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_project_progress_date ON project_progress(report_date DESC)`;
  await sql`ALTER TABLE project_progress ADD COLUMN IF NOT EXISTS customer_visible BOOLEAN DEFAULT FALSE`;
  await sql`ALTER TABLE project_progress ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`;

  // Field issues turn site discoveries and blockers into owned, auditable work.
  await sql`
    CREATE TABLE IF NOT EXISTS project_issues (
      id SERIAL PRIMARY KEY,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      issue_type VARCHAR(50) NOT NULL DEFAULT 'other',
      severity VARCHAR(20) NOT NULL DEFAULT 'medium',
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      status VARCHAR(30) NOT NULL DEFAULT 'open',
      resolution TEXT,
      assigned_to INTEGER REFERENCES team_members(id) ON DELETE SET NULL,
      due_date DATE,
      created_by INTEGER REFERENCES auth_users(id) ON DELETE SET NULL,
      created_by_name VARCHAR(255),
      resolved_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_project_issues_project_status ON project_issues(project_id, status, severity)`;

  // Actual non-labor job costs, including receipt evidence and tax separation.
  await sql`
    CREATE TABLE IF NOT EXISTS project_expenses (
      id SERIAL PRIMARY KEY,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      category VARCHAR(50) NOT NULL,
      description VARCHAR(500) NOT NULL,
      vendor VARCHAR(255),
      amount NUMERIC(12, 2) NOT NULL,
      tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
      total_amount NUMERIC(12, 2) NOT NULL,
      incurred_on DATE NOT NULL,
      receipt_url TEXT,
      status VARCHAR(30) NOT NULL DEFAULT 'recorded',
      recorded_by INTEGER REFERENCES auth_users(id) ON DELETE SET NULL,
      recorded_by_name VARCHAR(255),
      voided_at TIMESTAMP,
      voided_by INTEGER REFERENCES auth_users(id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_project_expenses_project ON project_expenses(project_id, status, incurred_on DESC)`;

  // Vendor commitments become actual expenses only when received.
  await sql`
    CREATE TABLE IF NOT EXISTS purchase_orders (
      id SERIAL PRIMARY KEY,
      purchase_order_number VARCHAR(64) UNIQUE NOT NULL,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      category VARCHAR(50) NOT NULL,
      vendor VARCHAR(255) NOT NULL,
      description VARCHAR(500) NOT NULL,
      amount NUMERIC(12, 2) NOT NULL,
      tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
      total_amount NUMERIC(12, 2) NOT NULL,
      expected_on DATE,
      order_reference VARCHAR(255),
      receipt_url TEXT,
      status VARCHAR(30) NOT NULL DEFAULT 'draft',
      expense_id INTEGER UNIQUE REFERENCES project_expenses(id) ON DELETE SET NULL,
      created_by INTEGER REFERENCES auth_users(id) ON DELETE SET NULL,
      created_by_name VARCHAR(255),
      approved_at TIMESTAMP, ordered_at TIMESTAMP, received_at TIMESTAMP, cancelled_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_purchase_orders_project_status ON purchase_orders(project_id, status, expected_on)`;

  // Change orders connect field discoveries to approved scope, schedule, and value.
  await sql`
    CREATE TABLE IF NOT EXISTS change_orders (
      id SERIAL PRIMARY KEY,
      change_order_number VARCHAR(64) UNIQUE NOT NULL,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      lead_id INTEGER REFERENCES leads(id) ON DELETE SET NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      reason TEXT,
      amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
      tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 13,
      tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
      total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
      schedule_impact_days INTEGER NOT NULL DEFAULT 0,
      status VARCHAR(30) NOT NULL DEFAULT 'draft',
      requested_by VARCHAR(255),
      approved_by VARCHAR(255),
      approved_at TIMESTAMP,
      rejected_at TIMESTAMP,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_change_orders_project ON change_orders(project_id, created_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_change_orders_status ON change_orders(status)`;

  // Revocable customer portal links. Raw bearer tokens are never persisted;
  // only a SHA-256 digest is stored so a database read cannot reveal links.
  await sql`
    CREATE TABLE IF NOT EXISTS customer_portal_tokens (
      id SERIAL PRIMARY KEY,
      lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
      token_hash VARCHAR(64) UNIQUE NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      revoked_at TIMESTAMP,
      last_used_at TIMESTAMP,
      created_by INTEGER REFERENCES auth_users(id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_customer_portal_tokens_lead ON customer_portal_tokens(lead_id, created_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_customer_portal_tokens_active ON customer_portal_tokens(token_hash, expires_at) WHERE revoked_at IS NULL`;

  // Time tracking (clock-in/clock-out against a project or task)
  await sql`
    CREATE TABLE IF NOT EXISTS time_tracking (
      id SERIAL PRIMARY KEY,
      team_member_id INTEGER REFERENCES team_members(id) ON DELETE CASCADE,
      project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
      internal_task_id INTEGER,
      clock_in_time TIMESTAMP NOT NULL,
      clock_out_time TIMESTAMP,
      break_duration_minutes INTEGER DEFAULT 0,
      total_hours NUMERIC,
      hourly_rate NUMERIC,
      total_cost NUMERIC,
      work_description TEXT,
      location VARCHAR(255),
      notes TEXT,
      status VARCHAR(50) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_time_tracking_member ON time_tracking(team_member_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_time_tracking_project ON time_tracking(project_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_time_tracking_status ON time_tracking(status)`;

  // Contract templates (reusable contract boilerplate)
  await sql`
    CREATE TABLE IF NOT EXISTS contract_templates (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      scope_template TEXT,
      terms_template TEXT,
      payment_terms_template TEXT,
      warranty_template TEXT,
      default_deposit_percentage NUMERIC DEFAULT 25,
      is_active BOOLEAN DEFAULT TRUE,
      is_default BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_contract_templates_active ON contract_templates(is_active)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_contract_templates_default ON contract_templates(is_default)`;

  // Internal tasks (admin's private to-do list; time-tracking JOINs to it)
  await sql`
    CREATE TABLE IF NOT EXISTS internal_tasks (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      status VARCHAR(20) DEFAULT 'todo',
      priority VARCHAR(20) DEFAULT 'medium',
      assignee_id INTEGER REFERENCES team_members(id) ON DELETE SET NULL,
      due_date DATE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_internal_tasks_status ON internal_tasks(status)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_internal_tasks_priority ON internal_tasks(priority)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_internal_tasks_assignee ON internal_tasks(assignee_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_internal_tasks_due_date ON internal_tasks(due_date)`;

  console.log("[migrations] v2 tables: complete");
}

// Cached promise — run once, share across concurrent startup callers
let _migrationPromise = null;

export function ensureSchema() {
  if (!_migrationPromise) {
    _migrationPromise = runMigrations()
      .then(() => ensureMissingTables())
      .catch((err) => {
        _migrationPromise = null; // Allow retry on next call
        throw err;
      });
  }
  return _migrationPromise;
}
