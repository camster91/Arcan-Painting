/**
 * GET /api/admin/recovery — list soft-deleted leads
 * POST /api/admin/recovery — restore a soft-deleted lead
 * 
 * Requires admin authentication.
 */
import sql from "@/app/api/utils/sql";
import { requireAdmin } from "@/app/api/utils/auth";
import { auditLog } from "@/app/api/utils/audit";

export async function GET(request) {
  const authorized = await requireAdmin(request);
  if (!authorized) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const table = url.searchParams.get("table") || "leads";
    const limit = Math.min(parseInt(url.searchParams.get("limit")) || 50, 200);

    if (table !== "leads") {
      return Response.json({ error: "Only leads recovery is supported at this time" }, { status: 400 });
    }

    const deleted = await sql`
      SELECT id, name, email, phone, service_type, status, created_at, deleted_at
      FROM leads
      WHERE deleted_at IS NOT NULL
      ORDER BY deleted_at DESC
      LIMIT ${limit}
    `;

    return Response.json({
      success: true,
      table,
      count: deleted.length,
      records: deleted,
    });
  } catch (error) {
    console.error("Recovery GET error:", error);
    return Response.json({ error: "Failed to fetch deleted records" }, { status: 500 });
  }
}

export async function POST(request) {
  const authorized = await requireAdmin(request);
  if (!authorized) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, table = "leads" } = body;

    if (!id) {
      return Response.json({ error: "ID is required" }, { status: 400 });
    }

    if (table !== "leads") {
      return Response.json({ error: "Only leads recovery is supported at this time" }, { status: 400 });
    }

    // Check the record exists and is deleted
    const records = await sql`SELECT id, name FROM leads WHERE id = ${id} AND deleted_at IS NOT NULL`;
    if (!records || records.length === 0) {
      return Response.json({ error: "Record not found or is not deleted" }, { status: 404 });
    }

    // Restore by clearing deleted_at
    await sql`UPDATE leads SET deleted_at = NULL WHERE id = ${id}`;

    await auditLog({
      request,
      action: "lead.restore",
      status: "success",
      changes: { id, name: records[0].name, table },
    });

    return Response.json({
      success: true,
      message: `Lead "${records[0].name}" has been restored.`,
      id,
    });
  } catch (error) {
    console.error("Recovery POST error:", error);
    return Response.json({ error: "Failed to restore record" }, { status: 500 });
  }
}
