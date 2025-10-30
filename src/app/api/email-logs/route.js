import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

export async function GET(request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const template = searchParams.get("template");
    const days = parseInt(searchParams.get("days")) || 30;
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 50;
    const offset = (page - 1) * limit;

    let whereConditions = [
      "sent_at >= CURRENT_DATE - INTERVAL '" + days + " days'",
    ];
    let params = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      whereConditions.push(`status = $${paramCount}`);
      params.push(status);
    }

    if (template) {
      paramCount++;
      whereConditions.push(`template_name = $${paramCount}`);
      params.push(template);
    }

    const whereClause = "WHERE " + whereConditions.join(" AND ");

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM email_logs
      ${whereClause}
    `;
    const countResult = await sql(countQuery, params);
    const total = parseInt(countResult[0].total);

    // Get logs with pagination
    const logsQuery = `
      SELECT *
      FROM email_logs
      ${whereClause}
      ORDER BY sent_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;
    const logs = await sql(logsQuery, [...params, limit, offset]);

    // Get stats
    const statsQuery = `
      SELECT 
        COUNT(*) as total_emails,
        COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent_count,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count,
        COUNT(DISTINCT template_name) as unique_templates,
        COUNT(CASE WHEN sent_at >= CURRENT_DATE THEN 1 END) as today_count
      FROM email_logs
      WHERE sent_at >= CURRENT_DATE - INTERVAL '${days} days'
    `;
    const statsResult = await sql(statsQuery);
    const stats = statsResult[0];

    return Response.json({
      logs,
      stats: {
        total: parseInt(stats.total_emails),
        sent: parseInt(stats.sent_count),
        failed: parseInt(stats.failed_count),
        templates: parseInt(stats.unique_templates),
        today: parseInt(stats.today_count),
        success_rate:
          stats.total_emails > 0
            ? Math.round((stats.sent_count / stats.total_emails) * 100)
            : 0,
      },
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching email logs:", error);
    return Response.json(
      { error: "Failed to fetch email logs" },
      { status: 500 },
    );
  }
}

// Delete old email logs (cleanup endpoint)
export async function DELETE(request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days")) || 90;

    const result = await sql`
      DELETE FROM email_logs 
      WHERE sent_at < CURRENT_DATE - INTERVAL '${days} days'
    `;

    return Response.json({
      message: `Deleted email logs older than ${days} days`,
      deleted_count: result.rowCount || 0,
    });
  } catch (error) {
    console.error("Error deleting email logs:", error);
    return Response.json(
      { error: "Failed to delete email logs" },
      { status: 500 },
    );
  }
}
