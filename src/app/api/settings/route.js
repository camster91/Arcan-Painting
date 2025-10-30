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
  // Try Authorization: Bearer first
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
  // Fallback to cookie session used elsewhere in admin
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

async function ensureSettingsTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS app_settings (
      id SERIAL PRIMARY KEY,
      company_name VARCHAR(255),
      company_email VARCHAR(255),
      company_phone VARCHAR(50),
      company_address TEXT,
      tax_rate NUMERIC(5,2),
      markup_pct NUMERIC(5,2),
      currency VARCHAR(10) DEFAULT 'USD',
      hourly_rate NUMERIC(10,2),
      logo_url TEXT,
      email_from VARCHAR(255),
      invoice_notes_template TEXT,
      estimate_email_template TEXT,
      invoice_email_template TEXT,
      contract_email_template TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
}

export async function GET(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    await ensureSettingsTable();

    const rows = await sql`SELECT * FROM app_settings ORDER BY id DESC LIMIT 1`;
    const settings = rows[0] || {
      company_name: "",
      company_email: "",
      company_phone: "",
      company_address: "",
      tax_rate: 13.0,
      markup_pct: 0,
      currency: "USD",
      hourly_rate: null,
      logo_url: "",
      email_from: "",
      invoice_notes_template: "",
      estimate_email_template: "",
      invoice_email_template: "",
      contract_email_template: "",
    };

    return Response.json({ success: true, settings });
  } catch (e) {
    console.error("GET /api/settings error", e);
    return Response.json({ error: "Failed to get settings" }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    // Roles allowed to update settings
    const allowed = ["owner", "admin"];
    if (!allowed.includes(user.role)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    await ensureSettingsTable();

    const body = await request.json();
    const {
      company_name,
      company_email,
      company_phone,
      company_address,
      tax_rate,
      markup_pct,
      currency,
      hourly_rate,
      logo_url,
      email_from,
      invoice_notes_template,
      estimate_email_template,
      invoice_email_template,
      contract_email_template,
    } = body || {};

    // Upsert behavior: update latest row if exists, else insert new
    const existing =
      await sql`SELECT id FROM app_settings ORDER BY id DESC LIMIT 1`;
    if (existing.length) {
      const id = existing[0].id;
      const fields = [];
      const values = [];
      let i = 1;

      const push = (col, val) => {
        fields.push(`${col} = $${i}`);
        values.push(val);
        i++;
      };

      if (company_name !== undefined) push("company_name", company_name);
      if (company_email !== undefined) push("company_email", company_email);
      if (company_phone !== undefined) push("company_phone", company_phone);
      if (company_address !== undefined)
        push("company_address", company_address);
      if (tax_rate !== undefined)
        push("tax_rate", tax_rate === null ? null : parseFloat(tax_rate));
      if (markup_pct !== undefined)
        push("markup_pct", markup_pct === null ? null : parseFloat(markup_pct));
      if (currency !== undefined) push("currency", currency);
      if (hourly_rate !== undefined)
        push(
          "hourly_rate",
          hourly_rate === null ? null : parseFloat(hourly_rate),
        );
      if (logo_url !== undefined) push("logo_url", logo_url);
      if (email_from !== undefined) push("email_from", email_from);
      if (invoice_notes_template !== undefined)
        push("invoice_notes_template", invoice_notes_template);
      if (estimate_email_template !== undefined)
        push("estimate_email_template", estimate_email_template);
      if (invoice_email_template !== undefined)
        push("invoice_email_template", invoice_email_template);
      if (contract_email_template !== undefined)
        push("contract_email_template", contract_email_template);

      // updated_at
      push("updated_at", new Date().toISOString());

      values.push(id);

      const q = `UPDATE app_settings SET ${fields.join(", ")} WHERE id = $${i} RETURNING *`;
      const updated = await sql(q, values);
      return Response.json({ success: true, settings: updated[0] });
    } else {
      const inserted = await sql`
        INSERT INTO app_settings (
          company_name, company_email, company_phone, company_address,
          tax_rate, markup_pct, currency, hourly_rate, logo_url, email_from,
          invoice_notes_template, estimate_email_template, invoice_email_template, contract_email_template
        ) VALUES (
          ${company_name || null}, ${company_email || null}, ${company_phone || null}, ${company_address || null},
          ${tax_rate !== undefined ? parseFloat(tax_rate) : null},
          ${markup_pct !== undefined ? parseFloat(markup_pct) : null},
          ${currency || "USD"},
          ${hourly_rate !== undefined ? parseFloat(hourly_rate) : null},
          ${logo_url || null},
          ${email_from || null},
          ${invoice_notes_template || null},
          ${estimate_email_template || null},
          ${invoice_email_template || null},
          ${contract_email_template || null}
        ) RETURNING *
      `;
      return Response.json({ success: true, settings: inserted[0] });
    }
  } catch (e) {
    console.error("PUT /api/settings error", e);
    return Response.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
