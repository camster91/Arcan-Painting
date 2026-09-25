import sql from "@/app/api/utils/sql";
import { getCurrentUser } from "@/app/api/utils/auth";
import { analyzeImage, ImageInputError } from "@/app/api/utils/vision-tagger";

const CREATE_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS gallery_media (
    id SERIAL PRIMARY KEY,
    filename TEXT NOT NULL UNIQUE,
    category TEXT DEFAULT 'interior',
    room TEXT DEFAULT 'other',
    service TEXT DEFAULT 'wall_painting',
    phase TEXT DEFAULT 'after',
    quality_score NUMERIC(3,2) DEFAULT 0.5,
    title TEXT DEFAULT 'Painting Project',
    alt_text TEXT DEFAULT '',
    orientation TEXT DEFAULT 'normal',
    visible BOOLEAN DEFAULT true,
    sort_order INT DEFAULT 0,
    project_id INT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )
`;

async function ensureTable() {
  try {
    await sql(CREATE_TABLE_SQL);
  } catch (err) {
    console.error("Failed to create gallery_media table:", err.message);
  }
}

// GET /api/admin/gallery — List all gallery items (including hidden)
export async function GET(request) {
  const user = await getCurrentUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  await ensureTable();

  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    let query = `SELECT * FROM gallery_media`;
    const params = [];
    let paramIdx = 1;

    if (category && category !== "All") {
      query += ` WHERE category = $${paramIdx++}`;
      params.push(category);
    }

    query += ` ORDER BY sort_order ASC, (quality_score IS NULL) ASC, quality_score DESC`;
    const items = await sql(query, params);

    return Response.json({ items });
  } catch (err) {
    if (err instanceof ImageInputError) {
      return Response.json({ error: err.message }, { status: 400 });
    }
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/admin/gallery — Create item or run actions
export async function POST(request) {
  const user = await getCurrentUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  await ensureTable();

  try {
    const body = await request.json();
    const { action } = body;

    // Analyze a single image with Gemini vision
    if (action === "analyze") {
      const { url, base64, filename } = body;
      const tags = await analyzeImage({ url, base64 });

      if (filename) {
        await sql`
          INSERT INTO gallery_media (filename, category, room, service, phase, quality_score, title, alt_text, orientation)
          VALUES (${filename}, ${tags.category}, ${tags.room}, ${tags.service}, ${tags.phase}, ${tags.quality_score}, ${tags.title}, ${tags.alt_text}, ${tags.orientation})
          ON CONFLICT (filename) DO UPDATE SET
            category = EXCLUDED.category, room = EXCLUDED.room, service = EXCLUDED.service,
            phase = EXCLUDED.phase, quality_score = EXCLUDED.quality_score, title = EXCLUDED.title,
            alt_text = EXCLUDED.alt_text, orientation = EXCLUDED.orientation, updated_at = NOW()
        `;
      }

      return Response.json({ tags });
    }

    // Bulk import from static JSON tags
    if (action === "bulk_import") {
      let staticTags;
      try {
        const mod = await import("@/data/gallery-tags.json");
        staticTags = mod.default || mod;
      } catch {
        return Response.json({ error: "gallery-tags.json not found" }, { status: 404 });
      }

      let imported = 0;
      for (const [filename, tags] of Object.entries(staticTags)) {
        try {
          await sql`
            INSERT INTO gallery_media (filename, category, room, service, phase, quality_score, title, alt_text, orientation)
            VALUES (${filename}, ${tags.category}, ${tags.room}, ${tags.service}, ${tags.phase}, ${tags.quality_score}, ${tags.title}, ${tags.alt_text}, ${tags.orientation})
            ON CONFLICT (filename) DO NOTHING
          `;
          imported++;
        } catch {
          // A bad legacy tag must not prevent other gallery metadata imports.
        }
      }

      return Response.json({ imported, total: Object.keys(staticTags).length });
    }

    // Standard create
    const { filename, category, title, alt_text, visible = true, sort_order = 0 } = body;
    if (!filename) return Response.json({ error: "filename required" }, { status: 400 });

    const [item] = await sql`
      INSERT INTO gallery_media (filename, category, title, alt_text, visible, sort_order)
      VALUES (${filename}, ${category || 'interior'}, ${title || 'Painting Project'}, ${alt_text || ''}, ${visible}, ${sort_order})
      RETURNING *
    `;

    return Response.json({ item }, { status: 201 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// PUT /api/admin/gallery — Update gallery item
export async function PUT(request) {
  const user = await getCurrentUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id, ...updates } = await request.json();
    if (!id) return Response.json({ error: "id required" }, { status: 400 });

    const fields = [];
    const params = [];
    let paramIdx = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (["filename", "category", "room", "service", "phase", "quality_score", "title", "alt_text", "orientation", "visible", "sort_order", "project_id"].includes(key)) {
        fields.push(`${key} = $${paramIdx++}`);
        params.push(value);
      }
    }

    if (fields.length === 0) return Response.json({ error: "No valid fields" }, { status: 400 });

    fields.push(`updated_at = NOW()`);
    params.push(id);

    const query = `UPDATE gallery_media SET ${fields.join(", ")} WHERE id = $${paramIdx} RETURNING *`;
    const rows = await sql(query, params);

    if (rows.length === 0) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json({ item: rows[0] });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/admin/gallery — Delete gallery item
export async function DELETE(request) {
  const user = await getCurrentUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await request.json();
    if (!id) return Response.json({ error: "id required" }, { status: 400 });

    const rows = await sql`DELETE FROM gallery_media WHERE id = ${id} RETURNING id`;
    if (rows.length === 0) return Response.json({ error: "Not found" }, { status: 404 });

    return Response.json({ deleted: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
