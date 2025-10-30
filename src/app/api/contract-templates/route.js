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

export async function GET(request) {
  try {
    const session = await checkAuth(request);
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get("active");
    const isDefault = searchParams.get("default");

    let templates;

    if (isActive !== null || isDefault !== null) {
      // Handle filters with tagged template syntax
      if (isActive === "true" && isDefault === "true") {
        templates = await sql`
          SELECT * FROM contract_templates 
          WHERE is_active = true AND is_default = true
          ORDER BY is_default DESC, name ASC
        `;
      } else if (isActive === "true") {
        templates = await sql`
          SELECT * FROM contract_templates 
          WHERE is_active = true
          ORDER BY is_default DESC, name ASC
        `;
      } else if (isDefault === "true") {
        templates = await sql`
          SELECT * FROM contract_templates 
          WHERE is_default = true
          ORDER BY is_default DESC, name ASC
        `;
      } else {
        templates = await sql`
          SELECT * FROM contract_templates 
          ORDER BY is_default DESC, name ASC
        `;
      }
    } else {
      // No filters, get all templates
      templates = await sql`
        SELECT * FROM contract_templates 
        ORDER BY is_default DESC, name ASC
      `;
    }

    return Response.json(templates);
  } catch (error) {
    console.error("Error fetching contract templates:", error);
    return Response.json(
      { error: "Failed to fetch templates" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const session = await checkAuth(request);
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();

    // Validate required fields
    if (!data.name) {
      return Response.json(
        {
          error: "Template name is required",
        },
        { status: 400 },
      );
    }

    // If setting as default, unset other defaults first
    if (data.is_default) {
      await sql`UPDATE contract_templates SET is_default = false WHERE is_default = true`;
    }

    const template = await sql`
      INSERT INTO contract_templates (
        name,
        description,
        scope_template,
        terms_template,
        payment_terms_template,
        warranty_template,
        default_deposit_percentage,
        is_active,
        is_default
      )
      VALUES (
        ${data.name},
        ${data.description || ""},
        ${data.scope_template || ""},
        ${data.terms_template || ""},
        ${data.payment_terms_template || ""},
        ${data.warranty_template || ""},
        ${data.default_deposit_percentage || 25},
        ${data.is_active !== false},
        ${data.is_default || false}
      )
      RETURNING *
    `;

    return Response.json(template[0]);
  } catch (error) {
    console.error("Error creating contract template:", error);
    return Response.json(
      { error: "Failed to create template" },
      { status: 500 },
    );
  }
}

export async function PUT(request) {
  try {
    const session = await checkAuth(request);
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const { id, ...updates } = data;

    if (!id) {
      return Response.json(
        { error: "Template ID is required" },
        { status: 400 },
      );
    }

    // If setting as default, unset other defaults first
    if (updates.is_default) {
      await sql`UPDATE contract_templates SET is_default = false WHERE is_default = true AND id != ${parseInt(id)}`;
    }

    // Build dynamic update with tagged template syntax
    const allowedFields = [
      "name",
      "description",
      "scope_template",
      "terms_template",
      "payment_terms_template",
      "warranty_template",
      "default_deposit_percentage",
      "is_active",
      "is_default",
    ];

    // Simple approach - handle each field individually
    let result;
    const templateId = parseInt(id);

    if (updates.name !== undefined) {
      result = await sql`
        UPDATE contract_templates 
        SET name = ${updates.name}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${templateId}
        RETURNING *
      `;
    }

    if (updates.description !== undefined) {
      result = await sql`
        UPDATE contract_templates 
        SET description = ${updates.description}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${templateId}
        RETURNING *
      `;
    }

    if (updates.is_active !== undefined) {
      result = await sql`
        UPDATE contract_templates 
        SET is_active = ${updates.is_active}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${templateId}
        RETURNING *
      `;
    }

    if (updates.is_default !== undefined) {
      result = await sql`
        UPDATE contract_templates 
        SET is_default = ${updates.is_default}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${templateId}
        RETURNING *
      `;
    }

    if (updates.default_deposit_percentage !== undefined) {
      result = await sql`
        UPDATE contract_templates 
        SET default_deposit_percentage = ${updates.default_deposit_percentage}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${templateId}
        RETURNING *
      `;
    }

    if (updates.scope_template !== undefined) {
      result = await sql`
        UPDATE contract_templates 
        SET scope_template = ${updates.scope_template}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${templateId}
        RETURNING *
      `;
    }

    if (updates.terms_template !== undefined) {
      result = await sql`
        UPDATE contract_templates 
        SET terms_template = ${updates.terms_template}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${templateId}
        RETURNING *
      `;
    }

    if (updates.payment_terms_template !== undefined) {
      result = await sql`
        UPDATE contract_templates 
        SET payment_terms_template = ${updates.payment_terms_template}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${templateId}
        RETURNING *
      `;
    }

    if (updates.warranty_template !== undefined) {
      result = await sql`
        UPDATE contract_templates 
        SET warranty_template = ${updates.warranty_template}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${templateId}
        RETURNING *
      `;
    }

    // If no specific field updates, just update the timestamp
    if (!result) {
      result = await sql`
        UPDATE contract_templates 
        SET updated_at = CURRENT_TIMESTAMP
        WHERE id = ${templateId}
        RETURNING *
      `;
    }

    if (result.length === 0) {
      return Response.json({ error: "Template not found" }, { status: 404 });
    }

    return Response.json(result[0]);
  } catch (error) {
    console.error("Error updating contract template:", error);
    return Response.json(
      { error: "Failed to update template" },
      { status: 500 },
    );
  }
}

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
        { error: "Template ID is required" },
        { status: 400 },
      );
    }

    // Check if template exists
    const existingTemplate = await sql`
      SELECT id, is_default FROM contract_templates WHERE id = ${parseInt(id)}
    `;

    if (existingTemplate.length === 0) {
      return Response.json({ error: "Template not found" }, { status: 404 });
    }

    // Don't allow deletion of default template without warning
    if (existingTemplate[0].is_default) {
      return Response.json(
        {
          error:
            "Cannot delete default template. Set another template as default first.",
        },
        { status: 400 },
      );
    }

    // Delete the template
    await sql`DELETE FROM contract_templates WHERE id = ${parseInt(id)}`;

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error deleting contract template:", error);
    return Response.json(
      { error: "Failed to delete template" },
      { status: 500 },
    );
  }
}
