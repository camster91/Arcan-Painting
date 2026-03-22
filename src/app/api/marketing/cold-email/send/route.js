import { getCurrentUser } from "../../../utils/auth.js";
import sql from "../../../utils/sql.js";

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

  const mailgunKey = process.env.MAILGUN_API_KEY;
  const mailgunDomain = process.env.MAILGUN_DOMAIN || "ashbi.ca";
  const fromEmail = process.env.COLD_EMAIL_FROM || "gerardo@arcanpainting.ca";
  const fromName = "Gerardo | Arcan Painting";

  if (!mailgunKey) {
    return Response.json({ error: "Mailgun not configured" }, { status: 501 });
  }

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
      const formData = new FormData();
      formData.append("from", `${fromName} <${fromEmail}>`);
      formData.append("to", prospect.email);
      formData.append("subject", subject);
      formData.append("text", emailBody);
      formData.append("o:tag", "cold-outreach");
      formData.append("o:tracking-opens", "yes");
      formData.append("o:tracking-clicks", "yes");
      formData.append("h:List-Unsubscribe", `<mailto:${fromEmail}?subject=unsubscribe>`);

      const mgRes = await fetch(
        `https://api.mailgun.net/v3/${mailgunDomain}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${btoa("api:" + mailgunKey)}`,
          },
          body: formData,
        }
      );

      const mgData = await mgRes.json();

      if (mgRes.ok) {
        const nextStep = prospect.sequence_step + 1;

        // Update prospect
        await sql`
          UPDATE cold_email_prospects
          SET status = 'emailed', sequence_step = ${nextStep}, last_emailed_at = NOW(), updated_at = NOW()
          WHERE id = ${prospect.id}
        `;

        // Log the send
        await sql`
          INSERT INTO cold_email_sends (prospect_id, sequence_step, subject, body, mailgun_id, status)
          VALUES (${prospect.id}, ${nextStep}, ${subject}, ${emailBody}, ${mgData.id}, 'sent')
        `;

        sent++;
        results.push({ email: prospect.email, name: prospect.name, status: "sent" });
      } else {
        failed++;
        // Mark bounced if invalid email
        if (mgData.message?.includes("bounce") || mgData.message?.includes("invalid")) {
          await sql`
            UPDATE cold_email_prospects SET status = 'bounced', updated_at = NOW() WHERE id = ${prospect.id}
          `;
        }
        results.push({ email: prospect.email, name: prospect.name, status: "failed", error: mgData.message });
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
