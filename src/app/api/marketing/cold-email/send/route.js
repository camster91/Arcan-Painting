import { getCurrentUser } from "../../../utils/auth.js";
import sql from "../../../utils/sql.js";

import { sendEmail } from "../../../utils/send-email.js";

// POST - send cold emails (up to 20 per day)
export async function POST(request) {
  // Allow cron OR admin
  const cronSecret = request.headers.get("x-cron-secret");
  if (cronSecret !== process.env.CRON_SECRET) {
    const user = await getCurrentUser(request);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const limit = Math.min(parseInt(body.limit || 20), 20); // max 20/day
  const preview = body.preview || false; // dry run

  // Check how many already sent today
  const todayCount = await sql`
    SELECT COUNT(*)::int as count FROM cold_email_sends
    WHERE sent_at >= CURRENT_DATE AND sent_at < CURRENT_DATE + INTERVAL '1 day'
  `;
  const alreadySentToday = todayCount[0].count;
  const remaining = Math.max(0, limit - alreadySentToday);

  if (remaining === 0) {
    return Response.json({
      message: `Daily limit reached (${alreadySentToday} emails already sent today)`,
      sent: 0,
    });
  }

  // Find prospects to email: new ones (step 1) + follow-ups due
  const toEmail = await sql`
    SELECT p.*, t.subject_template, t.body_template, t.id as template_id, t.sequence_step
    FROM cold_email_prospects p
    JOIN cold_email_templates t
      ON t.target_role = p.role
      AND t.sequence_step = p.sequence_step + 1
      AND t.is_active = true
    WHERE p.status IN ('new', 'emailed')
      AND p.email IS NOT NULL
      AND (p.last_emailed_at IS NULL OR p.last_emailed_at < NOW() - INTERVAL '4 days')
      AND p.status NOT IN ('unsubscribed', 'bounced', 'converted')
    ORDER BY p.created_at ASC
    LIMIT ${remaining}
  `;

  if (preview) {
    return Response.json({
      preview: true,
      would_send: toEmail.length,
      already_sent_today: alreadySentToday,
      prospects: toEmail.map((p) => ({
        name: p.name,
        email: p.email,
        role: p.role,
        step: p.sequence_step + 1,
      })),
    });
  }

  const fromEmail = "Gerardo <info@arcanpainting.ca>";

  let sent = 0;
  let failed = 0;
  const results = [];

  for (const prospect of toEmail) {
    try {
      // Personalize the email
      const firstName = prospect.name?.split(" ")[0] || "there";
      const cityName = prospect.city || "Toronto";
      const companyName = prospect.company || "";

      const subject = (prospect.subject_template || "")
        .replace(/\{\{name\}\}/g, firstName)
        .replace(/\{\{city\}\}/g, cityName)
        .replace(/\{\{company\}\}/g, companyName);

      const emailBody = (prospect.body_template || "")
        .replace(/\{\{name\}\}/g, firstName)
        .replace(/\{\{city\}\}/g, cityName)
        .replace(/\{\{company\}\}/g, companyName);

      // Send via Mailgun
      const emailResult = await sendEmail({
        to: prospect.email,
        from: fromEmail,
        subject: subject,
        text: emailBody,
        relatedType: "cold_email_prospect",
        relatedId: prospect.id,
        metadata: {
          prospect_id: prospect.id,
          sequence_step: prospect.sequence_step + 1,
          template_id: prospect.template_id,
        },
      });

      if (emailResult.id) {
        const nextStep = prospect.sequence_step + 1;

        // Update prospect
        await sql`
          UPDATE cold_email_prospects
          SET status = 'emailed', sequence_step = ${nextStep}, last_emailed_at = NOW(), updated_at = NOW()
          WHERE id = ${prospect.id}
        `;

        // Log the send specifically for the outreach tracker
        await sql`
          INSERT INTO cold_email_sends (prospect_id, sequence_step, subject, body, mailgun_id, status)
          VALUES (${prospect.id}, ${nextStep}, ${subject}, ${emailBody}, ${emailResult.id}, 'sent')
        `;

        sent++;
        results.push({ email: prospect.email, name: prospect.name, status: "sent" });
      } else {
        failed++;
        results.push({
          email: prospect.email,
          name: prospect.name,
          status: "failed",
          error: "Unknown Mailgun error",
        });
      }

      // Rate delay between sends
      if (toEmail.indexOf(prospect) < toEmail.length - 1) {
        await new Promise((r) => setTimeout(r, 500));
      }
    } catch (err) {
      failed++;
      results.push({ email: prospect.email, name: prospect.name, status: "error", error: err.message });
    }
  }

  return Response.json({
    sent,
    failed,
    already_sent_today: alreadySentToday,
    total_today: alreadySentToday + sent,
    results,
  });
}

// GET - view send history/stats
export async function GET(request) {
  const user = await getCurrentUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const days = parseInt(url.searchParams.get("days") || "30");

  const sends = await sql`
    SELECT s.*, p.name as prospect_name, p.email as prospect_email, p.role, p.city
    FROM cold_email_sends s
    JOIN cold_email_prospects p ON p.id = s.prospect_id
    WHERE s.sent_at >= NOW() - make_interval(days => ${days})
    ORDER BY s.sent_at DESC
    LIMIT 200
  `;

  const dailyStats = await sql`
    SELECT
      DATE(sent_at) as date,
      COUNT(*)::int as total,
      COUNT(*) FILTER (WHERE status = 'sent')::int as sent,
      COUNT(*) FILTER (WHERE status = 'delivered')::int as delivered,
      COUNT(*) FILTER (WHERE status = 'opened')::int as opened,
      COUNT(*) FILTER (WHERE status = 'bounced')::int as bounced
    FROM cold_email_sends
    WHERE sent_at >= NOW() - make_interval(days => ${days})
    GROUP BY DATE(sent_at)
    ORDER BY date DESC
  `;

  return Response.json({ sends, dailyStats });
}
