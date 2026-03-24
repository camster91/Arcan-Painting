import { getAllPosts } from "../../../lib/blog.js";

export async function GET() {
  try {
    const posts = getAllPosts().map(({ content, ...meta }) => meta);
    return Response.json(posts);
  } catch (err) {
    return Response.json({ error: "Failed to load posts" }, { status: 500 });
  }
}
