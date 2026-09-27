import sql from "@/app/api/utils/sql";

// Static fallback — import at build time
let staticTags = null;
async function getStaticTags() {
  if (staticTags) return staticTags;
  try {
    const mod = await import("@/data/gallery-tags.json");
    staticTags = mod.default || mod;
  } catch {
    staticTags = {};
  }
  return staticTags;
}

// GET /api/gallery — Public gallery items with tags
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);
    const offset = (page - 1) * limit;

    // Try DB first
    let items = [];
    try {
      let query = `SELECT * FROM gallery_media WHERE visible = true`;
      const params = [];
      let paramIdx = 1;

      if (category && category !== "All") {
        query += ` AND category = $${paramIdx++}`;
        params.push(category);
      }

      query += ` ORDER BY sort_order ASC, (quality_score IS NULL) ASC, quality_score DESC`;
      query += ` LIMIT $${paramIdx++} OFFSET $${paramIdx++}`;
      params.push(limit, offset);

      items = await sql(query, params);
    } catch {
      // DB table may not exist yet — fall through to static
    }

    if (items.length > 0) {
      return Response.json({ items, source: "database" });
    }

    // Fallback to static JSON tags
    const tags = await getStaticTags();
    let staticItems = Object.entries(tags).map(([filename, tag], i) => ({
      id: i + 1,
      filename,
      ...tag,
      visible: true,
    }));

    if (category && category !== "All") {
      staticItems = staticItems.filter(
        (item) => item.category?.toLowerCase() === category.toLowerCase()
      );
    }

    staticItems.sort((a, b) => (b.quality_score || 0) - (a.quality_score || 0));
    const paged = staticItems.slice(offset, offset + limit);

    return Response.json({ items: paged, source: "static", total: staticItems.length });
  } catch (err) {
    console.error("Gallery API error:", err);
    return Response.json({ error: "Failed to load gallery" }, { status: 500 });
  }
}
