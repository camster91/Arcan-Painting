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
  // Allow public access via share link later if needed; for now require auth
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
    if (!id) return new Response("Invalid estimate id", { status: 400 });

    const rows = await sql`
      SELECT e.*, l.name AS lead_name, l.email AS lead_email, l.phone AS lead_phone, l.address AS lead_address
      FROM estimates e
      LEFT JOIN leads l ON e.lead_id = l.id
      WHERE e.id = ${id}
      LIMIT 1
    `;
    if (!rows.length) return new Response("Not found", { status: 404 });
    const e = rows[0];

    const settings = await getAppSettings();

    const brandBlock = `
      <div style=\"display:flex; align-items:center; gap:12px;\">
        ${settings.logo_url ? `<img src=\\\"${settings.logo_url}\\\" alt=\\\"${settings.company_name || "Logo"}\\\" style=\\\"height:40px\\\"/>` : ""}
        <div>
          <div class=\"brand\">${settings.company_name || "Estimate"}</div>
          ${settings.company_address || settings.company_email || settings.company_phone ? `<div class=\\\"muted\\\" style=\\\"font-size:12px\\\">${[settings.company_address, settings.company_email, settings.company_phone].filter(Boolean).join(" · ")}</div>` : ""}
        </div>
      </div>`;

    // Build a clean client-facing HTML summary; users can use the browser's Print→Save as PDF
    const html = `<!doctype html>
<html>
<head>
  <meta charset=\"utf-8\" />
  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />
  <title>Estimate ${e.estimate_number} — ${e.project_title}</title>
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
  <div class=\"header\">
    ${brandBlock}
    <div class=\"pill\">Status: ${(e.status || "draft").toUpperCase()}</div>
  </div>

  <h1>${e.project_title || ""}</h1>
  ${e.project_description ? `<p class=\\\"muted\\\">${e.project_description}</p>` : ""}

  <div class=\"grid\" style=\"margin-top:16px\">
    <div class=\"box\">
      <h2>Client</h2>
      <div>${e.lead_name || ""}</div>
      ${e.lead_email ? `<div class=\\\"muted\\\">${e.lead_email}</div>` : ""}
      ${e.lead_phone ? `<div class=\\\"muted\\\">${e.lead_phone}</div>` : ""}
      ${e.lead_address ? `<div class=\\\"muted\\\">${e.lead_address}</div>` : ""}
    </div>
    <div class=\"box\">
      <h2>Totals</h2>
      <table>
        <tr><td>Labor</td><td style=\"text-align:right\">$${Number(e.labor_cost || 0).toFixed(2)}</td></tr>
        <tr><td>Materials</td><td style=\"text-align:right\">$${Number(e.material_cost || 0).toFixed(2)}</td></tr>
        <tr><td colspan=\"2\"><hr/></td></tr>
        <tr><td><strong>Total</strong></td><td style=\"text-align:right\" class=\"total\">$${Number(e.total_cost || 0).toFixed(2)}</td></tr>
      </table>
      ${e.estimated_duration_days ? `<div class=\\\"muted\\\" style=\\\"margin-top:8px\\\">Estimated duration: ${e.estimated_duration_days} day(s)</div>` : ""}
      ${e.valid_until ? `<div class=\\\"muted\\\">Valid until: ${new Date(e.valid_until).toLocaleDateString()}</div>` : ""}
    </div>
  </div>

  ${e.notes ? `<h2>Notes</h2><div class=\\\"box\\\">${e.notes}</div>` : ""}

  <div class=\"footer\">${settings.company_name ? settings.company_name + " · " : ""}Thank you for the opportunity. Please reply to this email to approve or request changes.</div>
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
    console.error("pdf route error", err);
    return new Response("Server error", { status: 500 });
  }
}
