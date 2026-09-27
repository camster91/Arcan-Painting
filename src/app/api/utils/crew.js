import { getCurrentUser } from "@/app/api/utils/auth";

/**
 * Who is using the crew view. Crew accounts are matched to their team member
 * record by email (team invites create both with the same address). Owners
 * and admins see every active job.
 */
export async function crewContext(db, request) {
  const user = await getCurrentUser(request);
  if (!user) return null;
  const [member] = await db`SELECT id, name FROM team_members WHERE LOWER(email) = ${String(user.username).toLowerCase()} LIMIT 1`;
  return {
    user,
    isAdmin: ["owner", "admin"].includes(user.role),
    memberId: member?.id ?? null,
    name: member?.name || user.username,
  };
}

/** Jobs this person may see: assigned to them, not finished, starting within two weeks. */
export async function crewJobs(db, ctx, now = new Date()) {
  const cutoff = new Date(now.getTime() + 14 * 86400000).toISOString().slice(0, 10);
  const memberId = ctx.memberId ?? -1;
  return db`
    SELECT p.id, p.project_name, p.status, p.start_date, p.end_date, p.notes, p.completion_percentage,
           l.name AS customer_name, l.phone AS customer_phone, l.address,
           e.project_description AS scope, e.id AS estimate_id,
           (SELECT COUNT(*) FROM project_progress pp WHERE pp.project_id = p.id) AS report_count
    FROM projects p
    LEFT JOIN leads l ON p.lead_id = l.id
    LEFT JOIN estimates e ON p.estimate_id = e.id
    WHERE p.status NOT IN ('completed', 'cancelled')
      AND (p.start_date IS NULL OR p.start_date <= ${cutoff})
      AND (${ctx.isAdmin} OR p.assigned_painter_id = ${memberId})
    ORDER BY p.start_date IS NULL, p.start_date, p.id
  `;
}

export async function canSeeJob(db, ctx, projectId) {
  if (ctx.isAdmin) return true;
  const [row] = await db`SELECT id FROM projects WHERE id = ${projectId} AND assigned_painter_id = ${ctx.memberId ?? -1}`;
  return Boolean(row);
}
