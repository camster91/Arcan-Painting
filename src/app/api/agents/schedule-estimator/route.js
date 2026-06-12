/**
 * POST /api/agents/schedule-estimator
 * 
 * Triggered from the admin Leads dashboard "Schedule Estimate" button.
 * Spawns the arcan-estimator-scheduler agent to prepare a visit briefing
 * and suggest appointment slots.
 * 
 * Body: { leadId }
 * Returns: { suggested_slots, pre_visit_card, confirmation_message, estimate_checklist }
 */

import sql from '../../utils/sql.js';
import { spawnAgent, parseAgentJSON } from '../openclaw.js';
import { requireAdmin } from '../../utils/auth.js';
import { requireCsrf } from '../../utils/csrf.js';
import { logAgentRun, updateAgentRun } from '../store.js';

const CONTEXT_FILE = 'agents/arcan-estimator-scheduler.md';

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
    const { leadId } = body;

    if (!leadId) {
      return Response.json({ error: 'leadId is required' }, { status: 400 });
    }

    // Fetch lead from DB
    const leads = await sql`SELECT * FROM leads WHERE id = ${leadId} LIMIT 1`;
    if (!leads || leads.length === 0) {
      return Response.json({ error: 'Lead not found' }, { status: 404 });
    }
    const lead = leads[0];

    // Fetch upcoming appointments for conflict checking
    const upcomingAppointments = await sql`
      SELECT appointment_date, start_time, end_time, title, address
      FROM appointments
      WHERE appointment_date >= CURRENT_DATE
      ORDER BY appointment_date ASC, start_time ASC
      LIMIT 20
    `;

    // Format appointments for the agent
    const appointmentsList = upcomingAppointments.length > 0
      ? upcomingAppointments.map(a =>
          `- ${a.appointment_date} at ${a.start_time}–${a.end_time}: ${a.title || 'Appointment'} @ ${a.address || 'TBD'}`
        ).join('\n')
      : 'No upcoming appointments — schedule is open.';

    // Build the task prompt
    const task = `
Please prepare an estimate scheduling package for this lead.

**Lead Information:**
- Name: ${lead.name}
- Phone: ${lead.phone || 'Not provided'}
- Email: ${lead.email || 'Not provided'}
- Address: ${lead.address || 'Address not confirmed'}
- Service Type: ${lead.service_type}
- Project Description: ${lead.project_description || 'No details provided'}
- Preferred Contact: ${lead.preferred_contact || 'Not specified'}
- Lead Status: ${lead.status}
- Notes: ${lead.notes || 'None'}

**Gerardo's Existing Appointments:**
${appointmentsList}

Today's date: ${new Date().toISOString().split('T')[0]}

Please:
1. Write a 1-paragraph lead summary
2. Suggest 3 appointment slots (avoiding the existing appointments listed)
3. Create an in-person estimate checklist tailored to "${lead.service_type}"
4. Write a pre-visit briefing card
5. Draft both SMS and email confirmation messages

Return the full JSON response per your instructions.
`.trim();

    // Log the agent run
    const runRecord = await logAgentRun({
      agent_id: 'schedule-estimator',
      agent_name: 'Schedule Estimator',
      status: 'running',
      input: { leadId },
      reference_type: 'lead',
      reference_id: leadId,
    });

    // Spawn the scheduler agent
    const agentResult = await spawnAgent({
      task,
      contextFile: CONTEXT_FILE,
      timeoutMs: 60000,
    });

    let schedule = null;
    let agentError = null;

    if (agentResult.success) {
      schedule = parseAgentJSON(agentResult.result);
    } else {
      agentError = agentResult.error;
      console.error('Estimator scheduler agent failed:', agentError);
    }

    // Update run record
    await updateAgentRun(runRecord.id, {
      status: agentResult.success ? 'success' : 'failure',
      output: schedule,
      error: agentError,
    });

    // Update lead status to estimate_scheduled if we got results
    let dbUpdated = false;
    if (schedule && schedule.suggested_slots) {
      try {
        await sql`
          UPDATE leads
          SET status = 'estimate_scheduled', updated_at = NOW()
          WHERE id = ${leadId} AND status NOT IN ('won', 'lost')
        `;
        dbUpdated = true;
      } catch (dbErr) {
        console.error('Failed to update lead status:', dbErr.message);
      }
    }

    return Response.json({
      success: true,
      agent_ran: agentResult.success,
      agent_error: agentError,
      schedule,
      lead: {
        id: lead.id,
        name: lead.name,
        phone: lead.phone,
        email: lead.email,
        address: lead.address,
        service_type: lead.service_type,
      },
      db_updated: dbUpdated,
    });

  } catch (error) {
    console.error('Schedule estimator route error:', error.message);
    return Response.json(
      { error: 'Failed to run estimator scheduler', details: error.message },
      { status: 500 }
    );
  }
}
