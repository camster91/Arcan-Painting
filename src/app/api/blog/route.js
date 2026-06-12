import { getPublishedPosts } from "@/lib/blog-db.js";

export async function GET() {
  try {
    const posts = await getPublishedPosts();
    // Strip body from list view
    const meta = posts.map(({ body, ...rest }) => rest);
    return Response.json(meta);
  } catch (err) {
    console.error("[api/blog] GET error:", err);
    return Response.json({ error: "Failed to load posts" }, { status: 500 });
  }
}
