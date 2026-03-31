import { getCurrentUser } from "../../../utils/auth.js";
import sql from "../../../utils/sql.js";

async function getGoogleAccessToken() {
  const rows = await sql(
    `SELECT access_token, refresh_token, token_expiry FROM marketing_connections WHERE platform = 'google' AND is_active = true LIMIT 1`
  );
  if (!rows.length) return null;

  const { access_token, refresh_token, token_expiry } = rows[0];

  if (token_expiry && new Date(token_expiry) > new Date(Date.now() + 5 * 60 * 1000)) {
    return access_token;
  }

  if (!refresh_token) return null;

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) return null;

  const tokens = await res.json();
  const newExpiry = tokens.expires_in
    ? new Date(Date.now() + tokens.expires_in * 1000)
    : null;

  await sql(
    `UPDATE marketing_connections SET access_token = $1, token_expiry = $2, updated_at = CURRENT_TIMESTAMP WHERE platform = 'google'`,
    [tokens.access_token, newExpiry]
  );

  return tokens.access_token;
}

// Call Gemini with fallback strategies (OAuth → API key → Ollama)
async function callAI(systemPrompt, userPrompt) {
  const messages = [{ role: "user", parts: [{ text: userPrompt }] }];

  // Strategy 1: Google OAuth token
  try {
    const oauthToken = await getGoogleAccessToken();
    if (oauthToken) {
      const res = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${oauthToken}`,
          },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents: messages,
            generationConfig: { maxOutputTokens: 1024, temperature: 0.7 },
          }),
        }
      );
      if (res.ok) {
        const data = await res.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text;
      }
    }
  } catch (e) {
    console.error("[linkedin/outreach] Gemini OAuth error:", e.message);
  }

  // Strategy 2: Gemini API key
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents: messages,
            generationConfig: { maxOutputTokens: 1024, temperature: 0.7 },
          }),
        }
      );
      if (res.ok) {
        const data = await res.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text;
      }
    } catch (e) {
      console.error("[linkedin/outreach] Gemini API key error:", e.message);
    }
  }

  // Strategy 3: Ollama Cloud
  const ollamaUrl = process.env.OLLAMA_CLOUD_URL;
  const ollamaKey = process.env.OLLAMA_CLOUD_KEY;
  if (ollamaUrl) {
    try {
      const res = await fetch(`${ollamaUrl}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(ollamaKey && { Authorization: `Bearer ${ollamaKey}` }),
        },
        body: JSON.stringify({
          model: process.env.OLLAMA_MODEL || "qwen2.5:7b",
          stream: false,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.message?.content;
      }
    } catch (e) {
      console.error("[linkedin/outreach] Ollama error:", e.message);
    }
  }

  return null;
}

const ROLE_LABELS = {
  real_estate_agent: "Real Estate Agent",
  property_manager: "Property Manager",
  contractor: "General Contractor",
  interior_designer: "Interior Designer",
  home_stager: "Home Stager",
};

// GET — list outreach prospects with optional filters
export async function GET(request) {
  const user = await getCurrentUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const target_role = url.searchParams.get("target_role");
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 200);

  let query = "SELECT * FROM linkedin_outreach";
  const params = [];
  const conditions = [];

  if (status) {
    conditions.push(`status = $${params.length + 1}`);
    params.push(status);
  }
  if (target_role) {
    conditions.push(`target_role = $${params.length + 1}`);
    params.push(target_role);
  }
  if (conditions.length) query += " WHERE " + conditions.join(" AND ");
  query += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
  params.push(limit);

  const prospects = await sql(query, params);

  const stats = await sql`
    SELECT
      COUNT(*) FILTER (WHERE status = 'draft')::int AS draft_count,
      COUNT(*) FILTER (WHERE status = 'sent')::int AS sent_count,
      COUNT(*) FILTER (WHERE status = 'connected')::int AS connected_count,
      COUNT(*) FILTER (WHERE status = 'replied')::int AS replied_count,
      COUNT(*) FILTER (WHERE status = 'converted')::int AS converted_count,
      COUNT(*)::int AS total
    FROM linkedin_outreach
  `;

  return Response.json({ prospects, stats: stats[0] });
}

// POST — add prospect, generate AI messages, or update status
export async function POST(request) {
  const user = await getCurrentUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { action = "add" } = body;

  if (action === "add") {
    return handleAdd(body);
  }
  if (action === "generate") {
    return handleGenerate(body);
  }
  if (action === "bulk_generate") {
    return handleBulkGenerate(body);
  }
  if (action === "update_status") {
    return handleUpdateStatus(body);
  }

  return Response.json({ error: "Invalid action. Use 'add', 'generate', 'bulk_generate', or 'update_status'." }, { status: 400 });
}

async function handleAdd({
  prospect_name,
  prospect_title,
  prospect_company,
  prospect_linkedin_url,
  target_role,
  connection_message,
  followup_message,
  notes,
}) {
  if (!prospect_name) return Response.json({ error: "prospect_name is required" }, { status: 400 });

  const prospect = await sql`
    INSERT INTO linkedin_outreach
      (prospect_name, prospect_title, prospect_company, prospect_linkedin_url,
       target_role, connection_message, followup_message, notes)
    VALUES (
      ${prospect_name}, ${prospect_title || null}, ${prospect_company || null},
      ${prospect_linkedin_url || null}, ${target_role || "other"},
      ${connection_message || null}, ${followup_message || null}, ${notes || null}
    )
    RETURNING *
  `;
  return Response.json({ prospect: prospect[0] });
}

async function handleGenerate({ id, prospect_name, prospect_title, prospect_company, target_role }) {
  // Generate AI messages for a specific prospect
  let name = prospect_name;
  let title = prospect_title;
  let company = prospect_company;
  let role = target_role;

  // If id provided, load prospect data
  if (id) {
    const rows = await sql`SELECT * FROM linkedin_outreach WHERE id = ${id}`;
    if (!rows.length) return Response.json({ error: "Prospect not found" }, { status: 404 });
    const p = rows[0];
    name = p.prospect_name;
    title = p.prospect_title;
    company = p.prospect_company;
    role = p.target_role;
  }

  const roleLabel = ROLE_LABELS[role] || role?.replace(/_/g, " ") || "professional";

  const systemPrompt = `You are a LinkedIn outreach specialist for Arcan Painting, a professional painting company in the Greater Toronto Area run by Gerardo.

Your job is to write personalized LinkedIn connection request messages and follow-up messages.

Rules:
- Connection requests must be under 300 characters (LinkedIn limit)
- Be professional but warm and conversational
- Reference their specific role/industry naturally
- Focus on mutual value — not a hard sell
- For follow-ups, be slightly longer (2-3 sentences) and reference the connection
- Always sign off as Gerardo from Arcan Painting

Output format (JSON):
{
  "connection_message": "the connection request message (under 300 chars)",
  "followup_message": "the follow-up InMail/message (2-3 sentences)"
}`;

  const userPrompt = `Generate a LinkedIn connection request and follow-up message for:
- Name: ${name}
- Title: ${title || "Unknown"}
- Company: ${company || "Unknown"}
- Role type: ${roleLabel}

The goal is to build a relationship that could lead to painting referrals or direct work.`;

  const aiResponse = await callAI(systemPrompt, userPrompt);

  if (!aiResponse) {
    return Response.json(
      { error: "AI service unavailable. Connect Google or set GEMINI_API_KEY." },
      { status: 503 }
    );
  }

  // Parse AI response — try JSON first, then extract from text
  let connectionMessage, followupMessage;
  try {
    const cleaned = aiResponse.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    connectionMessage = parsed.connection_message;
    followupMessage = parsed.followup_message;
  } catch {
    // Fallback: use as connection message directly
    connectionMessage = aiResponse.slice(0, 300);
    followupMessage = aiResponse;
  }

  // If prospect exists in DB, update it
  if (id) {
    const updated = await sql`
      UPDATE linkedin_outreach
      SET connection_message = ${connectionMessage}, followup_message = ${followupMessage}
      WHERE id = ${id}
      RETURNING *
    `;
    return Response.json({ prospect: updated[0], generated: true });
  }

  return Response.json({
    connection_message: connectionMessage,
    followup_message: followupMessage,
    generated: true,
  });
}

async function handleBulkGenerate({ target_role, limit = 10 }) {
  // Generate messages for all draft prospects without messages
  let query = "SELECT * FROM linkedin_outreach WHERE connection_message IS NULL AND status = 'draft'";
  const params = [];

  if (target_role) {
    query += ` AND target_role = $${params.length + 1}`;
    params.push(target_role);
  }
  query += ` LIMIT $${params.length + 1}`;
  params.push(Math.min(limit, 20)); // Cap at 20 to avoid API abuse

  const prospects = await sql(query, params);

  let generated = 0;
  const errors = [];

  for (const p of prospects) {
    try {
      const res = await handleGenerate({
        id: p.id,
        prospect_name: p.prospect_name,
        prospect_title: p.prospect_title,
        prospect_company: p.prospect_company,
        target_role: p.target_role,
      });
      const data = await res.json();
      if (data.generated) generated++;
    } catch (err) {
      errors.push({ id: p.id, error: err.message });
    }
  }

  return Response.json({
    total: prospects.length,
    generated,
    errors: errors.length ? errors : undefined,
    message: `Generated messages for ${generated}/${prospects.length} prospects`,
  });
}

async function handleUpdateStatus({ id, status, notes }) {
  if (!id || !status) return Response.json({ error: "id and status are required" }, { status: 400 });

  const fields = [`status = $1`];
  const params = [status];

  if (status === "sent") {
    fields.push("sent_at = CURRENT_TIMESTAMP");
  }
  if (notes !== undefined) {
    params.push(notes);
    fields.push(`notes = $${params.length}`);
  }

  params.push(id);
  const query = `UPDATE linkedin_outreach SET ${fields.join(", ")} WHERE id = $${params.length} RETURNING *`;
  const updated = await sql(query, params);

  if (!updated.length) return Response.json({ error: "Prospect not found" }, { status: 404 });
  return Response.json({ prospect: updated[0] });
}

// PUT — update a prospect's details
export async function PUT(request) {
  const user = await getCurrentUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { id } = body;
  if (!id) return Response.json({ error: "id is required" }, { status: 400 });

  const fields = [];
  const params = [];
  const updatableFields = [
    "prospect_name", "prospect_title", "prospect_company",
    "prospect_linkedin_url", "target_role", "connection_message",
    "followup_message", "notes",
  ];

  for (const field of updatableFields) {
    if (body[field] !== undefined) {
      params.push(body[field]);
      fields.push(`${field} = $${params.length}`);
    }
  }

  if (!fields.length) return Response.json({ error: "No fields to update" }, { status: 400 });

  params.push(id);
  const query = `UPDATE linkedin_outreach SET ${fields.join(", ")} WHERE id = $${params.length} RETURNING *`;
  const updated = await sql(query, params);

  if (!updated.length) return Response.json({ error: "Prospect not found" }, { status: 404 });
  return Response.json({ prospect: updated[0] });
}

// DELETE — remove a prospect
export async function DELETE(request) {
  const user = await getCurrentUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await request.json();
  if (!id) return Response.json({ error: "id is required" }, { status: 400 });

  const rows = await sql`DELETE FROM linkedin_outreach WHERE id = ${id} RETURNING id`;
  if (!rows.length) return Response.json({ error: "Prospect not found" }, { status: 404 });

  return Response.json({ success: true });
}
