import { getPostById, updatePost, deletePost, slugExists } from "@/lib/blog-db.js";
import { getCurrentUser } from "@/app/api/utils/auth.js";

export async function GET({ params, request }) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const post = await getPostById(params.id);
    if (!post) return Response.json({ error: "Post not found" }, { status: 404 });
    return Response.json(post);
  } catch (err) {
    console.error("[api/admin/blog/[id]] GET error:", err);
    return Response.json({ error: "Failed to load post" }, { status: 500 });
  }
}

export async function PUT({ params, request }) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { slug, title, excerpt, content: body_text, cover_image_url, status, meta_description, tags } = body;

    // If slug is being changed, validate uniqueness
    if (slug) {
      const exists = await slugExists(slug, parseInt(params.id));
      if (exists) {
        return Response.json({ error: "A post with this slug already exists" }, { status: 409 });
      }
    }

    const post = await updatePost(parseInt(params.id), {
      slug,
      title,
      excerpt,
      body: body_text,
      cover_image_url,
      status,
      meta_description,
      tags,
    });

    if (!post) return Response.json({ error: "Post not found" }, { status: 404 });
    return Response.json(post);
  } catch (err) {
    console.error("[api/admin/blog/[id]] PUT error:", err);
    return Response.json({ error: "Failed to update post" }, { status: 500 });
  }
}

export async function DELETE({ params, request }) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const deleted = await deletePost(parseInt(params.id));
    if (!deleted) return Response.json({ error: "Post not found" }, { status: 404 });
    return Response.json({ success: true });
  } catch (err) {
    console.error("[api/admin/blog/[id]] DELETE error:", err);
    return Response.json({ error: "Failed to delete post" }, { status: 500 });
  }
}
