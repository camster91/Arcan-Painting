import sql from "@/app/api/utils/sql";

// Helper function to parse cookies
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

// Helper function to check authentication using local auth system
async function checkAuth(request) {
  const cookieHeader = request.headers.get("cookie");
  const cookies = parseCookies(cookieHeader);
  const token = cookies["admin_session"];

  if (!token) {
    return null;
  }

  const rows = await sql`
    SELECT u.id, u.username, u.role, s.expires_at
    FROM auth_sessions s
    JOIN auth_users u ON u.id = s.user_id
    WHERE s.token = ${token}
    LIMIT 1
  `;
  const row = rows[0];

  if (!row) {
    return null;
  }

  const nowIso = new Date().toISOString();
  if (row.expires_at && row.expires_at < nowIso) {
    // Cleanup expired session
    await sql`DELETE FROM auth_sessions WHERE token = ${token}`;
    return null;
  }

  return { user: { id: row.id, username: row.username, role: row.role } };
}

// Generate contract number
function generateContractNumber() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const timestamp = Date.now().toString().slice(-4);
  return `CON-${year}${month}${day}-${timestamp}`;
}

// GET /api/contracts - List contracts with filtering
export async function GET(request) {
  try {
    const session = await checkAuth(request);
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const leadId = searchParams.get("lead_id");
    const projectId = searchParams.get("project_id");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit")) || 50;
    const offset = parseInt(searchParams.get("offset")) || 0;

    // Build the base query
    let whereConditions = [];
    let queryParts = [
      `
      SELECT 
        c.*,
        l.name as client_name,
        l.email as client_email,
        l.phone as client_phone,
        l.address as client_address,
        e.estimate_number,
        e.total_cost as estimate_total,
        p.project_name
      FROM contracts c
      LEFT JOIN leads l ON c.lead_id = l.id
      LEFT JOIN estimates e ON c.estimate_id = e.id
      LEFT JOIN projects p ON c.project_id = p.id
      WHERE 1=1
    `,
    ];

    // Add filters using tagged template syntax
    if (status && status !== "all") {
      whereConditions.push(sql`c.status = ${status}`);
    }

    if (leadId) {
      whereConditions.push(sql`c.lead_id = ${parseInt(leadId)}`);
    }

    if (projectId) {
      whereConditions.push(sql`c.project_id = ${parseInt(projectId)}`);
    }

    if (search) {
      const searchPattern = `%${search}%`;
      whereConditions.push(sql`(
        LOWER(c.contract_number) LIKE LOWER(${searchPattern}) OR
        LOWER(c.title) LIKE LOWER(${searchPattern}) OR
        LOWER(l.name) LIKE LOWER(${searchPattern}) OR
        LOWER(c.created_by) LIKE LOWER(${searchPattern})
      )`);
    }

    let contracts;
    let total;

    if (whereConditions.length === 0) {
      // Simple query without additional conditions
      contracts = await sql`
        SELECT 
          c.*,
          l.name as client_name,
          l.email as client_email,
          l.phone as client_phone,
          l.address as client_address,
          e.estimate_number,
          e.total_cost as estimate_total,
          p.project_name
        FROM contracts c
        LEFT JOIN leads l ON c.lead_id = l.id
        LEFT JOIN estimates e ON c.estimate_id = e.id
        LEFT JOIN projects p ON c.project_id = p.id
        ORDER BY c.created_at DESC 
        LIMIT ${limit} OFFSET ${offset}
      `;

      const countResult = await sql`SELECT COUNT(*) as total FROM contracts`;
      total = parseInt(countResult[0].total);
    } else {
      // For now, let's use a simpler approach - just filter by status if provided
      if (status && status !== "all") {
        contracts = await sql`
          SELECT 
            c.*,
            l.name as client_name,
            l.email as client_email,
            l.phone as client_phone,
            l.address as client_address,
            e.estimate_number,
            e.total_cost as estimate_total,
            p.project_name
          FROM contracts c
          LEFT JOIN leads l ON c.lead_id = l.id
          LEFT JOIN estimates e ON c.estimate_id = e.id
          LEFT JOIN projects p ON c.project_id = p.id
          WHERE c.status = ${status}
          ORDER BY c.created_at DESC 
          LIMIT ${limit} OFFSET ${offset}
        `;

        const countResult =
          await sql`SELECT COUNT(*) as total FROM contracts WHERE status = ${status}`;
        total = parseInt(countResult[0].total);
      } else {
        // Default - no filters, get all contracts
        contracts = await sql`
          SELECT 
            c.*,
            l.name as client_name,
            l.email as client_email,
            l.phone as client_phone,
            l.address as client_address,
            e.estimate_number,
            e.total_cost as estimate_total,
            p.project_name
          FROM contracts c
          LEFT JOIN leads l ON c.lead_id = l.id
          LEFT JOIN estimates e ON c.estimate_id = e.id
          LEFT JOIN projects p ON c.project_id = p.id
          ORDER BY c.created_at DESC 
          LIMIT ${limit} OFFSET ${offset}
        `;

        const countResult = await sql`SELECT COUNT(*) as total FROM contracts`;
        total = parseInt(countResult[0].total);
      }
    }

    return Response.json({
      contracts,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error("Error fetching contracts:", error);
    return Response.json(
      { error: "Failed to fetch contracts" },
      { status: 500 },
    );
  }
}

// POST /api/contracts - Create new contract
export async function POST(request) {
  try {
    const session = await checkAuth(request);
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      estimate_id,
      lead_id,
      project_id,
      title,
      description,
      scope_of_work,
      terms_and_conditions,
      payment_terms,
      warranty_terms,
      total_amount,
      deposit_percentage = 25,
      start_date,
      completion_date,
      estimated_duration_days,
      notes,
    } = body;

    // Validation
    if (!title || !scope_of_work || !total_amount) {
      return Response.json(
        {
          error: "Missing required fields: title, scope_of_work, total_amount",
        },
        { status: 400 },
      );
    }

    if (!lead_id && !estimate_id) {
      return Response.json(
        {
          error: "Either lead_id or estimate_id is required",
        },
        { status: 400 },
      );
    }

    const contract_number = generateContractNumber();
    const deposit_amount =
      (parseFloat(total_amount) * (deposit_percentage || 25)) / 100;

    const [contract] = await sql`
      INSERT INTO contracts (
        contract_number, estimate_id, lead_id, project_id,
        title, description, scope_of_work, terms_and_conditions,
        payment_terms, warranty_terms, total_amount, deposit_amount,
        deposit_percentage, start_date, completion_date, 
        estimated_duration_days, created_by, notes
      ) VALUES (
        ${contract_number}, ${estimate_id}, ${lead_id}, ${project_id},
        ${title}, ${description}, ${scope_of_work}, ${terms_and_conditions},
        ${payment_terms}, ${warranty_terms}, ${total_amount}, ${deposit_amount},
        ${deposit_percentage}, ${start_date}, ${completion_date},
        ${estimated_duration_days}, ${session.user.username || session.user.email}, ${notes}
      ) RETURNING *
    `;

    // Update estimate status if linked
    if (estimate_id) {
      await sql`
        UPDATE estimates 
        SET status = 'approved', updated_at = CURRENT_TIMESTAMP
        WHERE id = ${estimate_id}
      `;
    }

    return Response.json(contract, { status: 201 });
  } catch (error) {
    console.error("Error creating contract:", error);
    if (error.message.includes("duplicate key")) {
      return Response.json(
        {
          error: "Contract number already exists",
        },
        { status: 400 },
      );
    }
    return Response.json(
      { error: "Failed to create contract" },
      { status: 500 },
    );
  }
}

// PUT /api/contracts - Update contract
export async function PUT(request) {
  try {
    const session = await checkAuth(request);
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return Response.json(
        { error: "Contract ID is required" },
        { status: 400 },
      );
    }

    // Build dynamic update query
    const updateFields = [];
    const values = [];
    let paramCount = 0;

    // Define allowed update fields
    const allowedFields = [
      "title",
      "description",
      "scope_of_work",
      "terms_and_conditions",
      "payment_terms",
      "warranty_terms",
      "total_amount",
      "deposit_amount",
      "deposit_percentage",
      "start_date",
      "completion_date",
      "estimated_duration_days",
      "status",
      "notes",
      "client_signed_at",
      "client_signature_data",
      "contractor_signed_at",
      "contractor_signature_data",
      "contract_pdf_url",
      "signed_contract_pdf_url",
      "sent_at",
      "viewed_at",
    ];

    // Handle special calculations
    if (
      updates.total_amount &&
      updates.deposit_percentage &&
      !updates.deposit_amount
    ) {
      updates.deposit_amount =
        (parseFloat(updates.total_amount) *
          parseInt(updates.deposit_percentage)) /
        100;
    }

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        paramCount++;
        updateFields.push(`${key} = $${paramCount}`);
        values.push(value);
      }
    }

    if (updateFields.length === 0) {
      return Response.json(
        { error: "No valid fields to update" },
        { status: 400 },
      );
    }

    // Add updated_at
    paramCount++;
    updateFields.push(`updated_at = $${paramCount}`);
    values.push(new Date().toISOString());

    // Add contract ID for WHERE clause
    paramCount++;
    values.push(parseInt(id));

    const query = `
      UPDATE contracts 
      SET ${updateFields.join(", ")}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await sql(query, values);

    if (result.length === 0) {
      return Response.json({ error: "Contract not found" }, { status: 404 });
    }

    return Response.json(result[0]);
  } catch (error) {
    console.error("Error updating contract:", error);
    return Response.json(
      { error: "Failed to update contract" },
      { status: 500 },
    );
  }
}

// DELETE /api/contracts - Delete contract
export async function DELETE(request) {
  try {
    const session = await checkAuth(request);
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return Response.json(
        { error: "Contract ID is required" },
        { status: 400 },
      );
    }

    // Check if contract exists and get its status
    const existingContract = await sql`
      SELECT id, status, estimate_id FROM contracts WHERE id = ${parseInt(id)}
    `;

    if (existingContract.length === 0) {
      return Response.json({ error: "Contract not found" }, { status: 404 });
    }

    // Don't allow deletion of signed contracts
    if (existingContract[0].status === "signed") {
      return Response.json(
        {
          error: "Cannot delete signed contracts",
        },
        { status: 400 },
      );
    }

    // Delete the contract
    await sql`DELETE FROM contracts WHERE id = ${parseInt(id)}`;

    // If contract was linked to an estimate, reset estimate status
    if (existingContract[0].estimate_id) {
      await sql`
        UPDATE estimates 
        SET status = 'sent', updated_at = CURRENT_TIMESTAMP
        WHERE id = ${existingContract[0].estimate_id}
      `;
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error deleting contract:", error);
    return Response.json(
      { error: "Failed to delete contract" },
      { status: 500 },
    );
  }
}
