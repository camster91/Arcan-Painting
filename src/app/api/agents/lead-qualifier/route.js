/**
 * POST /api/agents/lead-qualifier
 * 
 * Triggered when a new lead is saved (from /api/contact or /api/leads).
 * Spawns the arcan-lead-qualifier agent to score and analyze the lead.
 * Updates the lead record with qualification_score and estimated_value.
 * 
 * Body: { leadId, name, email, phone, serviceType, projectDescription, address, preferredContact }
 */

import sql from '../../utils/sql.js';
import { spawnAgent, parseAgentJSON } from '../openclaw.js';
import { notifyGerardo } from '../../utils/telegram.js';
import { logAgentRun, updateAgentRun } from '../store.js';

const CONTEXT_FILE = 'agents/arcan-lead-qualifier.md';

export async function POST(request) {
  try {
    const body = await request.json();
    const { leadId, name, email, phone, serviceType, projectDescription, address, preferredContact } = body;

    if (!name || !serviceType) {
      return Response.json({ error: 'name and serviceType are required' }, { status: 400 });
    }

    // Build the task prompt for the agent
    const task = `
Please qualify this new lead for Arcan Painting.

**Lead Details:**
- Name: ${name}
- Email: ${email || 'Not provided'}
- Phone: ${phone || 'Not provided'}
- Service Type: ${serviceType}
- Project Description: ${projectDescription || 'No description provided'}
- Address: ${address || 'Not provided'}
- Preferred Contact: ${preferredContact || 'Not specified'}
- Lead ID: ${leadId || 'Not yet saved'}

Analyze this lead and return a JSON qualification report per your instructions.
`.trim();

    // Log the agent run
    const runRecord = await logAgentRun({
      agent_id: 'lead-qualifier',
      agent_name: 'Lead Qualifier',
      status: 'running',
      input: { leadId, name, email, phone, serviceType, projectDescription, address, preferredContact },
      reference_type: 'lead',
      reference_id: leadId || null,
    });

    // Spawn the qualification agent
    const agentResult = await spawnAgent({
      task,
      contextFile: CONTEXT_FILE,
      timeoutMs: 45000,
    });

    let qualification = null;
    let agentError = null;

    if (agentResult.success) {
      qualification = parseAgentJSON(agentResult.result);
    } else {
      agentError = agentResult.error;
      console.error('Lead qualifier agent failed:', agentError);
    }

    // Update run record
    await updateAgentRun(runRecord.id, {
      status: agentResult.success ? 'success' : 'failure',
      output: qualification ? { qualification } : null,
      error: agentError,
    });

    // Update lead in DB if we have an ID and a score
    let dbUpdated = false;
    if (leadId && qualification) {
      try {
        await sql`
          UPDATE leads 
          SET 
            qualification_score = ${qualification.qualification_score || null},
            estimated_value = ${qualification.estimated_value_high || null},
            notes = ${qualification.notes || null},
            updated_at = NOW()
          WHERE id = ${leadId}
        `;
        dbUpdated = true;
      } catch (dbErr) {
        console.error('Failed to update lead with qualification:', dbErr.message);
        // Non-fatal — return result anyway
      }
    }

    // Notify Gerardo via Telegram if high-priority lead
    if (qualification && qualification.qualification_score >= 61) {
      try {
        const priority = qualification.qualification_score >= 81 ? '🔥 HOT' : '⚡ HIGH PRIORITY';
        await notifyGerardo(
          `${priority} Lead Qualified!\n\n` +
          `👤 <b>${escapeHtml(name)}</b>\n` +
          `🎨 Service: ${escapeHtml(serviceType)}\n` +
          `📍 ${escapeHtml(address || 'Address not provided')}\n` +
          `📊 Score: ${qualification.qualification_score}/100\n` +
          `💰 Est. Value: $${qualification.estimated_value_low?.toLocaleString()} – $${qualification.estimated_value_high?.toLocaleString()}\n` +
          `✅ Next: ${escapeHtml(qualification.recommended_action || 'Follow up')}\n\n` +
          `<a href="https://arcanpainting.ca/admin/leads">View in CRM →</a>`
        );
      } catch (tgErr) {
        console.error('Telegram notify failed:', tgErr.message);
      }
    }

    return Response.json({
      success: true,
      agent_ran: agentResult.success,
      agent_error: agentError,
      qualification,
      db_updated: dbUpdated,
      lead_id: leadId,
    });

  } catch (error) {
    console.error('Lead qualifier route error:', error.message);
    return Response.json(
      { error: 'Failed to run lead qualifier', details: error.message },
      { status: 500 }
    );
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
