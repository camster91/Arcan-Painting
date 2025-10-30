import sql from "./sql.js";

export async function sendEmail({
  to,
  from,
  subject,
  html,
  text,
  templateName,
  relatedType,
  relatedId,
  userId,
  metadata = {},
}) {
  // Use either RESEND_API_KEY (old name) or RESEND (new secret name)
  const apiKey = process.env.RESEND_API_KEY || process.env.RESEND;

  if (!apiKey) {
    throw new Error(
      "Resend API key is not configured. Please set RESEND (preferred) or RESEND_API_KEY in your project secrets.",
    );
  }

  // Use Arcan Painting's domain email
  const defaultFrom = "info@arcanpainting.ca";

  const finalFrom = from || defaultFrom;
  const toArray = Array.isArray(to) ? to : [to];
  const finalTo = toArray[0]; // For logging, use first recipient

  let status = "failed";
  let resendId = null;
  let errorMessage = null;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: finalFrom,
        to: toArray,
        subject,
        html,
        text,
      }),
    });

    let data = null;
    try {
      data = await response.json();
    } catch (e) {
      // no-op: some error responses may not be JSON
    }

    if (!response.ok) {
      errorMessage =
        data?.message ||
        `Failed to send email [${response.status}] ${response.statusText}`;
      throw new Error(errorMessage);
    }

    status = "sent";
    resendId = data?.id;

    // Log successful email
    try {
      await sql`
        INSERT INTO email_logs (
          to_email, from_email, subject, template_name, status, resend_id, 
          related_type, related_id, user_id, metadata, sent_at
        ) VALUES (
          ${finalTo}, ${finalFrom}, ${subject}, ${templateName}, ${status}, 
          ${resendId}, ${relatedType}, ${relatedId}, ${userId}, ${JSON.stringify(metadata)}, 
          CURRENT_TIMESTAMP
        )
      `;
    } catch (logError) {
      console.error("Failed to log email send:", logError);
      // Don't fail the email send if logging fails
    }

    return { id: resendId };
  } catch (error) {
    errorMessage = error.message;

    // Log failed email
    try {
      await sql`
        INSERT INTO email_logs (
          to_email, from_email, subject, template_name, status, error_message,
          related_type, related_id, user_id, metadata, sent_at
        ) VALUES (
          ${finalTo}, ${finalFrom}, ${subject}, ${templateName}, ${status}, ${errorMessage},
          ${relatedType}, ${relatedId}, ${userId}, ${JSON.stringify(metadata)}, 
          CURRENT_TIMESTAMP
        )
      `;
    } catch (logError) {
      console.error("Failed to log email error:", logError);
    }

    throw error;
  }
}

// Helper function to send emails using templates
export async function sendTemplatedEmail(
  templateName,
  variables,
  recipientEmail,
  options = {},
) {
  try {
    // Get template from database
    const template = await sql`
      SELECT * FROM email_templates 
      WHERE name = ${templateName} AND is_active = true
    `;

    if (template.length === 0) {
      throw new Error(`Email template '${templateName}' not found or inactive`);
    }

    const tmpl = template[0];

    // Simple variable replacement ({{variable}} format)
    let subject = tmpl.subject_template;
    let html = tmpl.html_template;
    let text = tmpl.text_template;

    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, "g");
      subject = subject.replace(regex, value || "");
      html = html.replace(regex, value || "");
      if (text) text = text.replace(regex, value || "");
    }

    // Send email with template name for logging
    return await sendEmail({
      to: recipientEmail,
      subject,
      html,
      text,
      templateName,
      ...options,
    });
  } catch (error) {
    console.error(`Failed to send templated email '${templateName}':`, error);
    throw error;
  }
}
