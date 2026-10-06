import sql from "@/app/api/utils/sql";
import { getCurrentUser } from "@/app/api/utils/auth";
import { requireCsrf } from "@/app/api/utils/csrf";
import { generalLimiter } from "@/app/api/utils/rate-limit";
import { saveCustomerNote } from "@/app/api/utils/customer-activity";

const headers = { "Cache-Control": "private, no-store" };
export async function POST(request, { params }) {
  const limited = generalLimiter(request);
  if (limited) return limited;
  try {
    const user = await getCurrentUser(request);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401, headers });
    if (!["owner", "admin"].includes(user.role)) return Response.json({ error: "Forbidden" }, { status: 403, headers });
    const csrfError = requireCsrf(request);
    if (csrfError) return csrfError;
    if (!/^[1-9]\d*$/.test(String(params.id)) || !Number.isSafeInteger(Number(params.id))) return Response.json({ error: "Invalid lead id" }, { status: 400, headers });
    const body = await request.json().catch(() => null);
    const text = typeof body?.text === "string" ? body.text.trim() : "";
    if (!text || text.length > 2000) return Response.json({ error: "Enter a note between 1 and 2,000 characters" }, { status: 400, headers });
    const key = body?.requestId;
    if (typeof key !== "string" || !/^[A-Za-z0-9_-]{16,100}$/.test(key)) return Response.json({ error: "Invalid save key" }, { status: 400, headers });
    const result = await saveCustomerNote(sql, { leadId: Number(params.id), key, text, user });
    if (result.error) return Response.json({ error: result.error }, { status: result.status, headers });
    return Response.json({ success: true, ...result }, { status: result.replayed ? 200 : 201, headers });
  } catch (error) {
    console.error("Error saving customer note:", error);
    return Response.json({ error: "Could not confirm the note was saved. Retry the same note." }, { status: 500, headers });
  }
}
