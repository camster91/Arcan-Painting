import { getCurrentUser } from "../../utils/auth.js";
import sql from "../../utils/sql.js";

export async function GET(request) {
  const user = await getCurrentUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const connections = await sql`
    SELECT platform, account_email, account_name, is_active, connected_at, token_expiry
    FROM marketing_connections
    ORDER BY platform
  `;
  return Response.json({ connections });
}

export async function DELETE(request) {
  const user = await getCurrentUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { platform } = await request.json();
  await sql`UPDATE marketing_connections SET is_active = false WHERE platform = ${platform}`;
  return Response.json({ success: true });
}
