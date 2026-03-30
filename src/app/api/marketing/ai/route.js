import { getCurrentUser } from "../../utils/auth.js";
import sql from "../../utils/sql.js";

async function getGoogleAccessToken() {
  const rows = await sql(
    `SELECT access_token, refresh_token, token_expiry FROM marketing_connections WHERE platform = 'google' AND is_active = true LIMIT 1`
  );
  if (!rows.length) return null;

  const { access_token, refresh_token, token_expiry } = rows[0];

  // If token is still valid (with 5min buffer), use it
  if (token_expiry && new Date(token_expiry) > new Date(Date.now() + 5 * 60 * 1000)) {
    return access_token;
  }

  // Token expired — refresh it
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

  // Update stored token
  await sql(
    `UPDATE marketing_connections SET access_token = $1, token_expiry = $2, updated_at = CURRENT_TIMESTAMP WHERE platform = 'google'`,
    [tokens.access_token, newExpiry]
  );

  return tokens.access_token;
}

async function getStoredApiKey(platform) {
  const rows = await sql(
    `SELECT access_token FROM marketing_connections WHERE platform = $1 AND is_active = true LIMIT 1`,
    [platform]
  );
  return rows.length ? rows[0].access_token : null;
}

export async function POST(request) {
  const user = await getCurrentUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { message, sessionId, conversationHistory = [] } = await request.json();
  if (!message) return Response.json({ error: "Message required" }, { status: 400 });

  // Load business context from app_settings, leads, and projects
  let businessContext = "";
  try {
    const [settings] = await sql`SELECT * FROM app_settings LIMIT 1`;
    const recentProjects = await sql`SELECT name, status, total_amount FROM projects ORDER BY created_at DESC LIMIT 3`;
    const recentLeads = await sql`SELECT name, service_type, status FROM leads ORDER BY created_at DESC LIMIT 3`;
    const activeCampaigns = await sql`SELECT platform, campaign_name, spend FROM live_campaigns WHERE status = 'active' LIMIT 3`;

    if (settings) {
      businessContext = `
Business: ${settings.company_name || "Arcan Painting"}
Email: ${settings.company_email || "info@arcanpainting.ca"}
Phone: ${settings.company_phone || ""}
Address: ${settings.company_address || "Toronto, ON"}
Services: Residential interior painting, exterior painting, commercial painting, cabinet painting
Service Area: Greater Toronto Area (GTA) - Toronto, Mississauga, Brampton, Markham, Richmond Hill, Vaughan, Oakville, Burlington

Recent Projects:
${recentProjects.map(p => `- ${p.name} (${p.status}, $${p.total_amount || 0})`).join('\n')}

Recent Leads:
${recentLeads.map(l => `- ${l.name} for ${l.service_type} (${l.status})`).join('\n')}

Active Marketing:
${activeCampaigns.map(c => `- ${c.platform}: ${c.campaign_name} ($${c.spend} spent)`).join('\n')}
`;
    }
  } catch (e) { 
    console.error("[marketing/ai] Context fetch error:", e.message);
  }

  const systemPrompt = `You are a digital marketing AI assistant and business growth partner for Arcan Painting, a professional painting company in Toronto, Canada.

CORE KNOWLEDGE BASE (Your Brain):
${businessContext}

Your mission is to do "One Thing Very Well": Complete all marketing and growth tasks autonomously or by providing expert guidance.

Your capabilities:
1.  **Lead Management**: Analyze recent leads, suggest follow-up scripts, and prioritize high-value prospects.
2.  **Marketing Mastery**: Write high-converting Google Business posts, Facebook ads, and Instagram captions. 
3.  **Strategic Outreach**: Draft email sequences for real estate agents and property managers based on their specific roles.
4.  **Reputation Management**: Draft professional, brand-aligned responses to Google reviews.
5.  **Technical Integration**: Provide step-by-step instructions for connecting Facebook, Google, and other platforms using the connection status data.

PERSONALITY:
- Professional, local (GTA-focused), proactive, and encouraging.
- Refer to the business as "Arcan Painting" or "we/us" when appropriate.
- When helping connect platforms, provide clear, actionable steps.
- If you notice a high-value lead or a project status that needs attention, proactively mention it.

TASK COMPLETION:
- If asked to write something, provide the full text ready to be copy-pasted.
- If asked "how are we doing", summarize the recent projects, leads, and active campaigns from your brain.
- Always aim to be the "One Thing Very Well" agent for the current task.`;

  // Build messages array
  const messages = [
    ...conversationHistory.slice(-10),
    { role: "user", content: message },
  ];

  let reply = null;
  let modelUsed = null;

  // Strategy 1: Use Google OAuth token from marketing_connections (no API key needed)
  try {
    const oauthToken = await getGoogleAccessToken();
    if (oauthToken) {
      const geminiMessages = messages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

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
            contents: geminiMessages,
            generationConfig: { maxOutputTokens: 1024, temperature: 0.7 },
          }),
        }
      );
      if (res.ok) {
        const data = await res.json();
        reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
        modelUsed = "gemini-2.0-flash (oauth)";
      }
    }
  } catch (e) {
    console.error("[marketing/ai] Gemini OAuth error:", e.message);
  }

  // Strategy 2: Fall back to GEMINI_API_KEY if OAuth unavailable
  const geminiKey = process.env.GEMINI_API_KEY || (await getStoredApiKey('gemini_api'));
  if (geminiKey && !reply) {
    try {
      const geminiMessages = messages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents: geminiMessages,
            generationConfig: { maxOutputTokens: 1024, temperature: 0.7 },
          }),
        }
      );
      if (res.ok) {
        const data = await res.json();
        reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
        modelUsed = "gemini-2.0-flash";
      }
    } catch (e) {
      console.error("[marketing/ai] Gemini API key error:", e.message);
    }
  }

  // Strategy 3: Ollama Cloud fallback
  let ollamaUrl = process.env.OLLAMA_CLOUD_URL;
  let ollamaKey = process.env.OLLAMA_CLOUD_KEY;
  
  const storedOllama = await getStoredApiKey('ollama_cloud');
  if (storedOllama) {
    if (storedOllama.startsWith('http')) ollamaUrl = storedOllama;
    else ollamaKey = storedOllama;
  }

  if (ollamaUrl && !reply) {
    try {
      const res = await fetch(`${ollamaUrl}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ollamaKey}`,
        },
        body: JSON.stringify({
          model: process.env.OLLAMA_MODEL || "qwen2.5:7b",
          messages: [{ role: "system", content: systemPrompt }, ...messages],
          stream: false,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        reply = data.message?.content;
        modelUsed = "ollama-cloud";
      }
    } catch (e) {
      console.error("[marketing/ai] Ollama Cloud error:", e.message);
    }
  }

  // Strategy 4: OpenAI (ChatGPT) fallback
  const openaiKey = process.env.OPENAI_API_KEY || (await getStoredApiKey('openai_api'));
  if (openaiKey && !reply) {
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [{ role: "system", content: systemPrompt }, ...messages],
          max_tokens: 1024,
          temperature: 0.7,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        reply = data.choices?.[0]?.message?.content;
        modelUsed = "gpt-4o";
      }
    } catch (e) {
      console.error("[marketing/ai] OpenAI API error:", e.message);
    }
  }

  if (!reply) {
    return Response.json(
      { error: "AI service unavailable. Connect your Google account or try again." },
      { status: 503 }
    );
  }

  // Save conversation to DB
  const sid = sessionId || crypto.randomUUID();
  try {
    await sql`INSERT INTO ai_conversations (session_id, role, content, model) VALUES (${sid}, ${"user"}, ${message}, ${modelUsed})`;
    await sql`INSERT INTO ai_conversations (session_id, role, content, model) VALUES (${sid}, ${"assistant"}, ${reply}, ${modelUsed})`;
  } catch (e) { /* non-critical */ }

  return Response.json({ reply, modelUsed, sessionId: sid });
}
