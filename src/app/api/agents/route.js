/**
 * GET /api/agents — health check and status for AI agents
 * POST /api/agents/migrate — run DB migrations for agent fields
 */

import { requireAdmin } from '../utils/auth.js';
import { pingOpenClaw } from './openclaw.js';
import { migrateAgentFields } from './migrate.js';

export async function GET(request) {
  const openclawOnline = await pingOpenClaw();
  
  return Response.json({
    agents: [
      { id: 'lead-qualifier', name: 'Lead Qualifier', endpoint: '/api/agents/lead-qualifier', trigger: 'contact form' },
      { id: 'schedule-estimator', name: 'Estimator Scheduler', endpoint: '/api/agents/schedule-estimator', trigger: 'admin button' },
      { id: 'proposal-generator', name: 'Proposal Generator', endpoint: '/api/agents/proposal-generator', trigger: 'admin button' },
      { id: 'customer-support', name: 'Customer Support', endpoint: '/api/agents/customer-support', trigger: 'new chat message' },
    ],
    openclaw: {
      url: process.env.OPENCLAW_URL || 'http://localhost:18789',
      online: openclawOnline,
    },
  });
}

export async function POST(request) {
  // Handle migration sub-path
  const url = new URL(request.url);
  if (url.pathname.endsWith('/migrate')) {
    const authorized = await requireAdmin(request);
    if (!authorized) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const results = await migrateAgentFields();
    return Response.json({ success: true, migrations: results });
  }

  return Response.json({ error: 'Use POST /api/agents/migrate to run migrations' }, { status: 400 });
}
