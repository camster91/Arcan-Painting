import sql from "@/app/api/utils/sql";
import { generalLimiter } from "@/app/api/utils/rate-limit";
import { crewContext, canSeeJob } from "@/app/api/utils/crew";

// POST { project_id, note?, photos: ["/uploads/…"] } — a progress report from the crew view.
export async function POST(request) {
  const limited = generalLimiter(request);
  if (limited) return limited;
  const ctx = await crewContext(sql, request);
  if (!ctx) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const projectId = parseInt(body.project_id, 10);
  const note = String(body.note || "").trim().slice(0, 5000);
  const photos = (Array.isArray(body.photos) ? body.photos : [])
    .filter((url) => typeof url === "string" && /^\/uploads\/[\w/.-]+$/.test(url))
    .slice(0, 20);
  if (!projectId) return Response.json({ error: "project_id is required" }, { status: 400 });
  if (!note && photos.length === 0) return Response.json({ error: "Add a photo or a note." }, { status: 400 });
  if (!(await canSeeJob(sql, ctx, projectId))) return Response.json({ error: "This job isn't assigned to you." }, { status: 403 });

  const [report] = await sql`
    INSERT INTO project_progress (project_id, report_date, work_description, photos, reported_by)
    VALUES (${projectId}, ${new Date().toISOString().slice(0, 10)}, ${note || null}, ${JSON.stringify(photos)}, ${ctx.name})
    RETURNING id
  `;
  return Response.json({ id: report.id }, { status: 201 });
}
