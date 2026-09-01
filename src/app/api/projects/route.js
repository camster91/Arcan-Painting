import sql from "@/app/api/utils/sql";
import { getCurrentUser } from "@/app/api/utils/auth";
import { hasPermission } from "@/app/api/utils/permissions";
import { auditLog } from "@/app/api/utils/audit";
import { queueEmailWorkflows } from "@/app/api/utils/email-workflows";

const projectTransitions = {
  scheduled: new Set(["in_progress", "paused", "cancelled"]),
  in_progress: new Set(["paused", "completed", "cancelled"]),
  paused: new Set(["in_progress", "cancelled"]),
  completed: new Set(),
  cancelled: new Set(),
};

export function canTransitionProject(from, to) {
  return from === to || Boolean(projectTransitions[from]?.has(to));
}

// GET /api/projects - Get all projects with role-based filtering
export async function GET(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const leadId = searchParams.get("lead_id");

    let query = `
      SELECT 
        p.*,
        l.name as lead_name,
        l.email as lead_email,
        l.phone as lead_phone,
        l.service_type as lead_service_type,
        e.estimate_number,
        tm.name as painter_name,
        tm.email as painter_email
      FROM projects p
      LEFT JOIN leads l ON p.lead_id = l.id
      LEFT JOIN estimates e ON p.estimate_id = e.id
      LEFT JOIN team_members tm ON p.assigned_painter_id = tm.id
      WHERE 1=1
    `;
    const params = [];

    const canReadAll = hasPermission(user, "projects.read");
    const canReadAssigned = hasPermission(user, "projects.assigned");
    if (!canReadAll && !canReadAssigned) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
    if (!canReadAll) {
      // Painters only see their assigned projects
      query += ` AND (LOWER(tm.email) = LOWER($${params.length + 1}) OR EXISTS (
        SELECT 1 FROM project_crew_members pcm JOIN team_members ctm ON ctm.id = pcm.team_member_id
        WHERE pcm.project_id = p.id AND pcm.removed_at IS NULL AND LOWER(ctm.email) = LOWER($${params.length + 1})
      ))`;
      params.push(user.username);
    }

    if (status) {
      query += ` AND p.status = $${params.length + 1}`;
      params.push(status);
    }

    if (leadId) {
      query += ` AND p.lead_id = $${params.length + 1}`;
      params.push(parseInt(leadId));
    }

    query += ` ORDER BY p.created_at DESC`;

    const projects = await sql(query, params);

    const responseBody = { success: true, projects: projects || [] };
    return Response.json(responseBody);
  } catch (error) {
    console.error("Error fetching projects:", error);
    return Response.json(
      { success: false, error: "Failed to fetch projects" },
      { status: 500 },
    );
  }
}

// POST /api/projects - Create a new project (owners only)
export async function POST(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!hasPermission(user, "projects.write")) {
      return Response.json(
        { error: "Forbidden - Owners only" },
        { status: 403 },
      );
    }

    const body = await request.json();

    const {
      estimate_id,
      project_name,
      start_date,
      end_date,
      assigned_painter_id,
      crew_assigned,
      notes,
      final_cost,
      // NEW: optional site coordinates on create
      site_lat,
      site_lng,
    } = body;

    // Validate required fields
    if (!project_name) {
      return Response.json(
        { success: false, error: "Project name is required" },
        { status: 400 },
      );
    }

    let lead_id = null;

    // If estimate_id is provided, verify it exists and get the lead_id
    if (estimate_id) {
      const estimateCheck = await sql`
        SELECT e.id, e.lead_id, e.status,
          EXISTS (SELECT 1 FROM projects p WHERE p.estimate_id = e.id) AS already_converted
        FROM estimates e WHERE e.id = ${estimate_id}
      `;
      if (!estimateCheck || estimateCheck.length === 0) {
        return Response.json(
          { success: false, error: "Estimate not found" },
          { status: 404 },
        );
      }
      if (estimateCheck[0].status !== "approved") {
        return Response.json(
          { success: false, error: "Approve the estimate before creating its project" },
          { status: 409 },
        );
      }
      if (estimateCheck[0].already_converted) {
        return Response.json(
          { success: false, error: "This estimate already has a project" },
          { status: 409 },
        );
      }
      lead_id = estimateCheck[0].lead_id;
    }

    // Insert the new project
    const result = await sql`
      INSERT INTO projects (
        estimate_id,
        lead_id,
        project_name,
        start_date,
        end_date,
        status,
        final_cost,
        completion_percentage,
        assigned_painter_id,
        crew_assigned,
        notes,
        site_lat,
        site_lng,
        created_at,
        updated_at
      ) VALUES (
        ${estimate_id || null},
        ${lead_id},
        ${project_name},
        ${start_date || null},
        ${end_date || null},
        'scheduled',
        ${final_cost ? parseFloat(final_cost) : null},
        0,
        ${assigned_painter_id || null},
        ${crew_assigned || null},
        ${notes || null},
        ${site_lat !== undefined && site_lat !== null ? Number(site_lat) : null},
        ${site_lng !== undefined && site_lng !== null ? Number(site_lng) : null},
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
      RETURNING id, project_name, status, final_cost, created_at
    `;

    const newProject = result[0];

    await auditLog({
      request,
      action: "project.create",
      userId: user.id,
      username: user.username,
      resource: "project",
      resourceId: newProject.id,
      changes: { estimate_id: estimate_id || null, lead_id, status: newProject.status },
      status: "success",
    });

    return Response.json(
      {
        success: true,
        message: "Project created successfully",
        project: newProject,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating project:", error);
    return Response.json(
      { success: false, error: "Failed to create project" },
      { status: 500 },
    );
  }
}

// PUT /api/projects - Update project with role-based permissions
export async function PUT(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const {
      id,
      project_name,
      start_date,
      end_date,
      actual_duration_days,
      status,
      final_cost,
      completion_percentage,
      assigned_painter_id,
      crew_assigned,
      notes,
      // NEW: coords updatable
      site_lat,
      site_lng,
    } = body;

    if (!id) {
      return Response.json(
        { success: false, error: "Project ID is required" },
        { status: 400 },
      );
    }

    // Verify the project exists and user has access
    const canManageProject = hasPermission(user, "projects.write");
    const canWorkAssigned = hasPermission(user, "field.write");
    if (!canManageProject && !canWorkAssigned) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
    let projectCheck;
    if (canManageProject) {
      projectCheck = await sql`
        SELECT p.id, p.status, p.project_name, l.name AS lead_name, l.email AS lead_email
        FROM projects p LEFT JOIN leads l ON p.lead_id = l.id WHERE p.id = ${id}
      `;
    } else {
      // Painters can only update their assigned projects
      projectCheck = await sql`
        SELECT p.id, p.status, p.project_name, l.name AS lead_name, l.email AS lead_email FROM projects p
        LEFT JOIN team_members tm ON p.assigned_painter_id = tm.id
        LEFT JOIN leads l ON p.lead_id = l.id
        WHERE p.id = ${id} AND (LOWER(tm.email) = LOWER(${user.username}) OR EXISTS (
          SELECT 1 FROM project_crew_members pcm JOIN team_members ctm ON ctm.id = pcm.team_member_id
          WHERE pcm.project_id = p.id AND pcm.removed_at IS NULL AND LOWER(ctm.email) = LOWER(${user.username})
        ))
      `;
    }

    if (!projectCheck || projectCheck.length === 0) {
      return Response.json(
        { success: false, error: "Project not found or access denied" },
        { status: 404 },
      );
    }
    const previousProject = projectCheck[0];
    if (status !== undefined && !canTransitionProject(previousProject.status, status)) {
      return Response.json(
        { success: false, error: `Project cannot move from ${previousProject.status} to ${status}` },
        { status: 409 },
      );
    }

    // Build dynamic update query based on user role
    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;

    // Owner can update all fields
    if (canManageProject) {
      if (project_name !== undefined) {
        updateFields.push(`project_name = $${paramCount}`);
        updateValues.push(project_name);
        paramCount++;
      }

      if (start_date !== undefined) {
        updateFields.push(`start_date = $${paramCount}`);
        updateValues.push(start_date);
        paramCount++;
      }

      if (end_date !== undefined) {
        updateFields.push(`end_date = $${paramCount}`);
        updateValues.push(end_date);
        paramCount++;
      }

      if (actual_duration_days !== undefined) {
        updateFields.push(`actual_duration_days = $${paramCount}`);
        updateValues.push(
          actual_duration_days ? parseInt(actual_duration_days) : null,
        );
        paramCount++;
      }

      if (final_cost !== undefined) {
        updateFields.push(`final_cost = $${paramCount}`);
        updateValues.push(final_cost ? parseFloat(final_cost) : null);
        paramCount++;
      }

      if (assigned_painter_id !== undefined) {
        updateFields.push(`assigned_painter_id = $${paramCount}`);
        updateValues.push(assigned_painter_id);
        paramCount++;
      }

      if (crew_assigned !== undefined) {
        updateFields.push(`crew_assigned = $${paramCount}`);
        updateValues.push(crew_assigned);
        paramCount++;
      }

      if (notes !== undefined) {
        updateFields.push(`notes = $${paramCount}`);
        updateValues.push(notes);
        paramCount++;
      }

      // NEW: allow updating site coordinates
      if (site_lat !== undefined) {
        updateFields.push(`site_lat = $${paramCount}`);
        updateValues.push(site_lat !== null ? Number(site_lat) : null);
        paramCount++;
      }
      if (site_lng !== undefined) {
        updateFields.push(`site_lng = $${paramCount}`);
        updateValues.push(site_lng !== null ? Number(site_lng) : null);
        paramCount++;
      }
    }

    // Both owners and painters can update status and completion
    if (status !== undefined) {
      updateFields.push(`status = $${paramCount}`);
      updateValues.push(status);
      paramCount++;
    }

    if (completion_percentage !== undefined) {
      updateFields.push(`completion_percentage = $${paramCount}`);
      updateValues.push(
        Math.min(Math.max(parseInt(completion_percentage) || 0, 0), 100),
      );
      paramCount++;
    }

    if (updateFields.length === 0) {
      return Response.json(
        { success: false, error: "No fields to update" },
        { status: 400 },
      );
    }

    // Add updated_at
    updateFields.push(`updated_at = $${paramCount}`);
    updateValues.push(new Date().toISOString());
    paramCount++;

    // Add id for WHERE clause
    updateValues.push(id);

    const updateQuery = `
      UPDATE projects 
      SET ${updateFields.join(", ")}
      WHERE id = $${paramCount}
      RETURNING id, project_name, status, completion_percentage, final_cost, updated_at
    `;

    const result = await sql(updateQuery, updateValues);
    const updatedProject = result[0];

    await auditLog({
      request,
      action: "project.update",
      userId: user.id,
      username: user.username,
      resource: "project",
      resourceId: id,
      changes: { from_status: previousProject.status, to_status: updatedProject.status, completion_percentage },
      status: "success",
    });

    let automation = { enabled: process.env.EMAIL_AUTOMATIONS_ENABLED === "true", queued: 0 };
    if (previousProject.status !== "in_progress" && updatedProject.status === "in_progress") {
      automation = await queueEmailWorkflows({
        event: "project_start",
        recipientEmail: previousProject.lead_email,
        relatedType: "project",
        relatedId: id,
        data: { lead_name: previousProject.lead_name, project_title: updatedProject.project_name },
      });
    }

    return Response.json({
      success: true,
      message: "Project updated successfully",
      project: updatedProject,
      automation,
    });
  } catch (error) {
    console.error("Error updating project:", error);
    return Response.json(
      { success: false, error: "Failed to update project" },
      { status: 500 },
    );
  }
}

// DELETE /api/projects - Delete a project (owners only)
export async function DELETE(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!hasPermission(user, "projects.write")) {
      return Response.json(
        { error: "Forbidden - Owners only" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return Response.json(
        { success: false, error: "Project ID is required" },
        { status: 400 },
      );
    }

    // Verify the project exists
    const existingProject =
      await sql`SELECT id, project_name FROM projects WHERE id = ${id}`;
    if (!existingProject || existingProject.length === 0) {
      return Response.json(
        { success: false, error: "Project not found" },
        { status: 404 },
      );
    }

    // Delete the project
    await sql`DELETE FROM projects WHERE id = ${id}`;

    return Response.json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting project:", error);
    return Response.json(
      { success: false, error: "Failed to delete project" },
      { status: 500 },
    );
  }
}
