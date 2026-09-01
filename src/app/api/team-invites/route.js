import sql from "@/app/api/utils/sql";
import { sendEmail } from "@/app/api/utils/send-email";
import { generateSecureToken, getCurrentUser } from "@/app/api/utils/auth";
import { requireCsrf } from "@/app/api/utils/csrf";
import { ensureSchema } from "@/migrations/001-initial-schema";

const INVITABLE_ROLES = new Set(["crew", "office", "estimator", "project_manager", "finance_readonly"]);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function requireOwner(request) {
  const user = await getCurrentUser(request);
  if (!user) return null;
  if (user.role !== "owner") return null;
  return user;
}

function buildBaseUrl(request) {
  const configuredUrl = process.env.PUBLIC_APP_URL || process.env.APP_URL;
  if (configuredUrl) return configuredUrl.replace(/\/$/, "");

  // A production invite is a credential-delivery channel. Refuse to derive
  // its origin from request headers when the canonical public URL is missing.
  if (process.env.NODE_ENV === "production") return null;
  return new URL(request.url).origin;
}

export async function POST(request) {
  try {
    const csrfError = requireCsrf(request);
    if (csrfError) return csrfError;

    const owner = await requireOwner(request);
    if (!owner) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureSchema();

    const body = await request.json();
    const email = (body.email || "").trim().toLowerCase();
    const role = (body.role || "crew").trim();
    if (!EMAIL_PATTERN.test(email)) {
      return Response.json({ error: "A valid email is required" }, { status: 400 });
    }
    if (!INVITABLE_ROLES.has(role)) {
      return Response.json({ error: "Invalid invitation role" }, { status: 400 });
    }

    const computedBaseUrl = buildBaseUrl(request);
    if (!computedBaseUrl) {
      return Response.json({ error: "The public app URL is not configured" }, { status: 503 });
    }

    const token = generateSecureToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // A resend must invalidate every previous unaccepted link for this email.
    // Serialize replacements per normalized address so simultaneous requests
    // cannot both observe no pending invite and create separate usable links.
    await sql.transaction(async (tx) => {
      await tx`SELECT pg_advisory_xact_lock(hashtext(${email}))`;
      await tx`
        UPDATE team_invites
        SET accepted_at = NOW()
        WHERE email = ${email} AND accepted_at IS NULL
      `;
      await tx`
        INSERT INTO team_invites (email, role, token, expires_at, created_by_user_id)
        VALUES (${email}, ${role}, ${token}, ${expiresAt.toISOString()}, ${owner.id})
      `;
    });

    const acceptUrl = `${computedBaseUrl}/account/accept-invite?token=${encodeURIComponent(token)}`;

    // Professional email template (HTML + text)
    const brand = {
      name: "Arcan Painting",
      primary: "#0F172A", // slate-900
      accent: "#0EA5E9", // sky-500
    };
    const subject = `You're invited to ${brand.name} Admin`;
    const text = `You've been invited as ${role} at ${brand.name}.\n\nCreate your account: ${acceptUrl}\n\nThis invite expires in 7 days.`;
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background:#F8FAFC; padding:24px; color:#0F172A;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #E5E7EB;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="background:${brand.primary}; padding:20px 24px; color:#ffffff;">
              <h1 style="margin:0;font-size:20px;">${brand.name}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:24px;">
              <h2 style="margin:0 0 12px 0; font-size:18px; color:${brand.primary};">You're invited to the team</h2>
              <p style="margin:0 0 16px 0; line-height:1.6;">You've been invited to join <strong>${brand.name}</strong> as <strong>${role}</strong>. Click the button below to create your account.</p>
              <p style="margin:0 0 16px 0;">
                <a href="${acceptUrl}" style="display:inline-block; background:${brand.accent}; color:#ffffff; text-decoration:none; padding:12px 18px; border-radius:8px; font-weight:600;">Create your account</a>
              </p>
              <p style="margin:16px 0 0 0; font-size:12px; color:#475569;">If the button doesn't work, copy and paste this link into your browser:<br />
                <a href="${acceptUrl}" style="color:${brand.accent}; word-break:break-all;">${acceptUrl}</a>
              </p>
              <p style="margin:16px 0 0 0; font-size:12px; color:#64748B;">This invite expires in 7 days.</p>
            </td>
          </tr>
          <tr>
            <td style="background:#F1F5F9; padding:16px 24px; font-size:12px; color:#64748B;">
              <p style="margin:0;">You received this because an admin invited you to ${brand.name}.</p>
            </td>
          </tr>
        </table>
      </div>
    `;

    try {
      await sendEmail({ to: email, subject, text, html });
    } catch (err) {
      console.error("Invite email error:", err);
      return Response.json(
        { error: "Invitation was created, but email delivery failed. Check the email configuration before sending another invite." },
        { status: 502 },
      );
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Team invite error:", error);
    return Response.json({ error: "Failed to create invite" }, { status: 500 });
  }
}
