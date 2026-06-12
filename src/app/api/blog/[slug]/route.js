import { getPostBySlug } from "@/lib/blog-db.js";

export async function GET({ params }) {
  try {
    const post = await getPostBySlug(params.slug);
    if (!post) {
      return Response.json({ error: "Post not found" }, { status: 404 });
    }
    // Only return published posts publicly
    if (post.status !== "published") {
      return Response.json({ error: "Post not found" }, { status: 404 });
    }
    return Response.json(post);
  } catch (err) {
    console.error("[api/blog/[slug]] GET error:", err);
    return Response.json({ error: "Failed to load post" }, { status: 500 });
  }
}
