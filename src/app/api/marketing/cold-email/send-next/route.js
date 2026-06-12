import { getCurrentUser } from "../../../utils/auth.js";
import sql from "../../../utils/sql.js";
import { sendEmail } from "../../../utils/send-email.js";
import { requireCsrf } from "../../../utils/csrf.js";

// POST - send next email in sequence for a specific prospect
// Looks up the prospect + the next active template for the prospect's role,
// sends via the same Maton/Gmail pipeline as the rest of the app, records
// the send in `cold_email_sends`, and advances the prospect's sequence_step.
export async function POST(request) {
  const csrfError = requireCsrf(request);
  if (csrfError) return csrfError;

  const user = await getCurrentUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { prospectId } = body;

  if (!prospectId) {
    return Response.json({ error: "prospectId required" }, { status: 400 });
  }

  // Fetch the prospect + the next template in the sequence for their role.
  const prospects = await sql`
    SELECT p.id, p.name, p.email, p.company, p.city, p.role,
           p.sequence_step, p.status, p.notes,
           t.id as template_id, t.subject_template, t.body_template,
           t.sequence_step as template_step
    FROM cold_email_prospects p
    JOIN cold_email_templates t
      ON t.target_role = p.role
     AND t.sequence_step = p.sequence_step + 1
     AND t.is_active = true
    WHERE p.id = ${prospectId}
      AND p.status IN ('new', 'emailed')
      AND p.email IS NOT NULL
  `;

  const prospect = prospects[0];

  if (!prospect) {
    return Response.json({
      message: "No eligible template for this prospect's role/step",
      prospect_id: prospectId,
      action: "skipped",
    });
  }

  // Render the template with the prospect's data.
  const replacements = {
    name: prospect.name,
    company: prospect.company || "",
    city: prospect.city || "",
    role: prospect.role || "",
  };
  function render(tpl) {
    if (!tpl) return "";
    return Object.entries(replacements).reduce(
      (acc, [k, v]) => acc.split(`{{${k}}}`).join(v || ""),
      tpl,
    );
  }
  const subject = render(prospect.subject_template);
  const html = render(prospect.body_template);
  const nextStep = prospect.sequence_step + 1;

  // Record the send attempt *before* sending so we can track failures.
  const [sendRecord] = await sql`
    INSERT INTO cold_email_sends (
      prospect_id, template_id, sequence_step, subject, status, sent_at
    ) VALUES (
      ${prospect.id}, ${prospect.template_id}, ${nextStep}, ${subject},
      'sending', CURRENT_TIMESTAMP
    )
    RETURNING id
  `;

  try {
    await sendEmail({
      to: prospect.email,
      subject,
      html,
      templateName: `cold_email_step_${nextStep}`,
      relatedType: "cold_email_prospect",
      relatedId: prospect.id,
      userId: user.id,
    });

    await sql`
      UPDATE cold_email_sends
      SET status = 'sent'
      WHERE id = ${sendRecord.id}
    `;
    await sql`
      UPDATE cold_email_prospects
      SET sequence_step = ${nextStep},
          status = CASE WHEN status = 'new' THEN 'emailed' ELSE status END,
          last_emailed_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${prospect.id}
    `;

    return Response.json({
      success: true,
      message: `Sent step ${nextStep} to ${prospect.email}`,
      prospect_id: prospect.id,
      template_id: prospect.template_id,
      send_id: sendRecord.id,
    });
  } catch (err) {
    await sql`
      UPDATE cold_email_sends
      SET status = 'failed', error_message = ${err.message}
      WHERE id = ${sendRecord.id}
    `;
    return Response.json(
      {
        error: `Send failed: ${err.message}`,
        send_id: sendRecord.id,
        prospect_id: prospect.id,
      },
      { status: 500 },
    );
  }
}
