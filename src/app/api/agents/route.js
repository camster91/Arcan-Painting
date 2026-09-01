/**
 * GET /api/agents — health check and status for AI agents (ADMIN ONLY)
 * POST /api/agents returns routing guidance. The migration handler is the
 * dedicated /api/agents/migrate route.
 *
 * The /runs sub-path lives in src/app/api/agents/runs/route.js so it
 * actually matches a real route in React Router 7.
 */

import { requireAdmin, unauthorizedResponse } from '../utils/auth.js';
import { pingOpenClaw } from './openclaw.js';
import { requireCsrf } from '../utils/csrf.js';

export async function GET(request) {
  const authorized = await requireAdmin(request);
  if (!authorized) {
    return unauthorizedResponse();
  }

  const openclawOnline = await pingOpenClaw();

  return Response.json({
    agents: [
      { id: 'lead-qualifier', name: 'Lead Qualifier', endpoint: '/api/agents/lead-qualifier', trigger: 'contact form' },
      { id: 'schedule-estimator', name: 'Estimator Scheduler', endpoint: '/api/agents/schedule-estimator', trigger: 'admin button' },
      { id: 'proposal-generator', name: 'Proposal Generator', endpoint: '/api/agents/proposal-generator', trigger: 'admin button' },
      { id: 'migrate', name: 'Migration Agent', endpoint: '/api/agents/migrate', trigger: 'manual' },
      { id: 'customer-support', name: 'Customer Support', endpoint: '/api/agents/customer-support', trigger: 'new chat message' },
    ],
    openclaw: {
      url: process.env.OPENCLAW_URL || 'http://localhost:18789',
      online: openclawOnline,
      configured: !!process.env.OPENCLAW_URL,
    },
  });
}

export async function POST(request) {
  const csrfError = requireCsrf(request);
  if (csrfError) return csrfError;

  return Response.json({ error: 'Use POST /api/agents/migrate to run migrations' }, { status: 400 });
}
