import sql from "@/app/api/utils/sql";
import { getCurrentUser } from "@/app/api/utils/auth";
import { generalLimiter } from "@/app/api/utils/rate-limit";

export async function GET(request) {
  const limited = generalLimiter(request);
  if (limited) return limited;
  const user = await getCurrentUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const [member] =
    await sql`SELECT id, name, email, role FROM team_members WHERE LOWER(email) = LOWER(${user.username}) AND status = 'active' LIMIT 1`;
  if (!member && user.role !== "owner")
    return Response.json(
      { error: "Your account is not linked to an active field team member" },
      { status: 409 },
    );

  const values = [];
  let assignment = "";
  if (user.role !== "owner") {
    values.push(member.id);
    assignment = `AND (p.assigned_painter_id = $${values.length} OR EXISTS (SELECT 1 FROM project_crew_members pcm WHERE pcm.project_id = p.id AND pcm.team_member_id = $${values.length} AND pcm.removed_at IS NULL))`;
  }
  const projects = await sql(
    `
    SELECT p.id, p.lead_id, p.project_name, p.start_date, p.end_date, p.status,
      p.completion_percentage, p.assigned_painter_id, p.crew_assigned, p.site_lat, p.site_lng,
      l.name AS lead_name, l.phone AS lead_phone, l.address,
      tm.name AS painter_name,
      COALESCE((SELECT STRING_AGG(ctm.name, ', ' ORDER BY ctm.name) FROM project_crew_members pcm JOIN team_members ctm ON ctm.id = pcm.team_member_id WHERE pcm.project_id = p.id AND pcm.removed_at IS NULL), '') AS crew_names,
      COUNT(DISTINCT cw.id)::int AS checklist_total,
      COUNT(DISTINCT cw.id) FILTER (WHERE cw.is_completed = TRUE)::int AS checklist_completed,
      MAX(pp.report_date) AS last_report_date,
      COUNT(DISTINCT pi.id) FILTER (WHERE pi.status IN ('open', 'in_progress'))::int AS open_issue_count,
      COUNT(DISTINCT pi.id) FILTER (WHERE pi.status IN ('open', 'in_progress') AND pi.severity IN ('critical', 'high'))::int AS urgent_issue_count,
      (SELECT jsonb_build_object(
        'project_description', e.project_description,
        'estimate_notes', e.notes,
        'areas', COALESCE((SELECT jsonb_agg(jsonb_build_object(
          'name', ea.name,
          'notes', ea.notes,
          'exclusions', ea.exclusions,
          'production_assumptions', ea.production_assumptions,
          'surfaces', COALESCE((SELECT jsonb_agg(jsonb_build_object(
            'surface_type', es.surface_type,
            'measurement', es.measurement,
            'unit', es.unit,
            'method', es.method,
            'coats', es.coats,
            'primer', es.primer,
            'coating_product', es.coating_product,
            'color_name', es.color_name,
            'sheen', es.sheen
          ) ORDER BY es.id) FROM estimate_surfaces es WHERE es.area_id = ea.id), '[]'::jsonb),
          'prep_items', COALESCE((SELECT jsonb_agg(jsonb_build_object(
            'prep_type', epi.prep_type,
            'quantity', epi.quantity,
            'unit', epi.unit
          ) ORDER BY epi.id) FROM estimate_prep_items epi WHERE epi.area_id = ea.id), '[]'::jsonb)
        ) ORDER BY ea.id) FROM estimate_areas ea WHERE ea.estimate_id = e.id), '[]'::jsonb)
      ) FROM estimates e WHERE e.id = p.estimate_id) AS job_scope,
      CASE WHEN p.status = 'in_progress' THEN 'active'
        WHEN p.start_date < CURRENT_DATE THEN 'overdue_start' ELSE 'scheduled_today' END AS schedule_state
    FROM projects p
    LEFT JOIN leads l ON l.id = p.lead_id
    LEFT JOIN team_members tm ON tm.id = p.assigned_painter_id
    LEFT JOIN completion_workflows cw ON cw.project_id = p.id
    LEFT JOIN project_progress pp ON pp.project_id = p.id
    LEFT JOIN project_issues pi ON pi.project_id = p.id
    WHERE (p.status = 'in_progress' OR (p.status = 'scheduled' AND p.start_date IS NOT NULL AND p.start_date <= CURRENT_DATE))
      ${assignment}
    GROUP BY p.id, l.name, l.phone, l.address, tm.name
    ORDER BY CASE WHEN p.status = 'in_progress' THEN 0 ELSE 1 END, p.start_date NULLS LAST, p.project_name
  `,
    values,
  );
  const [activeEntry] = member
    ? await sql`
    SELECT tt.*, p.project_name FROM time_tracking tt LEFT JOIN projects p ON p.id = tt.project_id
    WHERE tt.team_member_id = ${member.id} AND tt.status = 'active' ORDER BY tt.clock_in_time DESC LIMIT 1
  `
    : [];
  return Response.json({
    date: new Date().toISOString().slice(0, 10),
    can_manage: user.role === "owner",
    team_member: member || null,
    projects,
    active_time_entry: activeEntry || null,
  });
}
