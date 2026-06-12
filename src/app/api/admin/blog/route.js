import { getAllPosts, createPost, slugExists } from "@/lib/blog-db.js";
import { getCurrentUser } from "@/app/api/utils/auth.js";
import { ensureSchema } from "@/migrations/001-initial-schema.js";

export async function GET(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(request.url);
    const status = url.searchParams.get("status") || undefined;
    const posts = await getAllPosts({ status });
    return Response.json(posts);
  } catch (err) {
    console.error("[api/admin/blog] GET error:", err);
    return Response.json({ error: "Failed to load posts" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    await ensureSchema();
    const body = await request.json();

    const { slug, title, excerpt, content: body_text, cover_image_url, status, meta_description, tags } = body;

    if (!slug || !title) {
      return Response.json({ error: "slug and title are required" }, { status: 400 });
    }

    // Validate slug uniqueness
    const exists = await slugExists(slug);
    if (exists) {
      return Response.json({ error: "A post with this slug already exists" }, { status: 409 });
    }

    const post = await createPost({
      slug,
      title,
      excerpt: excerpt || "",
      body: body_text || "",
      cover_image_url: cover_image_url || "",
      author_id: user.id,
      status: status || "draft",
      meta_description: meta_description || "",
      tags: tags || [],
    });

    return Response.json(post, { status: 201 });
  } catch (err) {
    console.error("[api/admin/blog] POST error:", err);
    return Response.json({ error: "Failed to create post" }, { status: 500 });
  }
}
