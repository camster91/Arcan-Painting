import sql from "@/app/api/utils/sql";
import { getCurrentUser } from "@/app/api/utils/auth";
import { auditLog } from "@/app/api/utils/audit";
import { generalLimiter } from "@/app/api/utils/rate-limit";

const owner = (user) => user?.role === "owner";
const projectIdFrom = (request, body) => Number(body?.project_id || new URL(request.url).searchParams.get("project_id"));

export async function GET(request) {
  const limited = generalLimiter(request); if (limited) return limited;
  const user = await getCurrentUser(request); if (!owner(user)) return Response.json({ error: "Owner access required" }, { status: 403 });
  const projectId = projectIdFrom(request);
  if (!Number.isInteger(projectId)) return Response.json({ error: "Valid project_id is required" }, { status: 400 });
  const [project] = await sql`SELECT id, assigned_painter_id FROM projects WHERE id = ${projectId}`;
  if (!project) return Response.json({ error: "Project not found" }, { status: 404 });
  const crew = await sql`
    SELECT pcm.id, pcm.team_member_id, pcm.crew_role, pcm.assigned_at,
      tm.name, tm.email, tm.role
    FROM project_crew_members pcm JOIN team_members tm ON tm.id = pcm.team_member_id
    WHERE pcm.project_id = ${projectId} AND pcm.removed_at IS NULL ORDER BY tm.name
  `;
  return Response.json({ project_id: projectId, primary_painter_id: project.assigned_painter_id, crew });
}

export async function POST(request) {
  const limited = generalLimiter(request); if (limited) return limited;
  const user = await getCurrentUser(request); if (!owner(user)) return Response.json({ error: "Owner access required" }, { status: 403 });
  const body = await request.json().catch(() => ({})); const projectId = projectIdFrom(request, body);
  const memberIds = [...new Set((Array.isArray(body.team_member_ids) ? body.team_member_ids : []).map(Number))];
  if (!Number.isInteger(projectId)) return Response.json({ error: "Valid project_id is required" }, { status: 400 });
  if (memberIds.some((id) => !Number.isInteger(id)) || memberIds.length > 25) return Response.json({ error: "Crew must contain at most 25 valid team members" }, { status: 400 });
  const result = await sql.transaction(async (txn) => {
    const [project] = await txn`SELECT id, assigned_painter_id FROM projects WHERE id = ${projectId} FOR UPDATE`;
    if (!project) return { error: "Project not found", status: 404 };
    if (memberIds.length) {
      const valid = await txn`SELECT id FROM team_members WHERE id = ANY(${memberIds}::int[]) AND status = 'active'`;
      if (valid.length !== memberIds.length) return { error: "One or more crew members are inactive or missing", status: 409 };
    }
    await txn`UPDATE project_crew_members SET removed_at = CURRENT_TIMESTAMP WHERE project_id = ${projectId} AND removed_at IS NULL`;
    for (const memberId of memberIds) await txn`
      INSERT INTO project_crew_members (project_id, team_member_id, crew_role, assigned_at, removed_at)
      VALUES (${projectId}, ${memberId}, 'crew', CURRENT_TIMESTAMP, NULL)
      ON CONFLICT (project_id, team_member_id) DO UPDATE SET removed_at = NULL, assigned_at = CURRENT_TIMESTAMP
    `;
    return { project, memberIds };
  });
  if (result.error) return Response.json({ error: result.error }, { status: result.status });
  await auditLog({ request, action: "project.crew_replace", userId: user.id, username: user.username, resource: "project", resourceId: projectId, changes: { team_member_ids: memberIds, primary_painter_id: result.project.assigned_painter_id }, status: "success" });
  return Response.json({ project_id: projectId, team_member_ids: memberIds });
}
