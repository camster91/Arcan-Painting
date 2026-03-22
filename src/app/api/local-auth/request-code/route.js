import sql from "@/app/api/utils/sql";
import { authLimiter } from "@/app/api/utils/rate-limit";
import { auditLog } from "@/app/api/utils/audit";
import { ensureSchema } from "@/migrations/001-initial-schema";

function generateCode() {
  // Cryptographically random 6-digit code
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return String(array[0] % 1000000).padStart(6, "0");
}

async function sendCodeEmail(username, code) {
  const mailgunDomain = process.env.MAILGUN_DOMAIN || "ashbi.ca";
  const mailgunApiKey = process.env.MAILGUN_API_KEY;

  if (!mailgunApiKey) {
    console.warn("[auth] MAILGUN_API_KEY not set — skipping email send");
    return false;
  }

  const body = new URLSearchParams({
    from: `Arcan Painting <noreply@arcanpainting.ca>`,
    to: username,
    subject: "Your Arcan Painting login code",
    text: `Hi,\n\nYour Arcan Painting admin login code is:\n\n${code}\n\nThis code expires in 15 minutes. If you did not request this, you can ignore this email.\n\nArcan Painting\nhttps://arcanpainting.ca`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 24px;">
          <img src="https://arcanpainting.ca/logo.png" alt="Arcan Painting" style="width: 64px; height: 64px; object-fit: contain;" />
        </div>
        <h2 style="color: #1e293b; text-align: center;">Sign in to Arcan Painting</h2>
        <p style="color: #475569; text-align: center;">Click the button below to sign in to your admin dashboard:</p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="https://arcanpainting.ca/api/local-auth/magic-link?token=${code}&email=${encodeURIComponent(username)}"
             style="background: #F59E0B; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">
            Sign in to Arcan Painting &rarr;
          </a>
        </div>
        <p style="color: #94a3b8; font-size: 13px; text-align: center;">Or enter this code manually:</p>
        <div style="background: #f8fafc; border: 2px dashed #e2e8f0; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
          <span style="font-size: 40px; font-weight: bold; letter-spacing: 8px; color: #1e293b; font-family: monospace;">${code}</span>
        </div>
        <p style="color: #94a3b8; font-size: 13px; text-align: center;">Expires in 15 minutes. Do not share this code.</p>
      </div>
    `,
  });

  const response = await fetch(
    `https://api.mailgun.net/v3/${mailgunDomain}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`api:${mailgunApiKey}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    console.error("[auth] Mailgun error:", response.status, text);
    return false;
  }

  return true;
}

export async function POST(request) {
  const limited = authLimiter(request);
  if (limited) return limited;

  try {
    // Use centralized migration — no inline DDL
    await ensureSchema();

    const body = await request.json().catch(() => ({}));
    const username = ((body.username || body.email) ?? "").trim().toLowerCase();

    if (!username) {
      return Response.json({ error: "Email is required" }, { status: 400 });
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username)) {
      return Response.json({ error: "Invalid email address" }, { status: 400 });
    }

    // Check user exists (don't reveal if they don't — just silently succeed)
    const users = await sql`
      SELECT id, username, role FROM auth_users WHERE username = ${username} LIMIT 1
    `;

    // Always respond success-like to prevent user enumeration
    if (users.length === 0) {
      await auditLog({
        request,
        action: "magic_code.request",
        status: "silent_fail",
        changes: { username, reason: "user_not_found" },
      });
      // Return fake success to prevent enumeration
      return Response.json({ code_sent: true, expires_in: 900 });
    }

    // Invalidate any existing unused codes for this user
    await sql`
      UPDATE auth_verification_codes
      SET used_at = NOW()
      WHERE username = ${username} AND used_at IS NULL AND expires_at > NOW()
    `;

    // Generate new code
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min

    await sql`
      INSERT INTO auth_verification_codes (username, code, expires_at)
      VALUES (${username}, ${code}, ${expiresAt.toISOString()})
    `;

    // Send email
    const sent = await sendCodeEmail(username, code);

    await auditLog({
      request,
      action: "magic_code.request",
      status: sent ? "success" : "email_failed",
      changes: { username },
    });

    if (!sent) {
      // Still return success to client but log the failure
      console.error(`[auth] Failed to send code email to ${username}`);
    }

    return Response.json({ code_sent: true, expires_in: 900 });
  } catch (error) {
    console.error("Request code error:", error);
    return Response.json({ error: "Failed to send code" }, { status: 500 });
  }
}
