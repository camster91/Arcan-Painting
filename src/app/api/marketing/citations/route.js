import { getCurrentUser } from "../../utils/auth.js";
import sql from "../../utils/sql.js";

// GET - list directories with citation status
export async function GET(request) {
  const user = await getCurrentUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const category = url.searchParams.get("category");
  const priority = url.searchParams.get("priority");
  const status = url.searchParams.get("status");

  let query = `
    SELECT
      d.*,
      cs.id as citation_status_id,
      cs.status as listing_status,
      cs.listing_url,
      cs.nap_correct,
      cs.last_checked_at,
      cs.notes as status_notes
    FROM citation_directories d
    LEFT JOIN citation_status cs ON cs.directory_id = d.id
  `;
  const conditions = [];
  const params = [];

  if (category) {
    conditions.push(`d.category = $${params.length + 1}`);
    params.push(category);
  }
  if (priority) {
    conditions.push(`d.priority = $${params.length + 1}`);
    params.push(priority);
  }
  if (status) {
    conditions.push(
      `(cs.status = $${params.length + 1} OR (cs.id IS NULL AND $${params.length + 1} = 'not_listed'))`
    );
    params.push(status);
  }

  if (conditions.length) query += " WHERE " + conditions.join(" AND ");
  query += " ORDER BY d.domain_authority DESC, d.priority ASC";

  const directories = await sql(query, params);

  const total = directories.length;
  const listed = directories.filter((d) =>
    ["listed", "claimed"].includes(d.listing_status)
  ).length;
  const needsUpdate = directories.filter(
    (d) => d.listing_status === "needs_update"
  ).length;
  const notListed = directories.filter(
    (d) => !d.listing_status || d.listing_status === "not_listed"
  ).length;

  return Response.json({
    directories,
    stats: {
      total,
      listed,
      needsUpdate,
      notListed,
      completionRate: total > 0 ? Math.round((listed / total) * 100) : 0,
    },
  });
}

// POST - update citation status, generate NAP, or bulk check
export async function POST(request) {
  const user = await getCurrentUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { action } = body;

  if (action === "update_status") {
    return handleUpdateStatus(body);
  }

  if (action === "generate_nap") {
    return handleGenerateNap();
  }

  if (action === "bulk_check") {
    return handleBulkCheck(body);
  }

  return Response.json({ error: "Invalid action" }, { status: 400 });
}

async function handleUpdateStatus({ directoryId, status, listingUrl, napCorrect, notes }) {
  if (!directoryId || !status) {
    return Response.json({ error: "directoryId and status required" }, { status: 400 });
  }

  const existing = await sql`SELECT id FROM citation_status WHERE directory_id = ${directoryId}`;

  if (existing.length) {
    await sql`
      UPDATE citation_status
      SET status = ${status},
          listing_url = ${listingUrl || null},
          nap_correct = ${napCorrect !== false},
          notes = ${notes || null},
          last_checked_at = NOW(),
          updated_at = NOW()
      WHERE directory_id = ${directoryId}
    `;
  } else {
    await sql`
      INSERT INTO citation_status (directory_id, status, listing_url, nap_correct, notes, last_checked_at)
      VALUES (${directoryId}, ${status}, ${listingUrl || null}, ${napCorrect !== false}, ${notes || null}, NOW())
    `;
  }

  return Response.json({ success: true });
}

async function handleGenerateNap() {
  const settings = await sql`SELECT * FROM app_settings LIMIT 1`;
  const s = settings[0] || {};

  return Response.json({
    nap: {
      name: s.company_name || "Arcan Painting",
      address: s.company_address || "",
      phone: s.company_phone || "(416) 727-2148",
      website: "https://arcanpainting.ca",
      email: s.company_email || "info@arcanpainting.ca",
      description:
        "Professional interior and exterior painting services for residential and commercial properties across the Greater Toronto Area. Fully insured. Free estimates.",
      categories: [
        "Painting Contractor",
        "Interior Painter",
        "Exterior Painter",
        "Commercial Painter",
      ],
      service_area:
        "Toronto, Mississauga, Brampton, Markham, Richmond Hill, Vaughan, Oakville, Burlington, Etobicoke, Scarborough",
    },
  });
}

async function handleBulkCheck({ directoryIds }) {
  const braveKey = process.env.BRAVE_SEARCH_API_KEY;
  if (!braveKey) {
    return Response.json(
      { error: "Brave Search API key required for bulk check" },
      { status: 501 }
    );
  }

  const results = [];

  for (const dirId of (directoryIds || []).slice(0, 5)) {
    const dir = await sql`SELECT * FROM citation_directories WHERE id = ${dirId}`;
    if (!dir.length) continue;

    try {
      const hostname = new URL(dir[0].url).hostname;
      const searchQuery = `site:${hostname} Arcan Painting`;
      const res = await fetch(
        `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(searchQuery)}&count=3`,
        { headers: { "X-Subscription-Token": braveKey, Accept: "application/json" } }
      );
      const data = await res.json();
      const found = data.web?.results?.length > 0;

      const status = found ? "listed" : "not_listed";
      const listingUrl = found ? data.web.results[0].url : null;

      // Upsert citation_status
      const existing = await sql`SELECT id FROM citation_status WHERE directory_id = ${dirId}`;
      if (existing.length) {
        await sql`
          UPDATE citation_status
          SET status = ${status}, listing_url = ${listingUrl}, last_checked_at = NOW(), updated_at = NOW()
          WHERE directory_id = ${dirId}
        `;
      } else {
        await sql`
          INSERT INTO citation_status (directory_id, status, listing_url, last_checked_at)
          VALUES (${dirId}, ${status}, ${listingUrl}, NOW())
        `;
      }

      results.push({
        directoryId: dirId,
        directoryName: dir[0].name,
        found,
        listingUrl,
      });
    } catch (err) {
      results.push({
        directoryId: dirId,
        directoryName: dir[0].name,
        found: false,
        error: err.message,
      });
    }
  }

  return Response.json({ results, checked: results.length });
}
