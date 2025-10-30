import sql from "@/app/api/utils/sql";
import { sendEmail } from "@/app/api/utils/send-email";

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(";").forEach((pair) => {
    const [k, v] = pair.split("=");
    if (!k) return;
    cookies[k.trim()] = decodeURIComponent((v || "").trim());
  });
  return cookies;
}

// UPDATED: allow owner auth via either legacy admin_session cookie OR Authorization: Bearer <token>
async function requireOwner(request) {
  // First, try Authorization header (matches other admin APIs like /api/team-members)
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    const bearer = authHeader.slice(7);
    const sessions =
      await sql`SELECT * FROM auth_sessions WHERE token = ${bearer} AND expires_at > NOW()`;
    if (sessions.length) {
      const users =
        await sql`SELECT id, username, role FROM auth_users WHERE id = ${sessions[0].user_id} LIMIT 1`;
      if (users.length && users[0].role === "owner") {
        return users[0];
      }
      return null;
    }
  }

  // Fallback: legacy cookie-based admin session
  const cookieHeader = request.headers.get("cookie");
  const cookies = parseCookies(cookieHeader);
  const token = cookies["admin_session"];
  if (!token) return null;

  const rows = await sql`
    SELECT u.id, u.username, u.role, s.expires_at
    FROM auth_sessions s
    JOIN auth_users u ON u.id = s.user_id
    WHERE s.token = ${token}
    LIMIT 1
  `;
  const user = rows[0];
  if (!user) return null;
  const nowIso = new Date().toISOString();
  if (user.expires_at && user.expires_at < nowIso) {
    await sql`DELETE FROM auth_sessions WHERE token = ${token}`;
    return null;
  }
  if (user.role !== "owner") return null;
  return user;
}

function buildBaseUrl(request) {
  // Prefer configured public URLs first
  try {
    if (process.env.PUBLIC_APP_URL) return process.env.PUBLIC_APP_URL;
    if (process.env.APP_URL) return process.env.APP_URL;
  } catch {}
  // Respect proxy headers commonly set by hosting providers
  const xfProto = request.headers.get("x-forwarded-proto");
  const xfHost = request.headers.get("x-forwarded-host");
  const host = xfHost || request.headers.get("host") || "localhost:4000";
  const proto = xfProto || (host.includes("localhost") ? "http" : "https");
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
    CREATE TABLE IF NOT EXISTS team_members (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      phone VARCHAR(50),
      role VARCHAR(50) NOT NULL DEFAULT 'painter',
      hire_date DATE,
      hourly_rate NUMERIC(8,2),
      status VARCHAR(50) DEFAULT 'active',
      specialties TEXT,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`;
  await sql`
    CREATE TABLE IF NOT EXISTS team_invites (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'painter',
      token VARCHAR(255) UNIQUE NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      accepted_at TIMESTAMP,
      created_by_user_id INTEGER REFERENCES auth_users(id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`;
  await sql`CREATE INDEX IF NOT EXISTS idx_team_invites_email ON team_invites(email)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_team_invites_token ON team_invites(token)`;
  // Ensure admin seeded and owner
  await sql`
    INSERT INTO auth_users (username, password, role)
    VALUES ('admin', 'admin', 'owner')
    ON CONFLICT (username) DO NOTHING`;
  await sql`UPDATE auth_users SET role = 'owner' WHERE username = 'admin' AND role <> 'owner'`;
}

export async function POST(request) {
  try {
    await ensureTables();
    const owner = await requireOwner(request);
    if (!owner) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const email = (body.email || "").trim().toLowerCase();
    const role = (body.role || "painter").trim();
    // Optional override, useful to force production URLs from any environment
    const bodyBaseUrl = (body.baseUrl || "").trim();
    if (!email) {
      return Response.json({ error: "Email is required" }, { status: 400 });
    }

    // generate token
    const token = `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await sql`
      INSERT INTO team_invites (email, role, token, expires_at, created_by_user_id)
      VALUES (${email}, ${role}, ${token}, ${expiresAt.toISOString()}, ${owner.id})
    `;

    const computedBaseUrl = bodyBaseUrl || buildBaseUrl(request);
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
      await sendEmail({
        to: email,
        subject,
        text,
        html,
      });
    } catch (err) {
      console.error("Invite email error:", err);
    }

    return Response.json({ success: true, acceptUrl });
  } catch (error) {
    console.error("Team invite error:", error);
    return Response.json({ error: "Failed to create invite" }, { status: 500 });
  }
}
