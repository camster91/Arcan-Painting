import { getCurrentUser } from "../../utils/auth.js";
import sql from "../../utils/sql.js";

export async function POST(request) {
  const user = await getCurrentUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { projectId, topic } = await request.json();

  // 1. Get project info + any gallery photos
  const [project] = await sql`SELECT * FROM projects WHERE id = ${projectId}`;
  if (!project) return Response.json({ error: "Project not found" }, { status: 404 });

  // 2. Draft the post using AI
  const geminiKey = process.env.GEMINI_API_KEY || (await getStoredApiKey('gemini_api'));
  if (!geminiKey) return Response.json({ error: "Gemini Key missing" }, { status: 503 });

  const prompt = `Write a high-converting Google Business Profile post and a Facebook Ad for Arcan Painting.
Project: ${project.name}
Service: ${project.service_type}
Location: ${project.location}
Topic: ${topic || "Showcase of our latest work"}

Format as JSON: { "gbp": "post text", "facebook": "ad text", "hashtags": ["#toronto", "#painting"] }`;

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { response_mime_type: "application/json" }
      })
    });
    const data = await res.json();
    const result = JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text);

    // 3. Save as draft in content_calendar
    await sql`
      INSERT INTO content_calendar (title, content_type, content, status)
      VALUES (${`Draft: ${project.name} Post`}, 'social_post', ${JSON.stringify(result)}, 'draft')
    `;

    return Response.json({ success: true, result });
  } catch (e) {
    return Response.json({ error: "AI failed to generate post" }, { status: 500 });
  }
}

async function getStoredApiKey(platform) {
  const rows = await sql(`SELECT access_token FROM marketing_connections WHERE platform = $1 AND is_active = true LIMIT 1`, [platform]);
  return rows.length ? rows[0].access_token : null;
}
