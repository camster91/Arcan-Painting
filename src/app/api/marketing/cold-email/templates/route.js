import { getCurrentUser } from "../../utils/auth.js";
import sql from "../../../utils/sql.js";

// GET - list templates
export async function GET(request) {
  const user = await getCurrentUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const templates = await sql`
    SELECT * FROM cold_email_templates
    ORDER BY target_role, sequence_step
  `;

  return Response.json({ templates });
}

// POST - create or update template
export async function POST(request) {
  const user = await getCurrentUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { id, name, target_role, sequence_step, subject_template, body_template, is_active } = body;

  if (id) {
    // Update
    const updated = await sql`
      UPDATE cold_email_templates SET
        name = ${name},
        target_role = ${target_role},
        sequence_step = ${sequence_step},
        subject_template = ${subject_template},
        body_template = ${body_template},
        is_active = ${is_active}
      WHERE id = ${id}
      RETURNING *
    `;
    return Response.json({ template: updated[0] });
  } else {
    // Create
    const created = await sql`
      INSERT INTO cold_email_templates (
        name, target_role, sequence_step, subject_template, body_template
      ) VALUES (
        ${name}, ${target_role}, ${sequence_step}, ${subject_template}, ${body_template}
      )
      RETURNING *
    `;
    return Response.json({ template: created[0] });
  }
}

// DELETE - remove template
export async function DELETE(request) {
  const user = await getCurrentUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await request.json();
  await sql`DELETE FROM cold_email_templates WHERE id = ${id}`;
  return Response.json({ success: true });
}
