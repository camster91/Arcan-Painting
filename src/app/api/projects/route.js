import sql from "@/app/api/utils/sql";

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(";").forEach((pair) => {
    const [k, v] = pair.split("=");
    if (!k) return;
    cookies[k.trim()] = decodeURIComponent((v || "").trim());
  });
  return cookies;
}

async function getCurrentUser(request) {
  // Try Authorization: Bearer <token>
  const authHeader =
    request.headers.get("Authorization") ||
    request.headers.get("authorization");
  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    const token = authHeader.slice(7);
    const sessions =
      await sql`SELECT * FROM auth_sessions WHERE token = ${token} AND expires_at > NOW()`;
    if (sessions.length) {
      const users =
        await sql`SELECT id, username, role FROM auth_users WHERE id = ${sessions[0].user_id} LIMIT 1`;
      if (users.length) return users[0];
    }
  }
  // Fallback to cookie-based session
  const cookies = parseCookies(request.headers.get("cookie"));
  const cookieToken = cookies["admin_session"];
  if (!cookieToken) return null;
  const rows = await sql`
    SELECT u.id, u.username, u.role, s.expires_at
    FROM auth_sessions s
    JOIN auth_users u ON u.id = s.user_id
    WHERE s.token = ${cookieToken}
    LIMIT 1
  `;
  const user = rows[0];
  if (!user) return null;
  const nowIso = new Date().toISOString();
  if (user.expires_at && user.expires_at < nowIso) {
    await sql`DELETE FROM auth_sessions WHERE token = ${cookieToken}`;
    return null;
  }
  return { id: user.id, username: user.username, role: user.role };
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

    // Role-based filtering
    if (user.role !== "owner") {
      // Painters only see their assigned projects
      query += ` AND tm.email = $${params.length + 1}`;
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

    return Response.json({
      success: true,
      projects: projects || [],
    });
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
    if (user.role !== "owner") {
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
        SELECT id, lead_id FROM estimates WHERE id = ${estimate_id}
      `;
      if (!estimateCheck || estimateCheck.length === 0) {
        return Response.json(
          { success: false, error: "Estimate not found" },
          { status: 404 },
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
    let projectCheck;
    if (user.role === "owner") {
      projectCheck = await sql`SELECT id FROM projects WHERE id = ${id}`;
    } else {
      // Painters can only update their assigned projects
      projectCheck = await sql`
        SELECT p.id FROM projects p
        LEFT JOIN team_members tm ON p.assigned_painter_id = tm.id
        WHERE p.id = ${id} AND tm.email = ${user.username}
      `;
    }

    if (!projectCheck || projectCheck.length === 0) {
      return Response.json(
        { success: false, error: "Project not found or access denied" },
        { status: 404 },
      );
    }

    // Build dynamic update query based on user role
    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;

    // Owner can update all fields
    if (user.role === "owner") {
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

    return Response.json({
      success: true,
      message: "Project updated successfully",
      project: updatedProject,
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
    if (user.role !== "owner") {
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
