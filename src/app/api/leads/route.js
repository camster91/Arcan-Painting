import sql from "../utils/sql.js";

// Helper: ensure local auth tables exist
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

async function requireAdmin(request) {
  try {
    await ensureAuthTables();
  } catch {}
  const cookieHeader = request.headers.get("cookie");
  const cookies = parseCookies(cookieHeader);
  const token = cookies["admin_session"];
  if (!token) return false;
  const rows = await sql`
    SELECT u.id, s.expires_at FROM auth_sessions s
    JOIN auth_users u ON u.id = s.user_id
    WHERE s.token = ${token}
    LIMIT 1
  `;
  const row = rows[0];
  if (!row) return false;
  const nowIso = new Date().toISOString();
  if (row.expires_at && row.expires_at < nowIso) {
    await sql`DELETE FROM auth_sessions WHERE token = ${token}`;
    return false;
  }
  return true;
}

// Create a new lead
export async function POST(request) {
  try {
    const body = await request.json();

    // Validate required fields
    const requiredFields = ["name", "email", "phone", "serviceType"];
    for (const field of requiredFields) {
      if (!body[field] || body[field].trim() === "") {
        return Response.json(
          { error: `${field} is required` },
          { status: 400 },
        );
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return Response.json({ error: "Invalid email format" }, { status: 400 });
    }

    // Validate phone format
    const phoneRegex = /^[\d\s\-\(\)\+]+$/;
    if (!body.phone || !phoneRegex.test(body.phone)) {
      return Response.json(
        { error: "Invalid phone number format" },
        { status: 400 },
      );
    }

    // Calculate follow-up date (24 hours from now)
    const followUpDate = new Date();
    followUpDate.setDate(followUpDate.getDate() + 1);

    // Insert new lead into database
    const rows = await sql`
      INSERT INTO leads (
        name, 
        email, 
        phone, 
        service_type, 
        project_description, 
        preferred_contact,
        status,
        lead_source,
        follow_up_date,
        address
      ) VALUES (
        ${body.name.trim()},
        ${body.email.trim().toLowerCase()},
        ${body.phone.trim()},
        ${body.serviceType},
        ${body.projectDescription || ""},
        ${body.preferredContact || "phone"},
        'new',
        'website',
        ${followUpDate.toISOString().split("T")[0]},
        ${body.address || ""}
      )
      RETURNING id, name, email, phone, service_type, status, created_at
    `;

    const newLead = rows[0];

    // Create initial follow-up task
    await sql`
      INSERT INTO follow_ups (
        lead_id,
        follow_up_date,
        follow_up_type,
        status,
        notes
      ) VALUES (
        ${newLead.id},
        ${followUpDate.toISOString().split("T")[0]},
        'phone_call',
        'pending',
        'Initial contact - respond to estimate request within 24 hours'
      )
    `;

    return Response.json({
      success: true,
      message: "Lead created successfully",
      lead: {
        id: newLead.id,
        name: newLead.name,
        email: newLead.email,
        phone: newLead.phone,
        serviceType: newLead.service_type,
        status: newLead.status,
        createdAt: newLead.created_at,
      },
    });
  } catch (error) {
    console.error("Error creating lead:", error);
    return Response.json(
      { error: "Failed to create lead. Please try again." },
      { status: 500 },
    );
  }
}

// Get all leads with filtering and pagination (ADMIN ONLY)
export async function GET(request) {
  try {
    const authorized = await requireAdmin(request);
    if (!authorized) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const page = parseInt(url.searchParams.get("page")) || 1;
    const limit = parseInt(url.searchParams.get("limit")) || 20;
    const search = url.searchParams.get("search");
    const offset = (page - 1) * limit;

    // Build dynamic query
    let queryParts = ["SELECT * FROM leads WHERE 1=1"];
    let queryValues = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      queryParts.push(`AND status = $${paramCount}`);
      queryValues.push(status);
    }

    if (search) {
      paramCount++;
      queryParts.push(`AND (
        LOWER(name) LIKE LOWER($${paramCount}) OR 
        LOWER(email) LIKE LOWER($${paramCount}) OR 
        LOWER(phone) LIKE LOWER($${paramCount}) OR
        LOWER(service_type) LIKE LOWER($${paramCount})
      )`);
      queryValues.push(`%${search}%`);
    }

    queryParts.push("ORDER BY created_at DESC");

    // Add pagination
    paramCount++;
    queryParts.push(`LIMIT $${paramCount}`);
    queryValues.push(limit);

    paramCount++;
    queryParts.push(`OFFSET $${paramCount}`);
    queryValues.push(offset);

    const query = queryParts.join(" ");
    const leads = await sql(query, queryValues);

    // Get total count for pagination
    let countQuery = "SELECT COUNT(*) as total FROM leads WHERE 1=1";
    let countValues = [];
    let countParamCount = 0;

    if (status) {
      countParamCount++;
      countQuery += ` AND status = $${countParamCount}`;
      countValues.push(status);
    }

    if (search) {
      countParamCount++;
      countQuery += ` AND (
        LOWER(name) LIKE LOWER($${countParamCount}) OR 
        LOWER(email) LIKE LOWER($${countParamCount}) OR 
        LOWER(phone) LIKE LOWER($${countParamCount}) OR
        LOWER(service_type) LIKE LOWER($${countParamCount})
      )`;
      countValues.push(`%${search}%`);
    }

    const countResult = await sql(countQuery, countValues);
    const total = parseInt(countResult[0].total);

    return Response.json({
      success: true,
      leads: leads,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching leads:", error);
    return Response.json({ error: "Failed to fetch leads" }, { status: 500 });
  }
}

// Update a lead (ADMIN ONLY)
export async function PUT(request) {
  try {
    const authorized = await requireAdmin(request);
    if (!authorized) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      id,
      name,
      email,
      phone,
      service_type,
      preferred_contact,
      status,
      lead_source,
      estimated_value,
      follow_up_date,
      address,
      project_description,
      notes,
    } = body;

    if (!id) {
      return Response.json({ error: "Lead ID is required" }, { status: 400 });
    }

    const exists = await sql`SELECT id FROM leads WHERE id = ${id}`;
    if (!exists || exists.length === 0) {
      return Response.json({ error: "Lead not found" }, { status: 404 });
    }

    const setClauses = [];
    const values = [];
    let i = 1;

    if (name !== undefined) {
      setClauses.push(`name = $${i++}`);
      values.push(name);
    }
    if (email !== undefined) {
      setClauses.push(`email = $${i++}`);
      values.push(email);
    }
    if (phone !== undefined) {
      setClauses.push(`phone = $${i++}`);
      values.push(phone);
    }
    if (service_type !== undefined) {
      setClauses.push(`service_type = $${i++}`);
      values.push(service_type);
    }
    if (preferred_contact !== undefined) {
      setClauses.push(`preferred_contact = $${i++}`);
      values.push(preferred_contact);
    }
    if (status !== undefined) {
      setClauses.push(`status = $${i++}`);
      values.push(status);
    }
    if (lead_source !== undefined) {
      setClauses.push(`lead_source = $${i++}`);
      values.push(lead_source);
    }
    if (estimated_value !== undefined) {
      setClauses.push(`estimated_value = $${i++}`);
      values.push(
        estimated_value === null ? null : parseFloat(estimated_value),
      );
    }
    if (follow_up_date !== undefined) {
      setClauses.push(`follow_up_date = $${i++}`);
      values.push(follow_up_date);
    }
    if (address !== undefined) {
      setClauses.push(`address = $${i++}`);
      values.push(address);
    }
    if (project_description !== undefined) {
      setClauses.push(`project_description = $${i++}`);
      values.push(project_description);
    }
    if (notes !== undefined) {
      setClauses.push(`notes = $${i++}`);
      values.push(notes);
    }

    if (setClauses.length === 0) {
      return Response.json({ error: "No fields to update" }, { status: 400 });
    }

    // updated_at if column exists (schema has updated_at)
    setClauses.push(`updated_at = $${i++}`);
    values.push(new Date().toISOString());

    // where id
    values.push(id);

    const query = `UPDATE leads SET ${setClauses.join(", ")} WHERE id = $${i} RETURNING *`;
    const result = await sql(query, values);

    return Response.json({ success: true, lead: result[0] });
  } catch (error) {
    console.error("Error updating lead:", error);
    return Response.json({ error: "Failed to update lead" }, { status: 500 });
  }
}

// Delete a lead (ADMIN ONLY)
export async function DELETE(request) {
  try {
    const authorized = await requireAdmin(request);
    if (!authorized) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return Response.json({ error: "Lead ID is required" }, { status: 400 });
    }

    // Check if lead exists
    const existingLead = await sql`SELECT id, name FROM leads WHERE id = ${id}`;
    if (!existingLead || existingLead.length === 0) {
      return Response.json({ error: "Lead not found" }, { status: 404 });
    }

    // IMPORTANT: delete in dependency order to satisfy FKs
    // 1) Delete follow-ups -> 2) Projects (FK to estimates) -> 3) Estimates -> 4) Appointments -> 5) Lead
    await sql`DELETE FROM follow_ups WHERE lead_id = ${id}`;
    await sql`DELETE FROM projects WHERE lead_id = ${id}`;
    await sql`DELETE FROM estimates WHERE lead_id = ${id}`;
    await sql`DELETE FROM appointments WHERE lead_id = ${id}`;

    // Delete the lead
    await sql`DELETE FROM leads WHERE id = ${id}`;

    return Response.json({
      success: true,
      message: `Lead "${existingLead[0].name}" has been deleted successfully`,
    });
  } catch (error) {
    console.error("Error deleting lead:", error);
    return Response.json({ error: "Failed to delete lead" }, { status: 500 });
  }
}
