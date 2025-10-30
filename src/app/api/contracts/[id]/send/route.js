import sql from "@/app/api/utils/sql";
import { sendEmail } from "@/app/api/utils/send-email";

// Helper function to parse cookies
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

// Helper function to check authentication using local auth system
async function checkAuth(request) {
  const cookieHeader = request.headers.get("cookie");
  const cookies = parseCookies(cookieHeader);
  const token = cookies["admin_session"];

  if (!token) {
    return null;
  }

  const rows = await sql`
    SELECT u.id, u.username, u.role, s.expires_at
    FROM auth_sessions s
    JOIN auth_users u ON u.id = s.user_id
    WHERE s.token = ${token}
    LIMIT 1
  `;
  const row = rows[0];

  if (!row) {
    return null;
  }

  const nowIso = new Date().toISOString();
  if (row.expires_at && row.expires_at < nowIso) {
    // Cleanup expired session
    await sql`DELETE FROM auth_sessions WHERE token = ${token}`;
    return null;
  }

  return { user: { id: row.id, username: row.username, role: row.role } };
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
    const session = await checkAuth(request);
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = parseInt(params.id, 10);
    if (!id)
      return Response.json({ error: "Invalid contract id" }, { status: 400 });

    const rows = await sql`
      SELECT c.*, l.name AS client_name, l.email AS client_email
      FROM contracts c
      LEFT JOIN leads l ON c.lead_id = l.id
      WHERE c.id = ${id}
      LIMIT 1
    `;

    if (!rows.length) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    const c = rows[0];
    if (!c.client_email) {
      return Response.json({ error: "Client has no email" }, { status: 400 });
    }

    const settings = await getAppSettings();

    const baseUrl = process.env.APP_URL || "";
    const pdfUrl = `${baseUrl}/api/contracts/${id}/pdf`;

    const vars = {
      company_name: settings.company_name || "",
      company_email: settings.company_email || "",
      company_phone: settings.company_phone || "",
      company_address: settings.company_address || "",
      client_name: c.client_name || "",
      client_email: c.client_email || "",
      contract_number: c.contract_number || "",
      title: c.title || "Painting Project",
      total_amount: Number(c.total_amount || 0).toFixed(2),
      start_date: c.start_date
        ? new Date(c.start_date).toLocaleDateString()
        : "",
      pdf_url: pdfUrl,
      sender: session.user.username || session.user.email,
    };

    const subject = `Contract ${vars.contract_number} — ${vars.title}`;

    const templateHtml = applyTemplate(settings.contract_email_template, vars);

    const defaultHtml = `
      <div style=\"font-family:Inter,Segoe UI,Arial,sans-serif; color:#0f172a;\">
        ${settings.logo_url ? `<div style=\\"margin-bottom:12px\\\"><img src=\\\"${settings.logo_url}\\\" alt=\\\"${vars.company_name}\\\" style=\\\"height:40px\\\"/></div>` : ""}
        <h2>Contract ${vars.contract_number}</h2>
        <p>Hi ${vars.client_name || "there"},</p>
        <p>Please review your contract below:</p>
        <ul>
          <li><strong>Project:</strong> ${vars.title}</li>
          <li><strong>Total:</strong> $${vars.total_amount}</li>
          ${vars.start_date ? `<li><strong>Start date:</strong> ${vars.start_date}</li>` : ""}
        </ul>
        <p>You can view and print your contract here:</p>
        <p><a href=\"${vars.pdf_url}\" target=\"_blank\">View Contract</a></p>
        <p>Reply to this email to approve or request changes.</p>
        <p style=\"margin-top:24px; color:#64748b;\">Sent by ${vars.sender}${vars.company_name ? ` · ${vars.company_name}` : ""}</p>
        ${settings.company_address || settings.company_email || settings.company_phone ? `<div style=\\"margin-top:8px; color:#64748b; font-size:12px\\">${[settings.company_address, settings.company_email, settings.company_phone].filter(Boolean).join(" · ")}</div>` : ""}
      </div>
    `;

    const html = templateHtml || defaultHtml;

    await sendEmail({
      to: c.client_email,
      from: settings.email_from || "contracts@arcanpainting.ca",
      subject,
      html,
      text: `Contract ${vars.contract_number} for ${vars.title}. Total $${vars.total_amount}. View: ${vars.pdf_url}`,
    });

    await sql`UPDATE contracts SET status = 'sent', sent_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ${id}`;

    return Response.json({ success: true });
  } catch (err) {
    console.error("send contract error", err);
    return Response.json({ error: "Failed to send" }, { status: 500 });
  }
}
