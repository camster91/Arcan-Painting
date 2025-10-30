import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

async function getAppSettings() {
  try {
    const rows = await sql`SELECT * FROM app_settings ORDER BY id DESC LIMIT 1`;
    return rows[0] || {};
  } catch (e) {
    return {};
  }
}

export async function GET(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const id = parseInt(params.id, 10);
    if (!id) return new Response("Invalid contract id", { status: 400 });

    const rows = await sql`
      SELECT c.*, l.name AS client_name, l.email AS client_email, l.phone AS client_phone, l.address AS client_address
      FROM contracts c
      LEFT JOIN leads l ON c.lead_id = l.id
      WHERE c.id = ${id}
      LIMIT 1
    `;

    if (!rows.length) return new Response("Not found", { status: 404 });
    const c = rows[0];

    const settings = await getAppSettings();

    const brandBlock = `
      <div style="display:flex; align-items:center; gap:12px;">
        ${settings.logo_url ? `<img src="${settings.logo_url}" alt="${settings.company_name || "Logo"}" style="height:40px"/>` : ""}
        <div>
          <div class="brand">${settings.company_name || "Contract"}</div>
          ${settings.company_address || settings.company_email || settings.company_phone ? `<div class="muted" style="font-size:12px">${[settings.company_address, settings.company_email, settings.company_phone].filter(Boolean).join(" · ")}</div>` : ""}
        </div>
      </div>`;

    const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Contract ${c.contract_number} — ${c.title || ""}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 40px; color: #0f172a; }
    .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 24px; }
    .brand { font-weight: 800; font-size: 20px; color: #111827; }
    .muted { color:#64748b; }
    .pill { display:inline-block; padding:4px 10px; border-radius: 999px; font-size: 12px; border:1px solid #e5e7eb; }
    .grid { display:grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    h1 { font-size: 28px; margin: 8px 0 4px; }
    h2 { font-size: 18px; margin: 24px 0 8px; }
    table { width:100%; border-collapse: collapse; }
    td { padding: 8px 0; }
    .total { font-size: 22px; font-weight: 800; color:#b45309; }
    .box { background:#f8fafc; border:1px solid #e2e8f0; border-radius: 12px; padding: 16px; }
    .footer { margin-top: 32px; font-size:12px; color:#64748b; }
    @media print { body { margin: 12mm; } }
  </style>
</head>
<body>
  <div class="header">
    ${brandBlock}
    <div class="pill">Status: ${(c.status || "draft").toUpperCase()}</div>
  </div>

  <h1>${c.title || ""}</h1>
  ${c.description ? `<p class="muted">${c.description}</p>` : ""}

  <div class="grid" style="margin-top:16px">
    <div class="box">
      <h2>Client</h2>
      <div>${c.client_name || ""}</div>
      ${c.client_email ? `<div class="muted">${c.client_email}</div>` : ""}
      ${c.client_phone ? `<div class="muted">${c.client_phone}</div>` : ""}
      ${c.client_address ? `<div class="muted">${c.client_address}</div>` : ""}
    </div>
    <div class="box">
      <h2>Totals</h2>
      <table>
        <tr><td>Total</td><td style="text-align:right" class="total">$${Number(c.total_amount || 0).toFixed(2)}</td></tr>
        ${c.deposit_amount ? `<tr><td>Deposit (${c.deposit_percentage || 0}%)</td><td style="text-align:right">$${Number(c.deposit_amount).toFixed(2)}</td></tr>` : ""}
      </table>
      ${c.start_date ? `<div class="muted" style="margin-top:8px">Start: ${new Date(c.start_date).toLocaleDateString()}</div>` : ""}
      ${c.completion_date ? `<div class="muted">Completion: ${new Date(c.completion_date).toLocaleDateString()}</div>` : ""}
      ${c.estimated_duration_days ? `<div class="muted">Estimated duration: ${c.estimated_duration_days} day(s)</div>` : ""}
    </div>
  </div>

  ${c.scope_of_work ? `<h2>Scope of Work</h2><div class="box">${c.scope_of_work.replace(/\n/g, "<br/>")}</div>` : ""}
  ${c.terms_and_conditions ? `<h2>Terms and Conditions</h2><div class="box">${c.terms_and_conditions.replace(/\n/g, "<br/>")}</div>` : ""}
  ${c.payment_terms ? `<h2>Payment Terms</h2><div class="box">${c.payment_terms.replace(/\n/g, "<br/>")}</div>` : ""}
  ${c.warranty_terms ? `<h2>Warranty</h2><div class="box">${c.warranty_terms.replace(/\n/g, "<br/>")}</div>` : ""}

  <div class="footer">${settings.company_name ? settings.company_name + " · " : ""}Please reply to this email to approve or request changes.</div>
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("contract pdf error", err);
    return new Response("Server error", { status: 500 });
  }
}
