/**
 * POST /api/agents/migrate
 * Run database migrations to add AI agent fields to existing tables.
 * Admin-only endpoint. Safe to run multiple times.
 */

import { requireAdmin } from '../../utils/auth.js';
import { migrateAgentFields } from '../migrate.js';

export async function POST(request) {
  try {
    const authorized = await requireAdmin(request);
    if (!authorized) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const results = await migrateAgentFields();
    const errors = results.filter(r => r.status === 'error');

    return Response.json({
      success: errors.length === 0,
      migrations: results,
      summary: `${results.filter(r => r.status === 'ok').length} applied, ${results.filter(r => r.status.includes('skipped')).length} skipped, ${errors.length} errors`,
    });
  } catch (error) {
    console.error('Migration route error:', error.message);
    return Response.json(
      { error: 'Migration failed', details: error.message },
      { status: 500 }
    );
  }
}
