import sql from "@/app/api/utils/sql";
import { sendEmail } from "@/app/api/utils/send-email";
import { passwordLimiter } from "@/app/api/utils/rate-limit";
import { auditLog } from "@/app/api/utils/audit";
import { validateBody, schemas } from "@/app/api/utils/validate";
import { generateSecureToken } from "@/app/api/utils/auth";
import { ensureSchema } from "@/migrations/001-initial-schema";

function buildBaseUrl(request) {
  try {
    if (process.env.PUBLIC_APP_URL) return process.env.PUBLIC_APP_URL;
  } catch {}
  const proto = request.headers.get("x-forwarded-proto") || "https";
  const host = request.headers.get("host") || "localhost:4000";
  return `${proto}://${host}`;
}

export async function POST(request) {
  // Rate limiting — tight limit to prevent reset token spam
  const limited = passwordLimiter(request);
  if (limited) return limited;

  try {
    await ensureSchema();

    const [body, validationError] = await validateBody(request, schemas.passwordResetRequest);
    if (validationError) return validationError;

    const identifier = (
      body.emailOrUsername ||
      body.email ||
      body.username ||
      ""
    ).trim();

    if (!identifier) {
      return Response.json({ error: "Email is required" }, { status: 400 });
    }

    const users = await sql`SELECT id, username FROM auth_users WHERE username = ${identifier}`;
    const user = users[0];

    // Always respond success to prevent user enumeration
    const genericResponse = Response.json({ success: true });

    if (!user) {
      return genericResponse;
    }

    // Cryptographically secure reset token
    const token = generateSecureToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await sql`
      INSERT INTO password_reset_tokens (user_id, token, expires_at)
      VALUES (${user.id}, ${token}, ${expiresAt.toISOString()})
    `;

    await auditLog({
      request,
      action: "password.reset.request",
      userId: user.id,
      username: user.username,
      status: "success",
    });

    const baseUrl = buildBaseUrl(request);
    const resetUrl = `${baseUrl}/account/reset-password?token=${encodeURIComponent(token)}`;

    try {
      await sendEmail({
        to: user.username,
        from: "Arcan Painting <noreply@arcanpainting.ca>",
        subject: "Reset your Arcan Painting password",
        text: `Reset your Arcan Painting password: ${resetUrl}\n\nThis link expires in 1 hour.\n\nIf you did not request this, you can ignore this email.`,
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <div style="text-align: center; margin-bottom: 24px;">
              <img src="https://arcanpainting.ca/logo.png" alt="Arcan Painting" style="width: 64px; height: 64px; object-fit: contain;" />
            </div>
            <h2 style="color: #1e293b; text-align: center;">Reset your password</h2>
            <p style="color: #475569; text-align: center;">You requested a password reset for your Arcan Painting admin account.</p>
            <div style="text-align: center; margin: 24px 0;">
              <a href="${resetUrl}" style="display: inline-block; background: #1e293b; color: #fff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">Reset Password</a>
            </div>
            <p style="color: #94a3b8; font-size: 13px; text-align: center;">This link expires in 1 hour. If you did not request this, you can ignore this email.</p>
          </div>
        `,
      });
    } catch (err) {
      console.error("Email send error:", err);
    }

    return genericResponse;
  } catch (error) {
    console.error("Password reset request error:", error);
    return Response.json({ error: "Failed to request password reset" }, { status: 500 });
  }
}
