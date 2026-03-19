import sql from "@/app/api/utils/sql";
import { sendEmail } from "@/app/api/utils/send-email";
import { passwordLimiter } from "@/app/api/utils/rate-limit";
import { auditLog } from "@/app/api/utils/audit";
import { validateBody, schemas } from "@/app/api/utils/validate";

function buildBaseUrl(request) {
  try {
    if (process.env.PUBLIC_APP_URL) return process.env.PUBLIC_APP_URL;
  } catch {}
  const proto = request.headers.get("x-forwarded-proto") || "https";
  const host = request.headers.get("host") || "localhost:4000";
  return `${proto}://${host}`;
}

async function ensureTables() {
  await sql`
    CREATE TABLE IF NOT EXISTS auth_users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'owner',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`;
  await sql`
    CREATE TABLE IF NOT EXISTS auth_sessions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES auth_users(id) ON DELETE CASCADE,
      token VARCHAR(255) UNIQUE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      expires_at TIMESTAMP NOT NULL
    )`;
  await sql`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES auth_users(id) ON DELETE CASCADE,
      token VARCHAR(255) UNIQUE NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      used BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`;
}

export async function POST(request) {
  // Rate limiting — tight limit to prevent reset token spam
  const limited = passwordLimiter(request);
  if (limited) return limited;

  try {
    await ensureTables();

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

    const token = `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
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
        subject: "Reset your password",
        text: `Reset your password: ${resetUrl}`,
        html: `<p>You requested a password reset.</p><p><a href="${resetUrl}">Click here to reset your password</a></p><p>This link expires in 1 hour.</p>`,
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
