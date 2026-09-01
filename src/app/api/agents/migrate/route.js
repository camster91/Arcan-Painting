/**
 * POST /api/agents/migrate
 * Run database migrations to add AI agent fields to existing tables.
 * Admin-only endpoint. Safe to run multiple times.
 */

import { getCurrentUser } from '../../utils/auth.js';
import { requireCsrf } from '../../utils/csrf.js';
import { auditLog } from '../../utils/audit.js';
import { migrateAgentFields } from '../migrate.js';
import { logAgentRun, updateAgentRun } from '../store.js';

export async function POST(request) {
  const csrfError = requireCsrf(request);
  if (csrfError) return csrfError;
  const user = await getCurrentUser(request);
  if (!user || !['owner', 'admin'].includes(user.role)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  let runRecord;

  try {
    // Log the agent run
    runRecord = await logAgentRun({
      agent_id: 'migrate',
      agent_name: 'Migration Agent',
      status: 'running',
      input: {},
      reference_type: null,
      reference_id: null,
    });

    const results = await migrateAgentFields();
    const errors = results.filter(r => r.status === 'error');

    // Update run record
    await updateAgentRun(runRecord.id, {
      status: errors.length === 0 ? 'success' : 'failure',
      output: { migrations: results, summary: `${results.filter(r => r.status === 'ok').length} applied, ${results.filter(r => r.status.includes('skipped')).length} skipped, ${errors.length} errors` },
    });

    await auditLog({
      request,
      action: 'agent_migration.run',
      userId: user.id,
      username: user.username,
      resource: 'agent_migration',
      resourceId: runRecord.id,
      changes: {
        applied: results.filter(r => r.status === 'ok').length,
        skipped: results.filter(r => r.status.includes('skipped')).length,
        failed: errors.length,
      },
      status: errors.length === 0 ? 'success' : 'failure',
    });

    return Response.json({
      success: errors.length === 0,
      migrations: results,
      summary: `${results.filter(r => r.status === 'ok').length} applied, ${results.filter(r => r.status.includes('skipped')).length} skipped, ${errors.length} errors`,
    });
  } catch (error) {
    console.error('Migration route error:', error.message);
    
    // Update run record with error
    if (runRecord?.id) {
      await updateAgentRun(runRecord.id, {
        status: 'failure',
        error: error.message,
      });
    }
    await auditLog({
      request,
      action: 'agent_migration.run',
      userId: user.id,
      username: user.username,
      resource: 'agent_migration',
      resourceId: runRecord?.id,
      changes: { failed: true },
      status: 'failure',
    });
    
    return Response.json(
      { error: 'Migration failed', details: error.message },
      { status: 500 }
    );
  }
}
