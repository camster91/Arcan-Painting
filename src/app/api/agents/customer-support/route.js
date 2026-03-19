/**
 * POST /api/agents/customer-support
 * 
 * Triggered when a new message/notification comes in.
 * Spawns the arcan-customer-support agent to categorize and draft a response.
 * Updates the message/notification record with AI category and suggested response.
 * 
 * Body: { messageId?, messageText, senderName?, senderEmail?, senderPhone?, source? }
 * Returns: { category, urgency, suggested_response, action_items, should_auto_send }
 */

import sql from '../../utils/sql.js';
import { spawnAgent, parseAgentJSON } from '../openclaw.js';
import { notifyGerardo } from '../../utils/telegram.js';

const CONTEXT_FILE = 'agents/arcan-customer-support.md';

export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      messageId,
      messageText, 
      senderName, 
      senderEmail, 
      senderPhone,
      source = 'website', // website | chat | email | phone
    } = body;

    if (!messageText || messageText.trim() === '') {
      return Response.json({ error: 'messageText is required' }, { status: 400 });
    }

    // Build the task prompt
    const task = `
Please triage this incoming customer message for Arcan and Sons Painting.

**Message Details:**
- Source: ${source}
- Sender Name: ${senderName || 'Unknown'}
- Sender Email: ${senderEmail || 'Not provided'}
- Sender Phone: ${senderPhone || 'Not provided'}
- Message: "${messageText.trim()}"
- Received: ${new Date().toLocaleString('en-CA', { timeZone: 'America/Toronto' })}

Analyze the message, categorize it, assess urgency, and draft a response for Gerardo to review. Return the full JSON response per your instructions.
`.trim();

    // Spawn the customer support agent
    const agentResult = await spawnAgent({
      task,
      contextFile: CONTEXT_FILE,
      timeoutMs: 30000,
    });

    let analysis = null;
    let agentError = null;

    if (agentResult.success) {
      analysis = parseAgentJSON(agentResult.result);
    } else {
      agentError = agentResult.error;
      console.error('Customer support agent failed:', agentError);
    }

    // Update notification/message record in DB
    let dbUpdated = false;
    if (messageId && analysis) {
      try {
        // Try notifications table first (messages page uses this)
        await sql`
          UPDATE notifications
          SET 
            ai_category = ${analysis.category || null},
            ai_response = ${analysis.suggested_response || null},
            updated_at = NOW()
          WHERE id = ${messageId}
        `;
        dbUpdated = true;
      } catch (dbErr) {
        console.error('Failed to update message with AI analysis:', dbErr.message);
        // Non-fatal
      }
    }

    // Alert Gerardo for critical/urgent messages
    if (analysis && (analysis.urgency === 'critical' || analysis.urgency === 'high')) {
      try {
        const urgencyEmoji = analysis.urgency === 'critical' ? '🚨' : '⚡';
        await notifyGerardo(
          `${urgencyEmoji} <b>${analysis.urgency.toUpperCase()} Message</b>\n\n` +
          `Category: ${escapeHtml(analysis.category || 'Unknown')}\n` +
          `From: ${escapeHtml(senderName || 'Unknown')} (${escapeHtml(senderEmail || senderPhone || 'no contact')})\n\n` +
          `"${escapeHtml(messageText.substring(0, 200))}${messageText.length > 200 ? '...' : ''}"\n\n` +
          `📝 Suggested reply ready in CRM.\n` +
          `<a href="https://arcanpainting.ca/admin/messages">View Messages →</a>`
        );
      } catch (tgErr) {
        console.error('Telegram notify failed:', tgErr.message);
      }
    }

    return Response.json({
      success: true,
      agent_ran: agentResult.success,
      agent_error: agentError,
      analysis,
      db_updated: dbUpdated,
      message_id: messageId,
    });

  } catch (error) {
    console.error('Customer support route error:', error.message);
    return Response.json(
      { error: 'Failed to run customer support agent', details: error.message },
      { status: 500 }
    );
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
