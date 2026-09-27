import sql from "@/app/api/utils/sql";
import { getCurrentUser } from "@/app/api/utils/auth";
import { ensurePublicToken, publicUrl } from "@/app/api/utils/public-links";

// GET → { url } — the customer page for this record, creating its link the first time.
export async function GET(request, { params }) {
  const user = await getCurrentUser(request);
  if (!user || !["owner", "admin"].includes(user.role)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const id = parseInt(params.id, 10);
  const token = id ? await ensurePublicToken(sql, "estimates", id) : null;
  if (!token) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ url: publicUrl("estimates", token, process.env.APP_URL || new URL(request.url).origin) });
}
