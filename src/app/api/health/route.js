import sql from "../utils/sql.js";

// This endpoint is used by Docker and the deployment workflow. A process that
// can render the marketing site but cannot reach Postgres cannot serve the
// CRM or accept leads, so it must not be reported as healthy.
export async function GET() {
  try {
    await sql`SELECT 1`;
    return Response.json({ status: "ok", timestamp: new Date().toISOString() });
  } catch (error) {
    console.error("[health] database check failed:", error?.message || error);
    return Response.json(
      { status: "unavailable", timestamp: new Date().toISOString() },
      { status: 503 },
    );
  }
}
