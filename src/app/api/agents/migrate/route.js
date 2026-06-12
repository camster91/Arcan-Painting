/**
 * POST /api/agents/migrate
 * Run database migrations to add AI agent fields to existing tables.
 * Admin-only endpoint. Safe to run multiple times.
 */

import { requireAdmin } from '../../utils/auth.js';
import { requireCsrf } from '../../utils/csrf.js';
import { migrateAgentFields } from '../migrate.js';
import { logAgentRun, updateAgentRun } from '../store.js';

export async function POST(request) {
  const csrfError = requireCsrf(request);
  if (csrfError) return csrfError;

  try {
    const authorized = await requireAdmin(request);
    if (!authorized) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Log the agent run
    const runRecord = await logAgentRun({
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
    
    return Response.json(
      { error: 'Migration failed', details: error.message },
      { status: 500 }
    );
  }
}
