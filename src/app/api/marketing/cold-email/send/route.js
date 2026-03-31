import { getCurrentUser } from "../../../utils/auth.js";
import sql from "../../../utils/sql.js";

async function getGoogleAccessToken() {
  const rows = await sql(
    `SELECT access_token, refresh_token, token_expiry, account_email FROM marketing_connections WHERE platform = 'google' AND is_active = true LIMIT 1`
  );
  if (!rows.length) return { token: null, email: null };

  const { access_token, refresh_token, token_expiry, account_email } = rows[0];

  // If token is still valid (with 5min buffer), use it
  if (token_expiry && new Date(token_expiry) > new Date(Date.now() + 5 * 60 * 1000)) {
    return { token: access_token, email: account_email };
  }

  // Token expired — refresh it
  if (!refresh_token) return { token: null, email: account_email };

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return { token: null, email: account_email };

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) return { token: null, email: account_email };

  const tokens = await res.json();
  const newExpiry = tokens.expires_in
    ? new Date(Date.now() + tokens.expires_in * 1000)
    : null;

  // Update stored token
  await sql(
    `UPDATE marketing_connections SET access_token = $1, token_expiry = $2, updated_at = CURRENT_TIMESTAMP WHERE platform = 'google'`,
    [tokens.access_token, newExpiry]
  );

  return { token: tokens.access_token, email: account_email };
}

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

  // Check for valid Google OAuth token
  const { token: accessToken, email: connectedEmail } = await getGoogleAccessToken();
  if (!accessToken) {
    return Response.json(
      { error: "Connect your Google account first to send cold emails", code: "NOT_CONNECTED" },
      { status: 501 }
    );
  }

  const fromEmail = connectedEmail || "info@arcanpainting.ca";
  const fromName = "Gerardo | Arcan Painting";

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

      // Build RFC 2822 raw email
      const rawEmail = [
        `From: ${fromName} <${fromEmail}>`,
        `To: ${prospect.email}`,
        `Subject: ${subject}`,
        `Content-Type: text/plain; charset=utf-8`,
        `List-Unsubscribe: <mailto:${fromEmail}?subject=unsubscribe>`,
        ``,
        emailBody,
      ].join("\r\n");

      // Base64url encode
      const encoded = btoa(unescape(encodeURIComponent(rawEmail)))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

      // Send via Gmail API
      const gmailRes = await fetch(
        "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ raw: encoded }),
        }
      );

      const gmailData = await gmailRes.json();

      if (gmailRes.ok) {
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
          VALUES (${prospect.id}, ${nextStep}, ${subject}, ${emailBody}, ${gmailData.id}, 'sent')
        `;

        sent++;
        results.push({ email: prospect.email, name: prospect.name, status: "sent" });
      } else {
        failed++;

        // Google account not connected or token expired
        if (gmailRes.status === 401 || gmailRes.status === 403) {
          results.push({
            email: prospect.email,
            name: prospect.name,
            status: "failed",
            error: "Google account not connected. Connect Google in Marketing settings.",
          });
          break; // No point trying more if auth is broken
        }

        // Mark bounced if invalid email
        const errMsg = gmailData.error?.message || "";
        if (errMsg.includes("bounce") || errMsg.includes("invalid") || errMsg.includes("notFound")) {
          await sql`
            UPDATE cold_email_prospects SET status = 'bounced', updated_at = NOW() WHERE id = ${prospect.id}
          `;
        }
        results.push({ email: prospect.email, name: prospect.name, status: "failed", error: errMsg });
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
