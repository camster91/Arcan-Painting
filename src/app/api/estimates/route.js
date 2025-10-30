import sql from "@/app/api/utils/sql";

// Auth helpers
async function ensureAuthTables() {
  await sql`
    CREATE TABLE IF NOT EXISTS auth_users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'admin',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS auth_sessions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES auth_users(id) ON DELETE CASCADE,
      token VARCHAR(255) UNIQUE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      expires_at TIMESTAMP NOT NULL
    )
  `;
}
function parseCookies(h) {
  const out = {};
  if (!h) return out;
  h.split(";").forEach((p) => {
    const [k, v] = p.split("=");
    if (!k) return;
    out[k.trim()] = decodeURIComponent((v || "").trim());
  });
  return out;
}
// BEGIN: new helper that also accepts Authorization: Bearer
async function getCurrentUser(request) {
  try {
    await ensureAuthTables();
  } catch {}
  // Try Authorization header first
  const authHeader = request.headers.get("authorization");
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
  // Fallback to cookie-based admin session
  const cookies = parseCookies(request.headers.get("cookie"));
  const token = cookies["admin_session"];
  if (!token) return null;
  const rows = await sql`
    SELECT u.id, u.username, u.role, s.expires_at
    FROM auth_sessions s
    JOIN auth_users u ON u.id = s.user_id
    WHERE s.token = ${token}
    LIMIT 1
  `;
  const user = rows[0];
  if (!user) return null;
  const nowIso = new Date().toISOString();
  if (user.expires_at && user.expires_at < nowIso) {
    await sql`DELETE FROM auth_sessions WHERE token = ${token}`;
    return null;
  }
  return { id: user.id, username: user.username, role: user.role };
}

// GET /api/estimates - Get all estimates with optional filtering (role-aware)
export async function GET(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const leadId = searchParams.get("lead_id");

    let query = `
      SELECT 
        e.*,
        l.name as lead_name,
        l.email as lead_email,
        l.phone as lead_phone,
        l.service_type as lead_service_type
      FROM estimates e
      LEFT JOIN leads l ON e.lead_id = l.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ` AND e.status = $${params.length + 1}`;
      params.push(status);
    }

    if (leadId) {
      query += ` AND e.lead_id = $${params.length + 1}`;
      params.push(parseInt(leadId));
    }

    // If not owner, limit to estimates created by this user
    if (user.role !== "owner") {
      query += ` AND (e.created_by = $${params.length + 1})`;
      params.push(user.username);
    }

    query += ` ORDER BY e.created_at DESC`;

    const estimates = await sql(query, params);

    return Response.json({
      success: true,
      estimates: estimates || [],
    });
  } catch (error) {
    console.error("Error fetching estimates:", error);
    return Response.json(
      { success: false, error: "Failed to fetch estimates" },
      { status: 500 },
    );
  }
}

// Helper to generate estimate number when not provided
function generateEstimateNumber() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  const r = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `EST-${y}${m}${da}-${r}`;
}

// POST /api/estimates - Create a new estimate (owner + leads)
export async function POST(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    // Only owners and lead roles can create estimates
    const allowed = ["owner", "lead_painter", "supervisor", "admin"];
    if (!allowed.includes(user.role)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    const {
      lead_id,
      estimate_number,
      project_title,
      project_description,
      labor_cost,
      material_cost,
      total_cost,
      estimated_duration_days,
      valid_until,
      notes,
      created_by,
    } = body;

    // Validate required minimal fields
    if (!lead_id || !project_title) {
      return Response.json(
        { success: false, error: "Missing required fields" },
        { status: 400 },
      );
    }

    const finalEstimateNumber = estimate_number || generateEstimateNumber();

    // Verify the lead exists
    const leadCheck = await sql`SELECT id FROM leads WHERE id = ${lead_id}`;
    if (!leadCheck || leadCheck.length === 0) {
      return Response.json(
        { success: false, error: "Lead not found" },
        { status: 404 },
      );
    }

    // Check if estimate number already exists
    const existingEstimate =
      await sql`SELECT id FROM estimates WHERE estimate_number = ${finalEstimateNumber}`;
    if (existingEstimate && existingEstimate.length > 0) {
      return Response.json(
        { success: false, error: "Estimate number already exists" },
        { status: 409 },
      );
    }

    // Insert the new estimate
    const result = await sql`
      INSERT INTO estimates (
        lead_id,
        estimate_number,
        project_title,
        project_description,
        labor_cost,
        material_cost,
        total_cost,
        estimated_duration_days,
        status,
        valid_until,
        notes,
        created_by,
        created_at,
        updated_at
      ) VALUES (
        ${lead_id},
        ${finalEstimateNumber},
        ${project_title},
        ${project_description || null},
        ${labor_cost !== undefined ? parseFloat(labor_cost) : 0},
        ${material_cost !== undefined ? parseFloat(material_cost) : 0},
        ${total_cost !== undefined ? parseFloat(total_cost) : 0},
        ${estimated_duration_days ? parseInt(estimated_duration_days) : null},
        'draft',
        ${valid_until || null},
        ${notes || null},
        ${created_by || user.username},
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
      RETURNING id, estimate_number, project_title, total_cost, status, created_at
    `;

    const newEstimate = result[0];

    return Response.json(
      {
        success: true,
        message: "Estimate created successfully",
        estimate: newEstimate,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating estimate:", error);
    return Response.json(
      { success: false, error: "Failed to create estimate" },
      { status: 500 },
    );
  }
}

// PUT /api/estimates - Update an existing estimate (role-aware)
export async function PUT(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const allowed = ["owner", "lead_painter", "supervisor", "admin"];
    if (!allowed.includes(user.role)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    const {
      id,
      project_title,
      project_description,
      labor_cost,
      material_cost,
      total_cost,
      estimated_duration_days,
      status,
      valid_until,
      notes,
    } = body;

    if (!id) {
      return Response.json(
        { success: false, error: "Estimate ID is required" },
        { status: 400 },
      );
    }

    // Verify the estimate exists and ownership if non-owner
    const existingEstimate =
      await sql`SELECT id, created_by FROM estimates WHERE id = ${id}`;
    if (!existingEstimate || existingEstimate.length === 0) {
      return Response.json(
        { success: false, error: "Estimate not found" },
        { status: 404 },
      );
    }
    if (
      user.role !== "owner" &&
      existingEstimate[0].created_by !== user.username
    ) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    // Build dynamic update query
    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;

    if (project_title !== undefined) {
      updateFields.push(`project_title = $${paramCount}`);
      updateValues.push(project_title);
      paramCount++;
    }

    if (project_description !== undefined) {
      updateFields.push(`project_description = $${paramCount}`);
      updateValues.push(project_description);
      paramCount++;
    }

    if (labor_cost !== undefined) {
      updateFields.push(`labor_cost = $${paramCount}`);
      updateValues.push(parseFloat(labor_cost));
      paramCount++;
    }

    if (material_cost !== undefined) {
      updateFields.push(`material_cost = $${paramCount}`);
      updateValues.push(parseFloat(material_cost));
      paramCount++;
    }

    if (total_cost !== undefined) {
      updateFields.push(`total_cost = $${paramCount}`);
      updateValues.push(parseFloat(total_cost));
      paramCount++;
    }

    if (estimated_duration_days !== undefined) {
      updateFields.push(`estimated_duration_days = $${paramCount}`);
      updateValues.push(
        estimated_duration_days ? parseInt(estimated_duration_days) : null,
      );
      paramCount++;
    }

    if (status !== undefined) {
      updateFields.push(`status = $${paramCount}`);
      updateValues.push(status);
      paramCount++;
    }

    if (valid_until !== undefined) {
      updateFields.push(`valid_until = $${paramCount}`);
      updateValues.push(valid_until);
      paramCount++;
    }

    if (notes !== undefined) {
      updateFields.push(`notes = $${paramCount}`);
      updateValues.push(notes);
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
      UPDATE estimates 
      SET ${updateFields.join(", ")}
      WHERE id = $${paramCount}
      RETURNING id, estimate_number, project_title, total_cost, status, updated_at
    `;

    const result = await sql(updateQuery, updateValues);
    const updatedEstimate = result[0];

    return Response.json({
      success: true,
      message: "Estimate updated successfully",
      estimate: updatedEstimate,
    });
  } catch (error) {
    console.error("Error updating estimate:", error);
    return Response.json(
      { success: false, error: "Failed to update estimate" },
      { status: 500 },
    );
  }
}

// DELETE remains admin/owner-only and cookie or bearer works via getCurrentUser
export async function DELETE(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "owner") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return Response.json(
        { success: false, error: "Estimate ID is required" },
        { status: 400 },
      );
    }

    // Check if estimate exists
    const existingEstimate = await sql`
      SELECT id, estimate_number, project_title 
      FROM estimates 
      WHERE id = ${id}
    `;
    if (!existingEstimate || existingEstimate.length === 0) {
      return Response.json(
        { success: false, error: "Estimate not found" },
        { status: 404 },
      );
    }

    // Delete related records first (due to foreign key constraints)
    await sql`DELETE FROM projects WHERE estimate_id = ${id}`;

    // Delete the estimate
    await sql`DELETE FROM estimates WHERE id = ${id}`;

    return Response.json({
      success: true,
      message: `Estimate "${existingEstimate[0].estimate_number}" (${existingEstimate[0].project_title}) has been deleted successfully`,
    });
  } catch (error) {
    console.error("Error deleting estimate:", error);
    return Response.json(
      { success: false, error: "Failed to delete estimate" },
      { status: 500 },
    );
  }
}
