import sql from "@/app/api/utils/sql";
import { createNotification } from "@/app/api/notifications/route";
import { getCurrentUser } from "@/app/api/utils/auth";
import { shouldNotifyCustomerProgress } from "@/app/api/utils/customer-portal";
import { auditLog } from "@/app/api/utils/audit";

async function canAccessProject(user, projectId) {
  if (!user || !Number.isInteger(Number(projectId))) return false;
  if (["owner", "admin"].includes(user.role)) return true;
  const rows = await sql`SELECT p.id FROM projects p JOIN team_members tm ON tm.id = p.assigned_painter_id WHERE p.id = ${Number(projectId)} AND LOWER(tm.email) = LOWER(${user.username})`;
  return rows.length > 0;
}

const memberList = (value) => Array.isArray(value) ? value : typeof value === "string" ? value.split(",").map((item) => item.trim()).filter(Boolean) : [];

export async function GET(request) {
  const user = await getCurrentUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const project_id = searchParams.get("project_id");
    const start_date = searchParams.get("start_date");
    const end_date = searchParams.get("end_date");
    if (!["owner", "admin"].includes(user.role) && !project_id) return Response.json({ error: "project_id is required" }, { status: 400 });
    if (project_id && !(await canAccessProject(user, parseInt(project_id)))) return Response.json({ error: "Forbidden" }, { status: 403 });

    let whereConditions = [];
    let params = [];
    let paramCount = 0;

    if (project_id) {
      paramCount++;
      whereConditions.push(`pp.project_id = $${paramCount}`);
      params.push(parseInt(project_id));
    }

    if (start_date && end_date) {
      paramCount++;
      whereConditions.push(`DATE(pp.report_date) >= $${paramCount}`);
      params.push(start_date);
      paramCount++;
      whereConditions.push(`DATE(pp.report_date) <= $${paramCount}`);
      params.push(end_date);
    }

    const whereClause =
      whereConditions.length > 0
        ? "WHERE " + whereConditions.join(" AND ")
        : "";

    const progressReports = await sql(
      `
      SELECT 
        pp.*,
        p.project_name,
        tm.name as reported_by_name
      FROM project_progress pp
      JOIN projects p ON pp.project_id = p.id
      LEFT JOIN team_members tm ON pp.reported_by = tm.name::text OR pp.reported_by = tm.id::text
      ${whereClause}
      ORDER BY pp.report_date DESC, pp.created_at DESC
    `,
      params,
    );

    return Response.json({ progressReports });
  } catch (error) {
    console.error("Error fetching project progress:", error);
    return Response.json(
      { error: "Failed to fetch project progress" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  const user = await getCurrentUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const {
      project_id,
      report_date,
      work_description,
      progress_percentage,
      hours_worked,
      team_members_present,
      materials_used,
      challenges_faced,
      next_steps,
      weather_conditions,
      client_interaction,
      quality_notes,
      photos = [],
      reported_by,
      is_milestone = false,
      milestone_description,
      customer_visible = false,
    } = body;

    if (!project_id || !report_date || !work_description) {
      return Response.json(
        {
          error: "Project ID, report date, and work description are required",
        },
        { status: 400 },
      );
    }
    if (!(await canAccessProject(user, Number(project_id)))) return Response.json({ error: "Forbidden" }, { status: 403 });
    const percentage = Number(progress_percentage);
    if (progress_percentage != null && (!Number.isFinite(percentage) || percentage < 0 || percentage > 100)) return Response.json({ error: "Progress must be between 0 and 100" }, { status: 400 });
    const hours = hours_worked === "" || hours_worked == null ? null : Number(hours_worked);
    if (hours != null && (!Number.isFinite(hours) || hours < 0 || hours > 24)) return Response.json({ error: "Hours worked must be between 0 and 24" }, { status: 400 });

    const result = await sql`
      INSERT INTO project_progress (
        project_id, report_date, work_description, progress_percentage,
        hours_worked, team_members_present, materials_used, challenges_faced,
        next_steps, weather_conditions, client_interaction, quality_notes,
        photos, reported_by, is_milestone, milestone_description, customer_visible
      ) VALUES (
        ${project_id}, ${report_date}, ${work_description.trim()}, ${progress_percentage == null ? null : percentage},
        ${hours}, ${JSON.stringify(memberList(team_members_present))}, ${materials_used}, ${challenges_faced},
        ${next_steps}, ${weather_conditions}, ${client_interaction}, ${quality_notes},
        ${JSON.stringify(photos)}, ${user.role === "owner" && reported_by ? reported_by : user.username}, ${is_milestone}, ${milestone_description}, ${Boolean(customer_visible)}
      )
      RETURNING *
    `;
    await auditLog({ request, action: "project_progress.create", userId: user.id, username: user.username, resource: "project_progress", resourceId: result[0].id, changes: { project_id: Number(project_id), progress_percentage: percentage, customer_visible: Boolean(customer_visible) }, status: "success" });

    // Update project completion percentage if provided
    if (progress_percentage !== null && progress_percentage !== undefined) {
      await sql`
        UPDATE projects 
        SET completion_percentage = ${progress_percentage},
            last_progress_update = CURRENT_TIMESTAMP,
            progress_notes = ${work_description}
        WHERE id = ${project_id}
      `;
    }

    // Get project and client details for notification
    const projectDetails = await sql`
      SELECT p.*, l.name as client_name, l.email as client_email
      FROM projects p
      LEFT JOIN leads l ON p.lead_id = l.id
      WHERE p.id = ${project_id}
    `;

    // Send notification to client if significant progress or milestone
    if (
      projectDetails.length > 0 &&
      shouldNotifyCustomerProgress({ customerVisible: customer_visible, isMilestone: is_milestone, progressPercentage: progress_percentage })
    ) {
      const project = projectDetails[0];

      if (project.client_email) {
        try {
          await createNotification({
              type: "project",
              title: is_milestone
                ? "Project Milestone Reached"
                : "Project Progress Update",
              message: is_milestone
                ? `Great news! We've reached a milestone on your project: ${milestone_description}`
                : `Your painting project is ${progress_percentage}% complete. Today's work: ${work_description}`,
              email: project.client_email,
              related_id: project_id,
              related_type: "project",
              send_email: true,
              data: {
                project_name: project.project_name,
                progress_percentage,
                photos: photos.slice(0, 3), // Include up to 3 photos in email
              },
          });
        } catch (notificationError) {
          console.error(
            "Error sending progress notification:",
            notificationError,
          );
        }
      }
    }

    return Response.json({ progressReport: result[0] }, { status: 201 });
  } catch (error) {
    console.error("Error creating progress report:", error);
    return Response.json(
      { error: "Failed to create progress report" },
      { status: 500 },
    );
  }
}

export async function PUT(request) {
  const user = await getCurrentUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { id, ...updateFields } = body;

    if (!id) {
      return Response.json(
        { error: "Progress report ID is required" },
        { status: 400 },
      );
    }
    const [existing] = await sql`SELECT project_id FROM project_progress WHERE id = ${id}`;
    if (!existing || !(await canAccessProject(user, existing.project_id))) return Response.json({ error: "Progress report not found or access denied" }, { status: 404 });

    const allowedFields = [
      "work_description",
      "progress_percentage",
      "hours_worked",
      "team_members_present",
      "materials_used",
      "challenges_faced",
      "next_steps",
      "weather_conditions",
      "client_interaction",
      "quality_notes",
      "photos",
      "is_milestone",
      "milestone_description",
      "customer_visible",
    ];

    const setClause = [];
    const values = [];
    let paramCount = 0;

    Object.entries(updateFields).forEach(([field, value]) => {
      if (allowedFields.includes(field) && value !== undefined) {
        paramCount++;
        if (field === "photos" || field === "team_members_present") {
          setClause.push(`${field} = $${paramCount}`);
          values.push(JSON.stringify(field === "photos" ? value : memberList(value)));
        } else {
          setClause.push(`${field} = $${paramCount}`);
          values.push(value);
        }
      }
    });

    if (setClause.length === 0) {
      return Response.json(
        { error: "No valid fields to update" },
        { status: 400 },
      );
    }

    paramCount++;
    setClause.push(`updated_at = $${paramCount}`);
    values.push(new Date().toISOString());

    paramCount++;
    values.push(id);

    const query = `
      UPDATE project_progress 
      SET ${setClause.join(", ")}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await sql(query, values);

    if (result.length === 0) {
      return Response.json(
        { error: "Progress report not found" },
        { status: 404 },
      );
    }

    await auditLog({ request, action: "project_progress.update", userId: user.id, username: user.username, resource: "project_progress", resourceId: id, changes: { fields: Object.keys(updateFields).filter((field) => allowedFields.includes(field)) }, status: "success" });

    return Response.json({ progressReport: result[0] });
  } catch (error) {
    console.error("Error updating progress report:", error);
    return Response.json(
      { error: "Failed to update progress report" },
      { status: 500 },
    );
  }
}

export async function DELETE(request) {
  const user = await getCurrentUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!["owner", "admin"].includes(user.role)) return Response.json({ error: "Owner access required" }, { status: 403 });

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return Response.json(
        { error: "Progress report ID is required" },
        { status: 400 },
      );
    }

    const result = await sql`
      DELETE FROM project_progress
      WHERE id = ${parseInt(id)}
      RETURNING id, project_id
    `;

    if (result.length === 0) {
      return Response.json(
        { error: "Progress report not found" },
        { status: 404 },
      );
    }

    await auditLog({ request, action: "project_progress.delete", userId: user.id, username: user.username, resource: "project_progress", resourceId: id, changes: { project_id: result[0].project_id }, status: "success" });

    return Response.json({ message: "Progress report deleted successfully" });
  } catch (error) {
    console.error("Error deleting progress report:", error);
    return Response.json(
      { error: "Failed to delete progress report" },
      { status: 500 },
    );
  }
}
