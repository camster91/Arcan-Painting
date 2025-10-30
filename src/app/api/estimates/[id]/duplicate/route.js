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

function generateEstimateNumber() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  const r = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `EST-${y}${m}${da}-${r}`;
}

export async function POST(request, { params }) {
  const client = sql; // reuse
  try {
    const user = await getCurrentUser(request);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const id = parseInt(params.id, 10);
    if (!id)
      return Response.json({ error: "Invalid estimate id" }, { status: 400 });

    // Load base estimate
    const estRows =
      await client`SELECT * FROM estimates WHERE id = ${id} LIMIT 1`;
    if (!estRows.length)
      return Response.json({ error: "Not found" }, { status: 404 });
    const base = estRows[0];

    // Insert new estimate
    const newNo = generateEstimateNumber();
    const inserted = await client`
      INSERT INTO estimates (
        lead_id, estimate_number, project_title, project_description,
        labor_cost, material_cost, total_cost, estimated_duration_days,
        status, valid_until, notes, created_by, created_at, updated_at
      ) VALUES (
        ${base.lead_id}, ${newNo}, ${base.project_title}, ${base.project_description},
        ${base.labor_cost}, ${base.material_cost}, ${base.total_cost}, ${base.estimated_duration_days},
        'draft', ${base.valid_until}, ${base.notes}, ${user.username}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      ) RETURNING id
    `;
    const newId = inserted[0].id;

    // Copy settings if exist
    const settingsRows =
      await client`SELECT * FROM estimate_settings WHERE estimate_id = ${id}`;
    if (settingsRows.length) {
      const s = settingsRows[0];
      await client`
        INSERT INTO estimate_settings (
          estimate_id, tax_rate, overhead_pct, markup_pct, currency, crew_hourly_cost, billable_rate, default_method, default_coats, primer_on, waste_paint_pct, waste_tape_pct, waste_poly_pct, setup_minutes_per_area, cleanup_buffer_pct, travel_minutes
        ) VALUES (
          ${newId}, ${s.tax_rate}, ${s.overhead_pct}, ${s.markup_pct}, ${s.currency}, ${s.crew_hourly_cost}, ${s.billable_rate}, ${s.default_method}, ${s.default_coats}, ${s.primer_on}, ${s.waste_paint_pct}, ${s.waste_tape_pct}, ${s.waste_poly_pct}, ${s.setup_minutes_per_area}, ${s.cleanup_buffer_pct}, ${s.travel_minutes}
        )
      `;
    }

    // Copy areas + surfaces + prep
    const areas =
      await client`SELECT * FROM estimate_areas WHERE estimate_id = ${id}`;
    for (const a of areas) {
      const areaInsert = await client`
        INSERT INTO estimate_areas (estimate_id, name, length, width, height, wall_sqft, ceiling_sqft, notes)
        VALUES (${newId}, ${a.name}, ${a.length}, ${a.width}, ${a.height}, ${a.wall_sqft}, ${a.ceiling_sqft}, ${a.notes})
        RETURNING id
      `;
      const newAreaId = areaInsert[0].id;

      const surfaces =
        await client`SELECT * FROM estimate_surfaces WHERE area_id = ${a.id}`;
      for (const s of surfaces) {
        await client`
          INSERT INTO estimate_surfaces (area_id, surface_type, measurement, unit, method, coats, primer, production_rate, coverage_rate, door_sides, profile_type, opening_sqft)
          VALUES (${newAreaId}, ${s.surface_type}, ${s.measurement}, ${s.unit}, ${s.method}, ${s.coats}, ${s.primer}, ${s.production_rate}, ${s.coverage_rate}, ${s.door_sides}, ${s.profile_type}, ${s.opening_sqft})
        `;
      }

      const preps =
        await client`SELECT * FROM estimate_prep_items WHERE area_id = ${a.id}`;
      for (const p of preps) {
        await client`
          INSERT INTO estimate_prep_items (area_id, prep_type, quantity, unit, rate, hours)
          VALUES (${newAreaId}, ${p.prep_type}, ${p.quantity}, ${p.unit}, ${p.rate}, ${p.hours})
        `;
      }
    }

    return Response.json({ success: true, id: newId, estimate_number: newNo });
  } catch (err) {
    console.error("duplicate estimate error", err);
    return Response.json({ error: "Failed to duplicate" }, { status: 500 });
  }
}
