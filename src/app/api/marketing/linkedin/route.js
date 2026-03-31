import { getCurrentUser } from "../../../utils/auth.js";
import sql from "../../../utils/sql.js";

// GET - list outreach prospects
export async function GET(request) {
  const user = await getCurrentUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const status = url.searchParams.get("status") || "all";

  let query = "SELECT * FROM linkedin_outreach";
  const params = [];
  if (status !== "all") {
    query += " WHERE status = $1";
    params.push(status);
  }
  query += " ORDER BY created_at DESC";

  const prospects = await sql(query, params);
  return Response.json({ prospects });
}

// POST - add new outreach prospect
export async function POST(request) {
  const user = await getCurrentUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { 
    prospect_name, prospect_title, prospect_company, 
    prospect_linkedin_url, target_role, notes 
  } = body;

  const created = await sql`
    INSERT INTO linkedin_outreach (
      prospect_name, prospect_title, prospect_company, 
      prospect_linkedin_url, target_role, notes, status
    ) VALUES (
      ${prospect_name}, ${prospect_title}, ${prospect_company}, 
      ${prospect_linkedin_url}, ${target_role}, ${notes}, 'draft'
    )
    RETURNING *
  `;

  return Response.json({ prospect: created[0] });
}

// PATCH - update status or messages
export async function PATCH(request) {
  const user = await getCurrentUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { id, status, connection_message, followup_message } = body;

  const updated = await sql`
    UPDATE linkedin_outreach SET
      status = COALESCE(${status}, status),
      connection_message = COALESCE(${connection_message}, connection_message),
      followup_message = COALESCE(${followup_message}, followup_message),
      sent_at = CASE WHEN ${status} = 'sent' THEN CURRENT_TIMESTAMP ELSE sent_at END
    WHERE id = ${id}
    RETURNING *
  `;

  return Response.json({ prospect: updated[0] });
}

// DELETE - remove prospect
export async function DELETE(request) {
  const user = await getCurrentUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await request.json();
  await sql`DELETE FROM linkedin_outreach WHERE id = ${id}`;
  return Response.json({ success: true });
}
