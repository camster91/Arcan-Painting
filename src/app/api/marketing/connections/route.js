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

export async function POST(request) {
  const user = await getCurrentUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { platform, apiKey, accountEmail, metadata = {} } = await request.json();
  if (!platform) return Response.json({ error: "Platform required" }, { status: 400 });

  // Store API key in access_token column (encrypted in production, but plaintext for now as per schema)
  await sql`
    INSERT INTO marketing_connections (platform, access_token, account_email, metadata, is_active)
    VALUES (${platform}, ${apiKey || null}, ${accountEmail || null}, ${JSON.stringify(metadata)}, true)
    ON CONFLICT (platform) DO UPDATE SET
      access_token = COALESCE(EXCLUDED.access_token, marketing_connections.access_token),
      account_email = COALESCE(EXCLUDED.account_email, marketing_connections.account_email),
      metadata = COALESCE(marketing_connections.metadata, '{}'::jsonb) || COALESCE(EXCLUDED.metadata, '{}'::jsonb),
      is_active = true,
      updated_at = CURRENT_TIMESTAMP
  `;
  return Response.json({ success: true });
}

export async function DELETE(request) {
  const user = await getCurrentUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { platform } = await request.json();
  await sql`UPDATE marketing_connections SET is_active = false WHERE platform = ${platform}`;
  return Response.json({ success: true });
}
