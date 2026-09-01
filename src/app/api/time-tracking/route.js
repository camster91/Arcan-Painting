import sql from "@/app/api/utils/sql";
import { getCurrentUser } from "@/app/api/utils/auth";
import { auditLog } from "@/app/api/utils/audit";
import { queueEmailWorkflows } from "@/app/api/utils/email-workflows";
import { parseTimeEntryInput } from "@/app/api/utils/time-tracking-domain";

const owner = (user) => user?.role === "owner";
const integer = (value) => Number.isInteger(Number(value)) ? Number(value) : null;

async function resolveTeamMember(query, user, requestedId) {
  if (owner(user) && integer(requestedId)) {
    const [member] = await query`SELECT id, email FROM team_members WHERE id = ${integer(requestedId)} AND status = 'active' FOR UPDATE`;
    return member || null;
  }
  const [member] = await query`SELECT id, email FROM team_members WHERE LOWER(email) = LOWER(${user.username}) AND status = 'active' LIMIT 1 FOR UPDATE`;
  return member || null;
}

async function canUseProject(query, user, teamMemberId, projectId) {
  if (!projectId) return true;
  const rows = owner(user)
    ? await query`SELECT id FROM projects WHERE id = ${projectId} AND status NOT IN ('completed', 'cancelled')`
    : await query`SELECT id FROM projects WHERE id = ${projectId} AND assigned_painter_id = ${teamMemberId} AND status NOT IN ('completed', 'cancelled')`;
  return rows.length > 0;
}

export async function GET(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const search = new URL(request.url).searchParams;
    const requestedMemberId = integer(search.get("team_member_id"));
    const projectId = integer(search.get("project_id"));
    const limit = Math.min(Math.max(integer(search.get("limit")) || 50, 1), 50);
    const values = []; const conditions = [];
    if (!owner(user)) { values.push(user.username); conditions.push(`LOWER(tm.email) = LOWER($${values.length})`); }
    else if (requestedMemberId) { values.push(requestedMemberId); conditions.push(`tt.team_member_id = $${values.length}`); }
    if (projectId) { values.push(projectId); conditions.push(`tt.project_id = $${values.length}`); }
    if (search.get("start_date") && search.get("end_date")) {
      values.push(search.get("start_date")); conditions.push(`DATE(tt.clock_in_time) >= $${values.length}`);
      values.push(search.get("end_date")); conditions.push(`DATE(tt.clock_in_time) <= $${values.length}`);
    }
    if (search.get("status")) { values.push(search.get("status")); conditions.push(`tt.status = $${values.length}`); }
    values.push(limit);
    const entries = await sql(`
      SELECT tt.*, tm.name AS team_member_name, tm.role AS team_member_role,
        p.project_name, it.title AS task_title
      FROM time_tracking tt JOIN team_members tm ON tt.team_member_id = tm.id
      LEFT JOIN projects p ON tt.project_id = p.id
      LEFT JOIN internal_tasks it ON tt.internal_task_id = it.id
      ${conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""}
      ORDER BY tt.clock_in_time DESC LIMIT $${values.length}
    `, values);
    return Response.json({ timeEntries: entries });
  } catch (error) {
    console.error("Error fetching time tracking:", error);
    return Response.json({ error: "Failed to fetch time tracking data" }, { status: 500 });
  }
}

export async function POST(request) {
  const user = await getCurrentUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  let parsed;
  try { parsed = parseTimeEntryInput(body); }
  catch (error) { return Response.json({ error: error.message }, { status: 400 }); }
  const projectId = integer(body.project_id); const taskId = integer(body.internal_task_id);
  try {
    const result = await sql.transaction(async (txn) => {
      const member = await resolveTeamMember(txn, user, body.team_member_id);
      if (!member) return { error: "Current user is not linked to an active team member", status: 400 };
      if (!(await canUseProject(txn, user, member.id, projectId))) return { error: "Project not found or access denied", status: 404 };
      if (!parsed.clockOut) {
        const active = await txn`SELECT id FROM time_tracking WHERE team_member_id = ${member.id} AND status = 'active' FOR UPDATE`;
        if (active.length) return { error: "This team member already has an active timer", status: 409 };
      }
      const rate = owner(user) && body.hourly_rate != null ? Number(body.hourly_rate) : null;
      if (rate != null && (!Number.isFinite(rate) || rate < 0 || rate > 1000)) return { error: "Hourly rate is invalid", status: 400 };
      const totalCost = rate != null && parsed.totalHours != null ? rate * parsed.totalHours : null;
      const [entry] = await txn`
        INSERT INTO time_tracking (team_member_id, project_id, internal_task_id, clock_in_time, clock_out_time,
          break_duration_minutes, total_hours, hourly_rate, total_cost, work_description, location, notes, status)
        VALUES (${member.id}, ${projectId}, ${taskId}, ${parsed.clockIn}, ${parsed.clockOut}, ${parsed.breakMinutes},
          ${parsed.totalHours}, ${rate}, ${totalCost}, ${body.work_description || null}, ${body.location || null},
          ${body.notes || null}, ${parsed.clockOut ? "completed" : "active"}) RETURNING *
      `;
      let startedProject = null;
      if (projectId && !parsed.clockOut) {
        const [project] = await txn`UPDATE projects SET status = 'in_progress', updated_at = CURRENT_TIMESTAMP WHERE id = ${projectId} AND status = 'scheduled' RETURNING id, project_name, lead_id`;
        if (project) startedProject = project;
      }
      return { entry, startedProject };
    });
    if (result.error) return Response.json({ error: result.error }, { status: result.status });
    await auditLog({ request, action: parsed.clockOut ? "time_entry.create" : "time_entry.clock_in", userId: user.id, username: user.username, resource: "time_entry", resourceId: result.entry.id, changes: { project_id: projectId, team_member_id: result.entry.team_member_id }, status: "success" });
    if (result.startedProject) {
      const [lead] = await sql`SELECT name, email FROM leads WHERE id = ${result.startedProject.lead_id}`;
      await queueEmailWorkflows({ event: "project_start", recipientEmail: lead?.email, relatedType: "project", relatedId: result.startedProject.id, data: { lead_name: lead?.name, project_title: result.startedProject.project_name } });
    }
    return Response.json({ timeEntry: result.entry, project_started: Boolean(result.startedProject) }, { status: 201 });
  } catch (error) {
    console.error("Error creating time entry:", error);
    return Response.json({ error: "Failed to create time entry" }, { status: 500 });
  }
}

export async function PUT(request) {
  const user = await getCurrentUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => ({})); const id = integer(body.id);
  if (!id) return Response.json({ error: "Time entry ID is required" }, { status: 400 });
  try {
    const result = await sql.transaction(async (txn) => {
      const [entry] = await txn`
        SELECT tt.*, tm.email AS team_member_email FROM time_tracking tt
        JOIN team_members tm ON tm.id = tt.team_member_id WHERE tt.id = ${id} FOR UPDATE
      `;
      if (!entry || (!owner(user) && entry.team_member_email.toLowerCase() !== user.username.toLowerCase())) return { error: "Time entry not found or access denied", status: 404 };
      if (!owner(user) && entry.status !== "active" && body.clock_out_time) return { error: "Only an active timer can be stopped", status: 409 };
      let parsed;
      try { parsed = parseTimeEntryInput({ clock_in_time: owner(user) && body.clock_in_time ? body.clock_in_time : entry.clock_in_time, clock_out_time: body.clock_out_time || entry.clock_out_time, break_duration_minutes: body.break_duration_minutes ?? entry.break_duration_minutes }); }
      catch (error) { return { error: error.message, status: 400 }; }
      const rate = owner(user) && body.hourly_rate != null ? Number(body.hourly_rate) : Number(entry.hourly_rate) || null;
      const totalCost = rate != null && parsed.totalHours != null ? rate * parsed.totalHours : null;
      const [updated] = await txn`
        UPDATE time_tracking SET clock_in_time = ${parsed.clockIn}, clock_out_time = ${parsed.clockOut}, break_duration_minutes = ${parsed.breakMinutes},
          total_hours = ${parsed.totalHours}, total_cost = ${totalCost}, hourly_rate = ${rate},
          work_description = ${body.work_description ?? entry.work_description}, location = ${body.location ?? entry.location},
          notes = ${body.notes ?? entry.notes}, status = ${parsed.clockOut ? "completed" : entry.status}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id} RETURNING *
      `;
      return { entry: updated };
    });
    if (result.error) return Response.json({ error: result.error }, { status: result.status });
    await auditLog({ request, action: result.entry.status === "completed" ? "time_entry.clock_out" : "time_entry.update", userId: user.id, username: user.username, resource: "time_entry", resourceId: id, changes: { total_hours: result.entry.total_hours, project_id: result.entry.project_id }, status: "success" });
    return Response.json({ timeEntry: result.entry });
  } catch (error) {
    console.error("Error updating time entry:", error);
    return Response.json({ error: "Failed to update time entry" }, { status: 500 });
  }
}

export async function DELETE(request) {
  const user = await getCurrentUser(request);
  if (!owner(user)) return Response.json({ error: "Owner access required" }, { status: 403 });
  const id = integer(new URL(request.url).searchParams.get("id"));
  if (!id) return Response.json({ error: "Time entry ID is required" }, { status: 400 });
  const [entry] = await sql`DELETE FROM time_tracking WHERE id = ${id} RETURNING id, project_id, team_member_id`;
  if (!entry) return Response.json({ error: "Time entry not found" }, { status: 404 });
  await auditLog({ request, action: "time_entry.delete", userId: user.id, username: user.username, resource: "time_entry", resourceId: id, changes: { project_id: entry.project_id, team_member_id: entry.team_member_id }, status: "success" });
  return Response.json({ message: "Time entry deleted successfully" });
}
