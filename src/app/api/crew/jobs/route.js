import sql from "@/app/api/utils/sql";
import { crewContext, crewJobs } from "@/app/api/utils/crew";

// GET → { name, jobs } for the signed-in crew member. No prices or invoices.
export async function GET(request) {
  const ctx = await crewContext(sql, request);
  if (!ctx) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const jobs = await crewJobs(sql, ctx);
  const areas = jobs.length
    ? await sql(
        `SELECT estimate_id, name FROM estimate_areas WHERE estimate_id IN (${jobs.map((_, i) => `$${i + 1}`).join(",")}) ORDER BY id`,
        jobs.map((j) => j.estimate_id ?? -1),
      )
    : [];
  return Response.json({
    name: ctx.name,
    jobs: jobs.map(({ estimate_id, ...job }) => ({
      ...job,
      areas: areas.filter((a) => a.estimate_id === estimate_id && a.name).map((a) => a.name),
    })),
  });
}
