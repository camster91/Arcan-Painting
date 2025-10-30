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
    // settings table may not exist yet
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
      return Response.json({ error: "Invalid invoice id" }, { status: 400 });

    // fetch invoice + lead
    const rows = await sql`
      SELECT i.*, l.name AS client_name, l.email AS client_email
      FROM invoices i
      LEFT JOIN leads l ON i.lead_id = l.id
      WHERE i.id = ${id}
      LIMIT 1
    `;
    if (!rows.length)
      return Response.json({ error: "Not found" }, { status: 404 });
    const inv = rows[0];
    if (!inv.client_email) {
      return Response.json({ error: "Client has no email" }, { status: 400 });
    }

    const settings = await getAppSettings();

    const baseUrl = process.env.APP_URL || "";
    const pdfUrl = `${baseUrl}/api/invoices/${id}/pdf`;

    const vars = {
      company_name: settings.company_name || "",
      company_email: settings.company_email || "",
      company_phone: settings.company_phone || "",
      company_address: settings.company_address || "",
      client_name: inv.client_name || "",
      client_email: inv.client_email || "",
      invoice_number: inv.invoice_number || "",
      title: inv.title || "",
      total_amount: Number(inv.total_amount || 0).toFixed(2),
      amount_due: Number(inv.amount_due || 0).toFixed(2),
      due_date: new Date(inv.due_date).toLocaleDateString(),
      pdf_url: pdfUrl,
      sender: user.username,
    };

    const subject = `Invoice ${vars.invoice_number} — ${vars.title}`;

    const templateHtml = applyTemplate(settings.invoice_email_template, vars);

    const defaultHtml = `
      <div style="font-family:Inter,Segoe UI,Arial,sans-serif; color:#0f172a;">
        ${settings.logo_url ? `<div style=\"margin-bottom:12px\"><img src=\"${settings.logo_url}\" alt=\"${vars.company_name}\" style=\"height:40px\"/></div>` : ""}
        <h2>Invoice ${vars.invoice_number}</h2>
        <p>Hi ${vars.client_name || "there"},</p>
        <p>Please find your invoice details below:</p>
        <ul>
          <li><strong>Title:</strong> ${vars.title}</li>
          <li><strong>Total:</strong> $${vars.total_amount}</li>
          <li><strong>Amount Due:</strong> $${vars.amount_due}</li>
          <li><strong>Due Date:</strong> ${vars.due_date}</li>
        </ul>
        <p>You can view and print your invoice here:</p>
        <p><a href="${vars.pdf_url}" target="_blank">View Invoice</a></p>
        <p style="margin-top:24px; color:#64748b;">Sent by ${vars.sender}${vars.company_name ? ` · ${vars.company_name}` : ""}</p>
        ${settings.company_address || settings.company_email || settings.company_phone ? `<div style=\"margin-top:8px; color:#64748b; font-size:12px\">${[settings.company_address, settings.company_email, settings.company_phone].filter(Boolean).join(" · ")}</div>` : ""}
      </div>
    `;

    const html = templateHtml || defaultHtml;

    await sendEmail({
      to: inv.client_email,
      from: settings.email_from || "invoices@arcanpainting.ca",
      subject,
      html,
      text: `Invoice ${vars.invoice_number} for ${vars.title}. Total $${vars.total_amount}. Due $${vars.amount_due} by ${vars.due_date}. View: ${vars.pdf_url}`,
    });

    // update status → sent and sent_date
    await sql`UPDATE invoices SET status = 'sent', sent_date = CURRENT_DATE, updated_at = CURRENT_TIMESTAMP WHERE id = ${id}`;

    return Response.json({ success: true });
  } catch (err) {
    console.error("send invoice error", err);
    return Response.json({ error: "Failed to send" }, { status: 500 });
  }
}
