import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

export async function GET(request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const activeOnly = searchParams.get("active") === "true";

    let whereConditions = [];
    let params = [];
    let paramCount = 0;

    if (category) {
      paramCount++;
      whereConditions.push(`category = $${paramCount}`);
      params.push(category);
    }

    if (activeOnly) {
      whereConditions.push("is_active = true");
    }

    const whereClause =
      whereConditions.length > 0
        ? "WHERE " + whereConditions.join(" AND ")
        : "";

    const templates = await sql(
      `
      SELECT id, name, display_name, subject_template, category, variables, is_active, created_at
      FROM email_templates
      ${whereClause}
      ORDER BY category, display_name
    `,
      params,
    );

    return Response.json({ templates });
  } catch (error) {
    console.error("Error fetching email templates:", error);
    return Response.json(
      { error: "Failed to fetch email templates" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      display_name,
      subject_template,
      html_template,
      text_template,
      category = "general",
      variables = [],
    } = body;

    if (!name || !display_name || !subject_template || !html_template) {
      return Response.json(
        {
          error:
            "Name, display name, subject template, and HTML template are required",
        },
        { status: 400 },
      );
    }

    const template = await sql`
      INSERT INTO email_templates (
        name, display_name, subject_template, html_template, text_template,
        category, variables, created_at, updated_at
      ) VALUES (
        ${name}, ${display_name}, ${subject_template}, ${html_template}, 
        ${text_template}, ${category}, ${JSON.stringify(variables)}, 
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
      RETURNING *
    `;

    return Response.json({ template: template[0] }, { status: 201 });
  } catch (error) {
    console.error("Error creating email template:", error);
    if (error.code === "23505") {
      // Unique constraint violation
      return Response.json(
        { error: "Template name already exists" },
        { status: 409 },
      );
    }
    return Response.json(
      { error: "Failed to create email template" },
      { status: 500 },
    );
  }
}

export async function PUT(request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      id,
      display_name,
      subject_template,
      html_template,
      text_template,
      category,
      variables,
      is_active,
    } = body;

    if (!id) {
      return Response.json(
        { error: "Template ID is required" },
        { status: 400 },
      );
    }

    const updates = [];
    const params = [];
    let paramCount = 0;

    if (display_name !== undefined) {
      paramCount++;
      updates.push(`display_name = $${paramCount}`);
      params.push(display_name);
    }

    if (subject_template !== undefined) {
      paramCount++;
      updates.push(`subject_template = $${paramCount}`);
      params.push(subject_template);
    }

    if (html_template !== undefined) {
      paramCount++;
      updates.push(`html_template = $${paramCount}`);
      params.push(html_template);
    }

    if (text_template !== undefined) {
      paramCount++;
      updates.push(`text_template = $${paramCount}`);
      params.push(text_template);
    }

    if (category !== undefined) {
      paramCount++;
      updates.push(`category = $${paramCount}`);
      params.push(category);
    }

    if (variables !== undefined) {
      paramCount++;
      updates.push(`variables = $${paramCount}`);
      params.push(JSON.stringify(variables));
    }

    if (is_active !== undefined) {
      paramCount++;
      updates.push(`is_active = $${paramCount}`);
      params.push(is_active);
    }

    if (updates.length === 0) {
      return Response.json({ error: "No fields to update" }, { status: 400 });
    }

    paramCount++;
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(id);

    const query = `
      UPDATE email_templates 
      SET ${updates.join(", ")}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await sql(query, params);

    if (result.length === 0) {
      return Response.json({ error: "Template not found" }, { status: 404 });
    }

    return Response.json({ template: result[0] });
  } catch (error) {
    console.error("Error updating email template:", error);
    return Response.json(
      { error: "Failed to update email template" },
      { status: 500 },
    );
  }
}
