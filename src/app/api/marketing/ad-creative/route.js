import { getCurrentUser } from "../../utils/auth.js";
import sql from "../../utils/sql.js";

// Helper: get working Google access token (OAuth or refresh)
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
    console.error("[ad-creative] Gemini OAuth error:", e.message);
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
      console.error("[ad-creative] Gemini API key error:", e.message);
    }
  }

  // Strategy 3: Ollama Cloud
  const ollamaUrl = process.env.OLLAMA_CLOUD_URL;
  const ollamaKey = process.env.OLLAMA_CLOUD_KEY;
  if (ollamaUrl && ollamaKey) {
    try {
      const res = await fetch(`${ollamaUrl}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ollamaKey}`,
        },
        body: JSON.stringify({
          model: process.env.OLLAMA_MODEL || "qwen2.5:7b",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          stream: false,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.message?.content;
      }
    } catch (e) {
      console.error("[ad-creative] Ollama Cloud error:", e.message);
    }
  }

  return null;
}

// GET - list saved creatives
export async function GET(request) {
  const user = await getCurrentUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const platform = url.searchParams.get("platform");
  const status = url.searchParams.get("status") || "draft";

  let query = "SELECT * FROM ad_creatives";
  const params = [];

  if (platform) {
    query += " WHERE platform = $1";
    params.push(platform);
    if (status && status !== "all") {
      query += " AND status = $2";
      params.push(status);
    }
  } else if (status !== "all") {
    query += " WHERE status = $1";
    params.push(status);
  }

  query += " ORDER BY created_at DESC LIMIT 50";
  const creatives = await sql(query, params);
  return Response.json({ creatives });
}

// POST - generate a new creative with AI OR save manually
export async function POST(request) {
  const user = await getCurrentUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { action, platform, adType, service, location, targetAudience, campaignName, notes, creative } = body;

  if (action === "generate") {
    if (!platform) {
      return Response.json({ error: "Platform is required" }, { status: 400 });
    }

    const serviceLabel =
      service === "interior" ? "interior painting"
      : service === "exterior" ? "exterior painting"
      : service === "commercial" ? "commercial painting"
      : service === "cabinet" ? "cabinet painting"
      : "painting services";

    const platformInstructions =
      platform === "facebook"
        ? "Facebook ad (primary text max 125 chars, headline max 40 chars, description max 30 chars)"
      : platform === "instagram"
        ? "Instagram ad (caption max 2200 chars with 3-5 hashtags, short punchy headline)"
      : platform === "google_ads"
        ? "Google Search ad (3 headlines max 30 chars each, 2 descriptions max 90 chars each, display URL path)"
      : platform === "flyer"
        ? "print flyer (bold headline, 3 bullet points of key benefits, strong CTA, contact info placeholder)"
      : "email ad (subject line max 50 chars, preview text max 90 chars, body 150-200 words)";

    const adTypeContext =
      adType === "promo" ? "a limited-time promotional offer"
      : adType === "seasonal" ? "a seasonal campaign (consider the current season in Canada)"
      : adType === "lead_gen" ? "lead generation (get a free estimate)"
      : adType === "retargeting" ? "retargeting past website visitors"
      : "brand awareness";

    const audienceContext = targetAudience || "homeowners in the Greater Toronto Area";
    const locationContext = location || "Greater Toronto Area";

    const systemPrompt = "You are a professional advertising copywriter specializing in home services in Canada. Return ONLY valid JSON, no markdown, no code blocks.";

    const userPrompt = `Create a complete ${platformInstructions} for:
- Business: Arcan Painting (professional painting company)
- Service: ${serviceLabel}
- Campaign goal: ${adTypeContext}
- Target audience: ${audienceContext}
- Location: ${locationContext}
- USP: Quality workmanship, fully insured, free estimates, GTA-based

Return ONLY a JSON object with these exact fields:
{
  "headline": "...",
  "primary_text": "...",
  "description": "...",
  "call_to_action": "...",
  "notes": "any platform-specific tips or variations to test"
}`;

    const aiResponse = await callAI(systemPrompt, userPrompt);
    if (!aiResponse) {
      return Response.json(
        { error: "AI service unavailable. Connect your Google account or try again." },
        { status: 503 }
      );
    }

    // Parse JSON from AI response
    let parsed;
    try {
      const cleaned = aiResponse.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch (e) {
      return Response.json({ error: "Failed to parse AI response", raw: aiResponse }, { status: 500 });
    }

    // Save generated creative to DB
    const result = await sql(
      `INSERT INTO ad_creatives (campaign_name, platform, ad_type, headline, primary_text, description, call_to_action, target_audience, service, location, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'draft', $11)
       RETURNING *`,
      [
        campaignName || null,
        platform,
        adType || "awareness",
        parsed.headline || null,
        parsed.primary_text || null,
        parsed.description || null,
        parsed.call_to_action || null,
        targetAudience || null,
        service || null,
        location || null,
        parsed.notes || notes || null,
      ]
    );

    return Response.json({ creative: result[0], generated: parsed });
  }

  // action === 'save' — save a manually created or edited creative
  if (action === "save" && creative) {
    const result = await sql(
      `INSERT INTO ad_creatives (campaign_name, platform, ad_type, headline, primary_text, description, call_to_action, target_audience, service, location, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        creative.campaign_name || campaignName || null,
        creative.platform || platform,
        creative.ad_type || adType || null,
        creative.headline || null,
        creative.primary_text || null,
        creative.description || null,
        creative.call_to_action || null,
        creative.target_audience || targetAudience || null,
        creative.service || service || null,
        creative.location || location || null,
        creative.status || "draft",
        creative.notes || notes || null,
      ]
    );

    return Response.json({ creative: result[0] });
  }

  return Response.json({ error: "Invalid action. Use 'generate' or 'save'." }, { status: 400 });
}

// PUT - update creative status or content
export async function PUT(request) {
  const user = await getCurrentUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id, ...updates } = await request.json();
  if (!id) return Response.json({ error: "Creative ID required" }, { status: 400 });

  const allowedFields = [
    "campaign_name", "platform", "ad_type", "headline", "primary_text",
    "description", "call_to_action", "target_audience", "service",
    "location", "status", "notes",
  ];

  const setClauses = [];
  const values = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key)) {
      setClauses.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  }

  if (setClauses.length === 0) {
    return Response.json({ error: "No valid fields to update" }, { status: 400 });
  }

  setClauses.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id);

  const result = await sql(
    `UPDATE ad_creatives SET ${setClauses.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
    values
  );

  if (!result.length) {
    return Response.json({ error: "Creative not found" }, { status: 404 });
  }

  return Response.json({ creative: result[0] });
}

// DELETE - remove a creative
export async function DELETE(request) {
  const user = await getCurrentUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return Response.json({ error: "Creative ID required" }, { status: 400 });

  const result = await sql(`DELETE FROM ad_creatives WHERE id = $1 RETURNING id`, [id]);
  if (!result.length) {
    return Response.json({ error: "Creative not found" }, { status: 404 });
  }

  return Response.json({ deleted: true, id: Number(id) });
}
