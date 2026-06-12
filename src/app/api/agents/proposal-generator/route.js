/**
 * POST /api/agents/proposal-generator
 * 
 * Triggered from the admin Estimates page "Generate Proposal" button.
 * Spawns the arcan-proposal-generator agent to create a full proposal document.
 * 
 * Body: { estimateId }
 * Returns: { proposal_html, client_email, internal_notes, proposal_url }
 */

import sql from '../../utils/sql.js';
import { spawnAgent, parseAgentJSON } from '../openclaw.js';
import { requireAdmin } from '../../utils/auth.js';
import { notifyGerardo } from '../../utils/telegram.js';
import { requireCsrf } from '../../utils/csrf.js';
import { logAgentRun, updateAgentRun } from '../store.js';

const CONTEXT_FILE = 'agents/arcan-proposal-generator.md';

export async function POST(request) {
  const csrfError = requireCsrf(request);
  if (csrfError) return csrfError;

  try {
    // Admin-only endpoint
    const authorized = await requireAdmin(request);
    if (!authorized) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { estimateId } = body;

    if (!estimateId) {
      return Response.json({ error: 'estimateId is required' }, { status: 400 });
    }

    // Fetch estimate with lead info
    const estimates = await sql`
      SELECT 
        e.*,
        l.name as client_name,
        l.email as client_email,
        l.phone as client_phone,
        l.address as client_address
      FROM estimates e
      LEFT JOIN leads l ON l.id = e.lead_id
      WHERE e.id = ${estimateId}
      LIMIT 1
    `;

    if (!estimates || estimates.length === 0) {
      return Response.json({ error: 'Estimate not found' }, { status: 404 });
    }

    const estimate = estimates[0];

    // Don't generate for draft/cancelled estimates
    if (estimate.status === 'cancelled') {
      return Response.json({ error: 'Cannot generate proposal for a cancelled estimate' }, { status: 400 });
    }

    // Build comprehensive task prompt
    const task = `
Please generate a complete professional proposal for this painting estimate.

**Estimate Data:**
- Estimate Number: ${estimate.estimate_number || `ARC-${String(estimateId).padStart(4, '0')}`}
- Date: ${new Date().toISOString().split('T')[0]}
- Status: ${estimate.status}

**Client Information:**
- Name: ${estimate.client_name || estimate.client_name_override || 'Client'}
- Email: ${estimate.client_email || 'Not provided'}
- Phone: ${estimate.client_phone || 'Not provided'}
- Address: ${estimate.client_address || estimate.property_address || 'Not provided'}

**Project Details:**
- Service Type: ${estimate.service_type || 'painting'}
- Description: ${estimate.description || estimate.scope_of_work || 'Not specified'}
- Areas/Rooms: ${estimate.areas_json ? JSON.stringify(JSON.parse(estimate.areas_json), null, 2) : estimate.rooms || 'Not detailed'}
- Paint Brand: ${estimate.paint_brand || 'Benjamin Moore'}
- Paint Colors: ${estimate.paint_colors || 'To be confirmed'}
- Special Requirements: ${estimate.special_requirements || 'None'}

**Pricing:**
- Labor: $${estimate.labor_cost || 0}
- Materials: $${estimate.materials_cost || 0}
- Subtotal: $${estimate.subtotal || estimate.total_before_tax || 0}
- HST (13%): $${estimate.hst_amount || ((estimate.subtotal || 0) * 0.13).toFixed(2)}
- Total: $${estimate.total || estimate.total_amount || 0}

**Timeline:**
- Start Date: ${estimate.start_date || 'To be confirmed'}
- Duration: ${estimate.duration_days ? `${estimate.duration_days} days` : 'To be confirmed'}

Generate the full proposal with HTML document, client email, and internal notes. Return JSON per your instructions.
`.trim();

    // Log the agent run
    const runRecord = await logAgentRun({
      agent_id: 'proposal-generator',
      agent_name: 'Proposal Generator',
      status: 'running',
      input: { estimateId },
      reference_type: 'estimate',
      reference_id: estimateId,
    });

    // Spawn the proposal generator agent
    const agentResult = await spawnAgent({
      task,
      contextFile: CONTEXT_FILE,
      timeoutMs: 90000, // Proposals take longer — up to 90s
    });

    let proposal = null;
    let agentError = null;

    if (agentResult.success) {
      proposal = parseAgentJSON(agentResult.result);
    } else {
      agentError = agentResult.error;
      console.error('Proposal generator agent failed:', agentError);
    }

    // Update run record
    await updateAgentRun(runRecord.id, {
      status: agentResult.success ? 'success' : 'failure',
      output: proposal,
      error: agentError,
    });

    // Update estimate record with proposal status
    let dbUpdated = false;
    if (proposal) {
      try {
        await sql`
          UPDATE estimates
          SET 
            proposal_status = 'generated',
            proposal_content = ${proposal.proposal_html || proposal.proposal_text_summary || null},
            updated_at = NOW()
          WHERE id = ${estimateId}
        `;
        dbUpdated = true;
      } catch (dbErr) {
        console.error('Failed to update estimate with proposal:', dbErr.message);
      }
    }

    // Notify Gerardo that proposal is ready to review/send
    if (proposal) {
      try {
        await notifyGerardo(
          `📋 <b>Proposal Ready!</b>\n\n` +
          `Client: <b>${escapeHtml(estimate.client_name || 'Unknown')}</b>\n` +
          `Estimate #: ${escapeHtml(estimate.estimate_number || String(estimateId))}\n` +
          `Summary: ${escapeHtml(proposal.proposal_text_summary || '')}\n\n` +
          `Review and send from: <a href="https://arcanpainting.ca/admin/estimates">Estimates →</a>`
        );
      } catch (tgErr) {
        console.error('Telegram notify failed:', tgErr.message);
      }
    }

    return Response.json({
      success: true,
      agent_ran: agentResult.success,
      agent_error: agentError,
      proposal: proposal ? {
        html: proposal.proposal_html,
        text_summary: proposal.proposal_text_summary,
        client_email: proposal.client_email,
        internal_notes: proposal.internal_notes,
        proposal_status: proposal.proposal_status || 'generated',
      } : null,
      estimate_id: estimateId,
      db_updated: dbUpdated,
    });

  } catch (error) {
    console.error('Proposal generator route error:', error.message);
    return Response.json(
      { error: 'Failed to generate proposal', details: error.message },
      { status: 500 }
    );
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
