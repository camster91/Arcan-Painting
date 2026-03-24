import { getPostBySlug } from "../../../../lib/blog.js";

export async function GET({ params }) {
  try {
    const post = getPostBySlug(params.slug);
    if (!post) {
      return Response.json({ error: "Post not found" }, { status: 404 });
    }
    return Response.json(post);
  } catch (err) {
    return Response.json({ error: "Failed to load post" }, { status: 500 });
  }
}
