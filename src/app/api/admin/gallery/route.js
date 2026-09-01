import sql from "@/app/api/utils/sql";
import { getCurrentUser } from "@/app/api/utils/auth";
import { analyzeImage, ImageInputError } from "@/app/api/utils/vision-tagger";
import { auditLog } from "@/app/api/utils/audit";

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
    visible BOOLEAN DEFAULT false,
    sort_order INT DEFAULT 0,
    project_id INT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )
`;

async function ensureTable() {
  try {
    await sql(CREATE_TABLE_SQL);
    await sql`ALTER TABLE gallery_media ADD COLUMN IF NOT EXISTS publication_status TEXT NOT NULL DEFAULT 'draft'`;
    await sql`ALTER TABLE gallery_media ADD COLUMN IF NOT EXISTS customer_consent_confirmed BOOLEAN NOT NULL DEFAULT FALSE`;
    await sql`ALTER TABLE gallery_media ADD COLUMN IF NOT EXISTS business_proof_confirmed BOOLEAN NOT NULL DEFAULT FALSE`;
    await sql`ALTER TABLE gallery_media ADD COLUMN IF NOT EXISTS case_study_summary TEXT DEFAULT ''`;
    await sql`ALTER TABLE gallery_media ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ`;
    await sql`ALTER TABLE gallery_media ADD COLUMN IF NOT EXISTS approved_by INTEGER`;
    await sql`ALTER TABLE gallery_media ALTER COLUMN visible SET DEFAULT FALSE`;
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

    query += ` ORDER BY sort_order ASC, quality_score DESC NULLS LAST`;
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
          INSERT INTO gallery_media (filename, category, room, service, phase, quality_score, title, alt_text, orientation, visible)
          VALUES (${filename}, ${tags.category}, ${tags.room}, ${tags.service}, ${tags.phase}, ${tags.quality_score}, ${tags.title}, ${tags.alt_text}, ${tags.orientation}, FALSE)
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
            INSERT INTO gallery_media (filename, category, room, service, phase, quality_score, title, alt_text, orientation, visible)
            VALUES (${filename}, ${tags.category}, ${tags.room}, ${tags.service}, ${tags.phase}, ${tags.quality_score}, ${tags.title}, ${tags.alt_text}, ${tags.orientation}, FALSE)
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
    const { filename, category, title, alt_text, sort_order = 0 } = body;
    if (!filename) return Response.json({ error: "filename required" }, { status: 400 });

    const [item] = await sql`
      INSERT INTO gallery_media (filename, category, title, alt_text, visible, sort_order)
      VALUES (${filename}, ${category || 'interior'}, ${title || 'Painting Project'}, ${alt_text || ''}, FALSE, ${sort_order})
      RETURNING *
    `;

    await auditLog({ request, action: "gallery.create", userId: user.id, username: user.username, resource: "gallery_media", resourceId: item.id, changes: { filename: item.filename, publication_status: "draft" }, status: "success" });

    return Response.json({ item }, { status: 201 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// PUT /api/admin/gallery — Update gallery item
export async function PUT(request) {
  const user = await getCurrentUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  await ensureTable();
  try {
    const { id, ...updates } = await request.json();
    if (!id) return Response.json({ error: "id required" }, { status: 400 });

    const currentRows = await sql`SELECT * FROM gallery_media WHERE id = ${id} LIMIT 1`;
    if (currentRows.length === 0) return Response.json({ error: "Not found" }, { status: 404 });
    const next = { ...currentRows[0], ...updates };
    const validationError = validateGalleryPublication(next);
    if (validationError) return Response.json({ error: validationError }, { status: 400 });

    const fields = [];
    const params = [];
    let paramIdx = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (["filename", "category", "room", "service", "phase", "quality_score", "title", "alt_text", "orientation", "visible", "sort_order", "project_id", "publication_status", "customer_consent_confirmed", "business_proof_confirmed", "case_study_summary"].includes(key)) {
        fields.push(`${key} = $${paramIdx++}`);
        params.push(value);
      }
    }

    if (fields.length === 0) return Response.json({ error: "No valid fields" }, { status: 400 });

    if (next.publication_status === "approved" && currentRows[0].publication_status !== "approved") {
      fields.push(`approved_at = NOW()`);
      fields.push(`approved_by = $${paramIdx++}`);
      params.push(user.id);
    } else if (next.publication_status !== "approved") {
      fields.push(`approved_at = NULL`);
      fields.push(`approved_by = NULL`);
      if (next.visible) return Response.json({ error: "A non-approved item cannot remain published" }, { status: 400 });
    }
    fields.push(`updated_at = NOW()`);
    params.push(id);

    const query = `UPDATE gallery_media SET ${fields.join(", ")} WHERE id = $${paramIdx} RETURNING *`;
    const rows = await sql(query, params);

    if (rows.length === 0) return Response.json({ error: "Not found" }, { status: 404 });
    await auditLog({ request, action: rows[0].visible ? "gallery.publish" : "gallery.update", userId: user.id, username: user.username, resource: "gallery_media", resourceId: id, changes: { fields: Object.keys(updates), publication_status: rows[0].publication_status, visible: rows[0].visible }, status: "success" });
    return Response.json({ item: rows[0] });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/admin/gallery — Delete gallery item
export async function DELETE(request) {
  const user = await getCurrentUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  await ensureTable();
  try {
    const { id } = await request.json();
    if (!id) return Response.json({ error: "id required" }, { status: 400 });

    const rows = await sql`DELETE FROM gallery_media WHERE id = ${id} RETURNING id`;
    if (rows.length === 0) return Response.json({ error: "Not found" }, { status: 404 });

    await auditLog({ request, action: "gallery.delete", userId: user.id, username: user.username, resource: "gallery_media", resourceId: id, changes: {}, status: "success" });
    return Response.json({ deleted: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export function validateGalleryPublication(item) {
  if (!["draft", "review", "approved"].includes(item.publication_status)) {
    return "Invalid publication status";
  }
  if ((item.publication_status === "approved" || item.visible === true) && (!item.customer_consent_confirmed || !item.business_proof_confirmed)) {
    return "Customer consent and business proof are required before approval or publication";
  }
  if (item.visible === true && item.publication_status !== "approved") {
    return "Only approved portfolio items can be published";
  }
  return null;
}
