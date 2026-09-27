import sql from "@/app/api/utils/sql";
import { generalLimiter } from "@/app/api/utils/rate-limit";
import { auditLog } from "@/app/api/utils/audit";
import { isPublicToken } from "@/app/api/utils/public-links";
import { publicEstimate } from "@/app/api/utils/public-documents";
import { approveEstimate } from "@/app/api/utils/approve-estimate";

const notFound = () => Response.json({ error: "This estimate link is not valid." }, { status: 404 });

// GET ?token=… — the customer's view of an estimate (no login).
export async function GET(request) {
  const limited = generalLimiter(request);
  if (limited) return limited;
  const token = new URL(request.url).searchParams.get("token");
  if (!isPublicToken(token)) return notFound();
  const estimate = await publicEstimate(sql, token);
  return estimate ? Response.json({ estimate }) : notFound();
}

// POST { token, name } — the customer accepts the estimate. Creates the job.
export async function POST(request) {
  const limited = generalLimiter(request);
  if (limited) return limited;
  try {
    const body = await request.json().catch(() => ({}));
    const name = String(body.name || "").trim().slice(0, 255);
    if (!isPublicToken(body.token)) return notFound();
    if (name.length < 2) return Response.json({ error: "Type your full name to accept." }, { status: 400 });

    const current = await publicEstimate(sql, body.token);
    if (!current) return notFound();
    if (current.status === "accepted") return Response.json({ estimate: current });
    if (current.status !== "open") {
      return Response.json({ error: `This estimate is ${current.status}. Contact us for an updated quote.` }, { status: 409 });
    }

    const [row] = await sql`SELECT id FROM estimates WHERE public_token = ${body.token}`;
    const result = await sql.transaction((tx) => approveEstimate(tx, row.id, { acceptedName: name }));
    if (result.error) return Response.json({ error: result.error }, { status: result.status });

    await auditLog({
      request,
      action: "estimate.accepted_by_customer",
      username: name,
      resource: "estimate",
      resourceId: row.id,
      changes: { project_id: result.project.id },
      status: "success",
    });
    await sql`
      INSERT INTO notifications (type, title, message, related_type, related_id, is_read)
      VALUES ('estimate_accepted', 'Estimate accepted', ${`${name} accepted ${current.estimate_number} (${current.project_title}).`},
              'estimate', ${row.id}, false)
    `.catch((e) => console.error("accept notification failed:", e.message));

    return Response.json({ estimate: await publicEstimate(sql, body.token) });
  } catch (error) {
    console.error("Public estimate accept failed:", error);
    return Response.json({ error: "Something went wrong. Please try again or call us." }, { status: 500 });
  }
}
