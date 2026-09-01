import sql from "@/app/api/utils/sql";
import { getCurrentUser } from "@/app/api/utils/auth";
import { auditLog } from "@/app/api/utils/audit";
import { generalLimiter } from "@/app/api/utils/rate-limit";
import {
  createCustomerPortalToken,
  hashCustomerPortalToken,
  normalizePortalExpiryDays,
} from "@/app/api/utils/customer-portal";

const isOwner = (user) => user?.role === "owner";

export async function GET(request) {
  const limited = generalLimiter(request); if (limited) return limited;
  const user = await getCurrentUser(request);
  if (!isOwner(user)) return Response.json({ error: "Owner access required" }, { status: 403 });
  const leadId = Number(new URL(request.url).searchParams.get("lead_id"));
  if (!Number.isInteger(leadId)) return Response.json({ error: "Valid lead_id is required" }, { status: 400 });
  const links = await sql`
    SELECT id, lead_id, expires_at, revoked_at, last_used_at, created_at
    FROM customer_portal_tokens WHERE lead_id = ${leadId}
    ORDER BY created_at DESC
  `;
  return Response.json({ links });
}

export async function POST(request) {
  const limited = generalLimiter(request); if (limited) return limited;
  const user = await getCurrentUser(request);
  if (!isOwner(user)) return Response.json({ error: "Owner access required" }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  const leadId = Number(body.lead_id);
  if (!Number.isInteger(leadId)) return Response.json({ error: "Valid lead_id is required" }, { status: 400 });
  let days;
  try { days = normalizePortalExpiryDays(body.expires_days); }
  catch (error) { return Response.json({ error: error.message }, { status: 400 }); }
  const leads = await sql`SELECT id FROM leads WHERE id = ${leadId} AND deleted_at IS NULL`;
  if (!leads.length) return Response.json({ error: "Customer not found" }, { status: 404 });

  const token = createCustomerPortalToken();
  const tokenHash = hashCustomerPortalToken(token);
  const expiresAt = new Date(Date.now() + days * 86_400_000);
  const [link] = await sql`
    INSERT INTO customer_portal_tokens (lead_id, token_hash, expires_at, created_by)
    VALUES (${leadId}, ${tokenHash}, ${expiresAt}, ${user.id})
    RETURNING id, lead_id, expires_at, created_at
  `;
  const configuredOrigin = process.env.APP_URL || process.env.NEXTAUTH_URL || new URL(request.url).origin;
  const portalUrl = `${configuredOrigin.replace(/\/$/, "")}/portal/${token}`;
  await auditLog({ request, action: "customer_portal.link_create", userId: user.id, username: user.username, resource: "lead", resourceId: leadId, changes: { link_id: link.id, expires_at: link.expires_at }, status: "success" });
  return Response.json({ link, portal_url: portalUrl }, { status: 201 });
}

export async function DELETE(request) {
  const limited = generalLimiter(request); if (limited) return limited;
  const user = await getCurrentUser(request);
  if (!isOwner(user)) return Response.json({ error: "Owner access required" }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  const id = Number(body.id);
  if (!Number.isInteger(id)) return Response.json({ error: "Valid link id is required" }, { status: 400 });
  const [link] = await sql`UPDATE customer_portal_tokens SET revoked_at = COALESCE(revoked_at, CURRENT_TIMESTAMP) WHERE id = ${id} RETURNING id, lead_id, revoked_at`;
  if (!link) return Response.json({ error: "Link not found" }, { status: 404 });
  await auditLog({ request, action: "customer_portal.link_revoke", userId: user.id, username: user.username, resource: "lead", resourceId: link.lead_id, changes: { link_id: link.id }, status: "success" });
  return Response.json({ link });
}
