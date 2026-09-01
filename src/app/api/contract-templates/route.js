import sql from "@/app/api/utils/sql";
import { getCurrentUser } from "@/app/api/utils/auth";
import { auditLog } from "@/app/api/utils/audit";

export async function GET(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
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
    const user = await getCurrentUser(request);
    if (!user) {
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

    await auditLog({
      request,
      action: "contract_template.create",
      userId: user.id,
      username: user.username,
      resource: "contract_template",
      resourceId: template[0].id,
      changes: {
        is_active: template[0].is_active,
        is_default: template[0].is_default,
      },
    });

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
    const user = await getCurrentUser(request);
    if (!user) {
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
    const templateId = parseInt(id);
    if (!Number.isInteger(templateId))
      return Response.json(
        { error: "Template ID is invalid" },
        { status: 400 },
      );
    if (
      updates.default_deposit_percentage !== undefined &&
      (!Number.isFinite(Number(updates.default_deposit_percentage)) ||
        Number(updates.default_deposit_percentage) < 0 ||
        Number(updates.default_deposit_percentage) > 100)
    )
      return Response.json(
        { error: "Default deposit percentage must be between 0 and 100" },
        { status: 400 },
      );
    const changedFields = Object.keys(updates).filter((field) =>
      allowedFields.includes(field),
    );
    if (!changedFields.length)
      return Response.json(
        { error: "No valid fields to update" },
        { status: 400 },
      );

    const result = await sql.transaction(async (txn) => {
      if (updates.is_default) {
        await txn`UPDATE contract_templates SET is_default = false WHERE is_default = true AND id != ${templateId}`;
      }
      const fields = changedFields.map(
        (field, index) => `${field} = $${index + 1}`,
      );
      const values = changedFields.map((field) => updates[field]);
      values.push(templateId);
      return txn(
        `UPDATE contract_templates SET ${fields.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = $${values.length} RETURNING *`,
        values,
      );
    });

    if (result.length === 0) {
      return Response.json({ error: "Template not found" }, { status: 404 });
    }

    await auditLog({
      request,
      action: "contract_template.update",
      userId: user.id,
      username: user.username,
      resource: "contract_template",
      resourceId: templateId,
      changes: {
        fields: Object.keys(updates).filter((field) =>
          allowedFields.includes(field),
        ),
      },
    });

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
    const user = await getCurrentUser(request);
    if (!user) {
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

    await auditLog({
      request,
      action: "contract_template.delete",
      userId: user.id,
      username: user.username,
      resource: "contract_template",
      resourceId: id,
      changes: { is_default: false },
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error deleting contract template:", error);
    return Response.json(
      { error: "Failed to delete template" },
      { status: 500 },
    );
  }
}
