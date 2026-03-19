/**
 * Audit logging utilities.
 * Logs security-relevant events to the audit_logs table.
 */
import sql from "./sql.js";

let tableEnsured = false;

export async function ensureAuditTable() {
  if (tableEnsured) return;
  await sql`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id         SERIAL PRIMARY KEY,
      user_id    INTEGER,
      username   VARCHAR(255),
      action     VARCHAR(255) NOT NULL,
      resource   VARCHAR(255),
      resource_id VARCHAR(255),
      ip         VARCHAR(64),
      user_agent TEXT,
      changes    JSONB,
      status     VARCHAR(50) DEFAULT 'success',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action)`;
  tableEnsured = true;
}

/**
 * Log an audit event.
 * @param {object} opts
 * @param {Request} [opts.request]   - HTTP request (for IP / user-agent)
 * @param {number}  [opts.userId]
 * @param {string}  [opts.username]
 * @param {string}  opts.action      - e.g. 'login', 'payment.create', 'contract.update'
 * @param {string}  [opts.resource]  - e.g. 'payment', 'contract'
 * @param {string}  [opts.resourceId]
 * @param {object}  [opts.changes]   - diff or relevant fields
 * @param {string}  [opts.status]    - 'success' | 'failure'
 */
export async function auditLog({
  request,
  userId,
  username,
  action,
  resource,
  resourceId,
  changes,
  status = "success",
}) {
  try {
    await ensureAuditTable();
    const ip = request
      ? (request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
         request.headers.get("x-real-ip") ||
         "unknown")
      : null;
    const userAgent = request ? (request.headers.get("user-agent") || null) : null;

    await sql`
      INSERT INTO audit_logs (user_id, username, action, resource, resource_id, ip, user_agent, changes, status)
      VALUES (
        ${userId || null},
        ${username || null},
        ${action},
        ${resource || null},
        ${resourceId ? String(resourceId) : null},
        ${ip},
        ${userAgent},
        ${changes ? JSON.stringify(changes) : null},
        ${status}
      )
    `;
  } catch (err) {
    // Never crash the main request because of audit logging
    console.error("[audit] Failed to write audit log:", err?.message);
  }
}
