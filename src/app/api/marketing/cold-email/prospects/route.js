import { getCurrentUser } from "../../../utils/auth.js";
import sql from "../../../utils/sql.js";

// GET - list prospects with filters
export async function GET(request) {
  const user = await getCurrentUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const status = url.searchParams.get("status") || "new";
  const role = url.searchParams.get("role");
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 200);

  // Build dynamic query using string-based sql() call
  let query = "SELECT * FROM cold_email_prospects";
  const params = [];
  const conditions = [];

  if (status !== "all") {
    conditions.push(`status = $${params.length + 1}`);
    params.push(status);
  }
  if (role) {
    conditions.push(`role = $${params.length + 1}`);
    params.push(role);
  }
  if (conditions.length) query += " WHERE " + conditions.join(" AND ");
  query += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
  params.push(limit);

  const prospects = await sql(query, params);

  // Stats
  const stats = await sql`
    SELECT
      COUNT(*) FILTER (WHERE status = 'new')::int as new_count,
      COUNT(*) FILTER (WHERE status = 'emailed')::int as emailed_count,
      COUNT(*) FILTER (WHERE status = 'replied')::int as replied_count,
      COUNT(*) FILTER (WHERE status = 'converted')::int as converted_count,
      COUNT(*)::int as total
    FROM cold_email_prospects
  `;

  return Response.json({ prospects, stats: stats[0] });
}

// POST - find new prospects OR add manually
export async function POST(request) {
  const user = await getCurrentUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { action } = body;

  if (action === "find") {
    return handleFindProspects(body);
  }
  if (action === "add_manual") {
    return handleAddManual(body);
  }
  if (action === "import_csv") {
    return handleImportCsv(body);
  }
  if (action === "update_status") {
    return handleUpdateStatus(body);
  }

  return Response.json({ error: "Invalid action" }, { status: 400 });
}

async function handleFindProspects({ role, city, count = 20 }) {
  const googleKey = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_API_KEY;

  if (!googleKey) {
    return Response.json({
      error: "Google Places API key not configured. Add GOOGLE_PLACES_API_KEY to env vars.",
      fallback: "Use manual import or bulk CSV upload instead.",
    }, { status: 501 });
  }

  const searchQuery =
    role === "real_estate_agent"
      ? `real estate agent ${city}`
      : role === "property_manager"
        ? `property management company ${city}`
        : `${role.replace(/_/g, " ")} ${city}`;

  try {
    const placesRes = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=${googleKey}&region=ca`
    );
    const placesData = await placesRes.json();

    let added = 0;
    for (const place of (placesData.results || []).slice(0, count)) {
      // Get details for each place (email not available from Places API, but we get phone/website)
      const detailRes = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_phone_number,website,types&key=${googleKey}`
      );
      const detail = await detailRes.json();

      try {
        await sql`
          INSERT INTO cold_email_prospects (name, company, role, city, source, metadata)
          VALUES (
            ${place.name},
            ${place.name},
            ${role},
            ${city},
            'google_places',
            ${JSON.stringify({
              place_id: place.place_id,
              phone: detail.result?.formatted_phone_number,
              website: detail.result?.website,
              address: place.formatted_address,
            })}
          )
          ON CONFLICT (email) DO NOTHING
        `;
        added++;
      } catch {
        /* skip duplicates */
      }
    }

    return Response.json({
      found: placesData.results?.length || 0,
      added,
      message: `Found ${added} new prospects in ${city}`,
    });
  } catch {
    return Response.json({ error: "Google Places search failed" }, { status: 500 });
  }
}

async function handleAddManual({ name, email, company, role, city }) {
  if (!email) return Response.json({ error: "Email required" }, { status: 400 });

  const prospect = await sql`
    INSERT INTO cold_email_prospects (name, email, company, role, city, source)
    VALUES (${name}, ${email}, ${company}, ${role || "other"}, ${city || "Toronto"}, 'manual')
    ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, updated_at = CURRENT_TIMESTAMP
    RETURNING *
  `;
  return Response.json({ prospect: prospect[0] });
}

async function handleImportCsv({ prospects: csvProspects }) {
  let added = 0;
  for (const p of csvProspects) {
    try {
      await sql`
        INSERT INTO cold_email_prospects (name, email, company, role, city, source)
        VALUES (${p.name}, ${p.email}, ${p.company}, ${p.role || "other"}, ${p.city || "Toronto"}, 'manual')
        ON CONFLICT (email) DO NOTHING
      `;
      added++;
    } catch {
      /* skip */
    }
  }
  return Response.json({ added });
}

async function handleUpdateStatus({ prospectId, status }) {
  await sql`
    UPDATE cold_email_prospects
    SET status = ${status}, updated_at = CURRENT_TIMESTAMP
    WHERE id = ${prospectId}
  `;
  return Response.json({ success: true });
}
