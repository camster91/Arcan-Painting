/**
 * GET /api/admin/audit-logs
 * Returns audit log entries. Admin-only.
 * Query params: limit, offset, action, user_id, status, from, to
 */
import sql from "@/app/api/utils/sql";
import { getCurrentUser } from "@/app/api/utils/auth";
import { ensureAuditTable } from "@/app/api/utils/audit";
import { generalLimiter } from "@/app/api/utils/rate-limit";

export async function GET(request) {
  const limited = generalLimiter(request);
  if (limited) return limited;

  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureAuditTable();

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);
    const offset = parseInt(searchParams.get("offset") || "0");
    const action = searchParams.get("action");
    const userId = searchParams.get("user_id");
    const status = searchParams.get("status");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    // Build dynamic query
    const conditions = [];
    const params = [];
    let p = 1;

    if (action) { conditions.push(`action ILIKE $${p}`); params.push(`%${action}%`); p++; }
    if (userId) { conditions.push(`user_id = $${p}`); params.push(parseInt(userId)); p++; }
    if (status) { conditions.push(`status = $${p}`); params.push(status); p++; }
    if (from) { conditions.push(`created_at >= $${p}`); params.push(from); p++; }
    if (to) { conditions.push(`created_at <= $${p}`); params.push(to); p++; }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const logsQuery = `
      SELECT * FROM audit_logs
      ${where}
      ORDER BY created_at DESC
      LIMIT $${p} OFFSET $${p + 1}
    `;
    params.push(limit, offset);

    const countQuery = `SELECT COUNT(*) as total FROM audit_logs ${where}`;
    const countParams = params.slice(0, -2);

    const [logs, countResult] = await Promise.all([
      sql(logsQuery, params),
      sql(countQuery, countParams),
    ]);

    const total = parseInt(countResult[0]?.total || 0);

    return Response.json({
      logs,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return Response.json({ error: "Failed to fetch audit logs" }, { status: 500 });
  }
}
