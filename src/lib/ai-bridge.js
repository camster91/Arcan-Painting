import sql from "@/app/api/utils/sql.js";

/**
 * AI Bridge Utility for Arcan Painting
 * Centralizes LLM choice, context loading, and API calls.
 */

export async function getBusinessContext() {
  try {
    const [settings] = await sql`SELECT * FROM app_settings LIMIT 1`;
    const recentProjects = await sql`SELECT name, status, total_amount FROM projects ORDER BY created_at DESC LIMIT 5`;
    const recentLeads = await sql`SELECT name, service_type, status FROM leads ORDER BY created_at DESC LIMIT 5`;

    return {
      company: settings?.company_name || "Arcan Painting",
      email: settings?.company_email || "info@arcanpainting.ca",
      projects: recentProjects,
      leads: recentLeads,
      contextString: `
Business: ${settings?.company_name || "Arcan Painting"}
Services: Interior, Exterior, Cabinet Painting in the GTA.
Recent Work: ${recentProjects.map(p => p.name).join(', ')}
`
    };
  } catch (e) {
    return { contextString: "Arcan Painting - GTA Painting Service" };
  }
}

async function getStoredApiKey(platform) {
  const rows = await sql(`SELECT access_token FROM marketing_connections WHERE platform = $1 AND is_active = true LIMIT 1`, [platform]);
  return rows.length ? rows[0].access_token : null;
}

export async function callLLM(prompt, systemPrompt, options = {}) {
  const geminiKey = process.env.GEMINI_API_KEY || (await getStoredApiKey('gemini_api'));
  const openaiKey = process.env.OPENAI_API_KEY || (await getStoredApiKey('openai_api'));

  // 1. Try Gemini first (most integrated with Google OAuth)
  if (geminiKey) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { 
            response_mime_type: options.json ? "application/json" : "text/plain",
            maxOutputTokens: options.maxTokens || 1024,
            temperature: options.temperature || 0.7
          }
        })
      });
      if (res.ok) {
        const data = await res.json();
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
        return options.json ? JSON.parse(content) : content;
      }
    } catch (e) { console.error("Gemini failed:", e.message); }
  }

  // 2. Fallback to OpenAI
  if (openaiKey) {
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${openaiKey}` },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [{ role: "system", content: systemPrompt }, { role: "user", content: prompt }],
          response_format: options.json ? { type: "json_object" } : { type: "text" },
          max_tokens: options.maxTokens || 1024,
          temperature: options.temperature || 0.7
        })
      });
      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;
        return options.json ? JSON.parse(content) : content;
      }
    } catch (e) { console.error("OpenAI failed:", e.message); }
  }

  throw new Error("No AI service available. Please connect Google or OpenAI.");
}
