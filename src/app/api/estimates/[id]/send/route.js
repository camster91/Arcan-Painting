import sql from "@/app/api/utils/sql";
import { sendEmail } from "@/app/api/utils/send-email";

function parseCookies(h) {
  const out = {};
  if (!h) return out;
  h.split(";").forEach((p) => {
    const [k, v] = p.split("=");
    if (!k) return;
    out[k.trim()] = decodeURIComponent((v || "").trim());
  });
  return out;
}

async function getCurrentUser(request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    const token = authHeader.slice(7);
    const sessions =
      await sql`SELECT * FROM auth_sessions WHERE token = ${token} AND expires_at > NOW()`;
    if (sessions.length) {
      const users =
        await sql`SELECT id, username, role FROM auth_users WHERE id = ${sessions[0].user_id} LIMIT 1`;
      if (users.length) return users[0];
    }
  }
  const cookies = parseCookies(request.headers.get("cookie"));
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
  return { id: user.id, username: user.username, role: user.role };
}

async function getAppSettings() {
  try {
    const rows = await sql`SELECT * FROM app_settings ORDER BY id DESC LIMIT 1`;
    return rows[0] || {};
  } catch (e) {
    return {};
  }
}

function applyTemplate(tpl, vars) {
  if (!tpl || !tpl.trim()) return null;
  return tpl.replace(/{{\s*(\w+)\s*}}/g, (_, k) => {
    const v = vars[k];
    return v === undefined || v === null ? "" : String(v);
  });
}

export async function POST(request, { params }) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const id = parseInt(params.id, 10);
    if (!id)
      return Response.json({ error: "Invalid estimate id" }, { status: 400 });

    // fetch estimate + lead
    const rows = await sql`
      SELECT e.*, l.name AS lead_name, l.email AS lead_email
      FROM estimates e
      LEFT JOIN leads l ON e.lead_id = l.id
      WHERE e.id = ${id}
      LIMIT 1
    `;
    if (!rows.length)
      return Response.json({ error: "Not found" }, { status: 404 });
    const e = rows[0];
    if (!e.lead_email) {
      return Response.json({ error: "Lead has no email" }, { status: 400 });
    }

    const settings = await getAppSettings();

    const baseUrl = process.env.APP_URL || "";
    const pdfUrl = `${baseUrl}/api/estimates/${id}/pdf`;

    const vars = {
      company_name: settings.company_name || "",
      company_email: settings.company_email || "",
      company_phone: settings.company_phone || "",
      company_address: settings.company_address || "",
      lead_name: e.lead_name || "",
      lead_email: e.lead_email || "",
      estimate_number: e.estimate_number || "",
      project_title: e.project_title || "",
      total_cost: Number(e.total_cost || 0).toFixed(2),
      valid_until: e.valid_until
        ? new Date(e.valid_until).toLocaleDateString()
        : "",
      pdf_url: pdfUrl,
      sender: user.username,
    };

    const subject = `Estimate ${vars.estimate_number} — ${vars.project_title}`;

    const templateHtml = applyTemplate(settings.estimate_email_template, vars);

    const defaultHtml = `
      <div style="font-family:Inter,Segoe UI,Arial,sans-serif; color:#0f172a;">
        ${settings.logo_url ? `<div style=\"margin-bottom:12px\"><img src=\"${settings.logo_url}\" alt=\"${vars.company_name}\" style=\"height:40px\"/></div>` : ""}
        <h2>Estimate ${vars.estimate_number}</h2>
        <p>Hi ${vars.lead_name || "there"},</p>
        <p>Thanks for the opportunity. Here's your estimate summary:</p>
        <ul>
          <li><strong>Project:</strong> ${vars.project_title}</li>
          <li><strong>Total:</strong> $${vars.total_cost}</li>
          ${vars.valid_until ? `<li><strong>Valid until:</strong> ${vars.valid_until}</li>` : ""}
        </ul>
        <p>You can view and print your estimate here:</p>
        <p><a href="${vars.pdf_url}" target="_blank">View Estimate</a></p>
        <p>Reply to this email to approve or request changes.</p>
        <p style="margin-top:24px; color:#64748b;">Sent by ${vars.sender}${vars.company_name ? ` · ${vars.company_name}` : ""}</p>
        ${settings.company_address || settings.company_email || settings.company_phone ? `<div style=\"margin-top:8px; color:#64748b; font-size:12px\">${[settings.company_address, settings.company_email, settings.company_phone].filter(Boolean).join(" · ")}</div>` : ""}
      </div>
    `;

    const html = templateHtml || defaultHtml;

    await sendEmail({
      to: e.lead_email,
      from: settings.email_from || "estimates@arcanpainting.ca",
      subject,
      html,
      text: `Estimate ${vars.estimate_number} for ${vars.project_title}. Total $${vars.total_cost}. View: ${vars.pdf_url}`,
    });

    // update status → sent
    await sql`UPDATE estimates SET status = 'sent', updated_at = CURRENT_TIMESTAMP WHERE id = ${id}`;

    return Response.json({ success: true });
  } catch (err) {
    console.error("send estimate error", err);
    return Response.json({ error: "Failed to send" }, { status: 500 });
  }
}
