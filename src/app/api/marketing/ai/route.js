import { getCurrentUser } from "../../utils/auth.js";
import sql from "../../utils/sql.js";

export async function POST(request) {
  const user = await getCurrentUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { message, sessionId, conversationHistory = [] } = await request.json();
  if (!message) return Response.json({ error: "Message required" }, { status: 400 });

  // Load business context from app_settings
  let businessContext = "";
  try {
    const settings = await sql`SELECT * FROM app_settings LIMIT 1`;
    if (settings.length > 0) {
      const s = settings[0];
      businessContext = `
Business: ${s.company_name || "Arcan Painting"}
Email: ${s.company_email || "info@arcanpainting.ca"}
Phone: ${s.company_phone || ""}
Address: ${s.company_address || "Toronto, ON"}
Services: Residential interior painting, exterior painting, commercial painting, cabinet painting
Service Area: Greater Toronto Area (GTA) - Toronto, Mississauga, Brampton, Markham, Richmond Hill, Vaughan, Oakville, Burlington
`;
    }
  } catch (e) { /* ignore */ }

  const systemPrompt = `You are a digital marketing AI assistant for a professional painting company in Toronto, Canada.
${businessContext}

Your job is to help the business owner with:
- Writing social media posts, Google Business posts, ad copy
- Setting up and explaining digital marketing platforms (Facebook Ads, Google Ads, Google Business Profile)
- Drafting email outreach sequences for real estate agents and property managers
- Responding to Google reviews professionally
- SEO blog post ideas and outlines
- Explaining step-by-step how to connect and use each marketing platform

Be friendly, practical, and always tailor advice to the local Toronto/GTA painting market.
When helping connect platforms, give clear step-by-step instructions.
If something breaks or an error occurs, help diagnose and fix it.`;

  // Build messages array
  const messages = [
    ...conversationHistory.slice(-10),
    { role: "user", content: message },
  ];

  let reply = null;
  let modelUsed = null;

  // Try Gemini API (direct, using env var)
  const geminiKey = process.env.GEMINI_API_KEY;
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
      console.error("[marketing/ai] Gemini error:", e.message);
    }
  }

  // Fallback: Ollama Cloud (if configured)
  const ollamaUrl = process.env.OLLAMA_CLOUD_URL;
  const ollamaKey = process.env.OLLAMA_CLOUD_KEY;
  if (ollamaUrl && ollamaKey && !reply) {
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

  if (!reply) {
    return Response.json(
      { error: "AI service unavailable. Please try again." },
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
