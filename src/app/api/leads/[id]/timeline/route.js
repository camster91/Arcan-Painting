import sql from "@/app/api/utils/sql";
import { getCurrentUser } from "@/app/api/utils/auth";
import { generalLimiter } from "@/app/api/utils/rate-limit";
import { loadCustomerTimeline } from "@/app/api/utils/customer-timeline";

const headers = { "Cache-Control": "private, no-store" };
export async function GET(request, { params }) {
  const limited = generalLimiter(request);
  if (limited) return limited;
  try {
    const user = await getCurrentUser(request);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401, headers });
    // Preserve main's company-wide CRM role gate until the broader role model
    // and assigned-job access have been reconciled. Portal sessions never enter.
    if (!["owner", "admin"].includes(user.role)) return Response.json({ error: "Forbidden" }, { status: 403, headers });
    if (!/^[1-9]\d*$/.test(String(params.id)) || !Number.isSafeInteger(Number(params.id))) return Response.json({ error: "Invalid lead id" }, { status: 400, headers });
    const leadId = Number(params.id);
    const leads = await sql`SELECT id, name FROM leads WHERE id = ${leadId} AND deleted_at IS NULL`;
    if (!leads.length) return Response.json({ error: "Lead not found" }, { status: 404, headers });
    const timeline = await loadCustomerTimeline(sql, leadId);
    return Response.json({ lead: leads[0], ...timeline, visibility: "internal" }, { headers });
  } catch (error) {
    console.error("Error loading customer timeline:", error);
    return Response.json({ error: "Failed to load customer activity" }, { status: 500, headers });
  }
}
