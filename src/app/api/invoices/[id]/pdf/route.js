import sql from "@/app/api/utils/sql";

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
  // Allow only authenticated access for now (similar to estimates pdf route)
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

export async function GET(request, { params }) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return new Response("Unauthorized", { status: 401 });

    const id = parseInt(params.id, 10);
    if (!id) return new Response("Invalid invoice id", { status: 400 });

    // Load invoice, client and line items
    const invoiceRows = await sql`
      SELECT i.*, l.name AS client_name, l.email AS client_email, l.phone AS client_phone, l.address AS client_address
      FROM invoices i
      LEFT JOIN leads l ON i.lead_id = l.id
      WHERE i.id = ${id}
      LIMIT 1
    `;
    if (!invoiceRows.length) return new Response("Not found", { status: 404 });
    const inv = invoiceRows[0];

    const lineItems = await sql`
      SELECT description, quantity, unit_price, line_total, category
      FROM invoice_line_items
      WHERE invoice_id = ${id}
      ORDER BY id ASC
    `;

    const settings = await getAppSettings();

    const brandBlock = `
      <div style="display:flex; align-items:center; gap:12px;">
        ${settings.logo_url ? `<img src="${settings.logo_url}" alt="${settings.company_name || "Logo"}" style="height:40px"/>` : ""}
        <div>
          <div class="brand">${settings.company_name || "Invoice"}</div>
          ${settings.company_address || settings.company_email || settings.company_phone ? `<div class="muted" style="font-size:12px">${[settings.company_address, settings.company_email, settings.company_phone].filter(Boolean).join(" · ")}</div>` : ""}
        </div>
      </div>`;

    const notesHtml = inv.notes
      ? `<h2>Notes</h2><div class="box">${inv.notes}</div>`
      : settings.invoice_notes_template
        ? `<h2>Notes</h2><div class="box">${settings.invoice_notes_template}</div>`
        : "";

    const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Invoice ${inv.invoice_number} — ${inv.title || ""}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 40px; color: #0f172a; }
    .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 24px; }
    .brand { font-weight: 800; font-size: 20px; color: #111827; }
    .muted { color:#64748b; }
    .pill { display:inline-block; padding:4px 10px; border-radius: 999px; font-size: 12px; border:1px solid #e5e7eb; }
    h1 { font-size: 28px; margin: 8px 0 4px; }
    h2 { font-size: 18px; margin: 24px 0 8px; }
    table { width:100%; border-collapse: collapse; }
    th, td { padding: 8px; text-align:left; border-bottom: 1px solid #e2e8f0; }
    .total { font-size: 22px; font-weight: 800; color:#b45309; }
    .box { background:#f8fafc; border:1px solid #e2e8f0; border-radius: 12px; padding: 16px; }
    .footer { margin-top: 32px; font-size:12px; color:#64748b; }
    @media print { body { margin: 12mm; } }
  </style>
</head>
<body>
  <div class="header">
    ${brandBlock}
    <div class="pill">Status: ${(inv.payment_status || "unpaid").toUpperCase()}</div>
  </div>

  <h1>Invoice ${inv.invoice_number}</h1>
  <div class="muted">Issue: ${new Date(inv.issue_date).toLocaleDateString()} • Due: ${new Date(inv.due_date).toLocaleDateString()}</div>
  ${inv.title ? `<p class="muted" style="margin-top:8px">${inv.title}</p>` : ""}
  ${inv.description ? `<p class="muted">${inv.description}</p>` : ""}

  <div class="box" style="margin-top:16px">
    <h2>Bill To</h2>
    <div>${inv.client_name || ""}</div>
    ${inv.client_email ? `<div class="muted">${inv.client_email}</div>` : ""}
    ${inv.client_phone ? `<div class="muted">${inv.client_phone}</div>` : ""}
    ${inv.client_address ? `<div class="muted">${inv.client_address}</div>` : ""}
  </div>

  <h2>Line Items</h2>
  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th style="text-align:right">Qty</th>
        <th style="text-align:right">Unit Price</th>
        <th style="text-align:right">Line Total</th>
      </tr>
    </thead>
    <tbody>
      ${lineItems
        .map(
          (it) => `
        <tr>
          <td>${it.description || ""}</td>
          <td style="text-align:right">${Number(it.quantity || 0).toFixed(2)}</td>
          <td style="text-align:right">$${Number(it.unit_price || 0).toFixed(2)}</td>
          <td style="text-align:right">$${Number(it.line_total || 0).toFixed(2)}</td>
        </tr>`,
        )
        .join("")}
    </tbody>
  </table>

  <div class="box" style="margin-top:16px">
    <table>
      <tr><td>Subtotal</td><td style="text-align:right">$${Number(inv.subtotal || 0).toFixed(2)}</td></tr>
      <tr><td>Tax (${Number(inv.tax_rate || 0).toFixed(2)}%)</td><td style="text-align:right">$${Number(inv.tax_amount || 0).toFixed(2)}</td></tr>
      <tr><td colspan="2"><hr/></td></tr>
      <tr><td><strong>Total</strong></td><td style="text-align:right" class="total">$${Number(inv.total_amount || 0).toFixed(2)}</td></tr>
      <tr><td>Paid</td><td style="text-align:right">$${Number(inv.amount_paid || 0).toFixed(2)}</td></tr>
      <tr><td><strong>Amount Due</strong></td><td style="text-align:right" class="total">$${Number(inv.amount_due || 0).toFixed(2)}</td></tr>
    </table>
  </div>

  ${notesHtml}

  <div class="footer">${settings.company_name ? settings.company_name + " · " : ""}Thank you for your business. Please contact us if you have any questions.</div>
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
    console.error("invoice pdf route error", err);
    return new Response("Server error", { status: 500 });
  }
}
