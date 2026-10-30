import sql from "@/app/api/utils/sql";
import { projectGallery } from "@/data/projectGallery";

// The public endpoint shares the reviewed finished-photo selection with both
// gallery components. Raw AI tags and admin uploads are not publication approval.
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const parsedPage = Number.parseInt(searchParams.get("page") || "1", 10);
  const parsedLimit = Number.parseInt(searchParams.get("limit") || "50", 10);
  const page = Number.isFinite(parsedPage) ? Math.max(1, parsedPage) : 1;
  const limit = Number.isFinite(parsedLimit) ? Math.max(1, Math.min(parsedLimit, 100)) : 50;
  // A configured origin database retains admin visibility control. Never
  // republish hidden photographs by falling back after a database outage.
  const hidden = new Set();
  if (process.env.DATABASE_URL) {
    try {
      const rows = await sql("SELECT filename, visible FROM gallery_media");
      for (const row of rows) {
        if (row.visible === false || row.visible === 0) hidden.add(row.filename);
      }
    } catch {
      return Response.json({ error: "Gallery temporarily unavailable" }, { status: 503 });
    }
  }
  const items = projectGallery
    .filter((item) => !hidden.has(item.file))
    .filter((item) => !category || category.toLowerCase() === "all" || item.category.toLowerCase() === category.toLowerCase())
    .map((item) => ({
      ...item,
      id: item.file,
      filename: item.file,
      alt_text: item.alt,
      phase: "after",
      visible: true,
    }));
  const offset = (page - 1) * limit;
  return Response.json({ items: items.slice(offset, offset + limit), source: "curated", total: items.length });
}
