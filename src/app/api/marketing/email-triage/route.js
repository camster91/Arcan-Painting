import { getGmailClient } from "@/lib/google.js";
import sql from "../../utils/sql.js";

export async function GET(request) {
  try {
    const gmail = getGmailClient();
    
    // 1. Fetch latest threads
    const listRes = await gmail.users.messages.list({
      userId: "me",
      q: "is:unread (estimate OR quote OR painting OR contact)",
      maxResults: 5
    });

    if (!listRes.data.messages) {
      return Response.json({ message: "No new leads found in inbox" });
    }

    const leadsFound = [];

    for (const msg of listRes.data.messages) {
      const detail = await gmail.users.messages.get({ userId: "me", id: msg.id });
      const snippet = detail.data.snippet;
      const body = detail.data.payload.parts?.[0]?.body?.data 
        ? Buffer.from(detail.data.payload.parts[0].body.data, 'base64').toString()
        : snippet;

      // 2. Use LLM to extract lead info from the email body
      const leadInfo = await extractLeadFromEmail(body);
      
      if (leadInfo && leadInfo.name && (leadInfo.email || leadInfo.phone)) {
        // 3. Save to database
        const [newLead] = await sql`
          INSERT INTO leads (name, email, phone, service_type, project_description, status)
          VALUES (${leadInfo.name}, ${leadInfo.email}, ${leadInfo.phone}, ${leadInfo.service_type}, ${leadInfo.description}, 'new')
          ON CONFLICT (email) DO NOTHING
          RETURNING id
        `;
        
        if (newLead) {
          leadsFound.push(leadInfo.name);
          // 4. Mark email as read/labeled
          await gmail.users.messages.batchModify({
            userId: "me",
            ids: [msg.id],
            removeLabelIds: ['UNREAD'],
            addLabelIds: ['Label_Leads'] // Assumes this label exists
          });
        }
      }
    }

    return Response.json({ success: true, leadsAdded: leadsFound });
  } catch (err) {
    console.error("[email-triage] Error:", err.message);
    return Response.json({ error: "Failed to triage emails" }, { status: 500 });
  }
}

async function extractLeadFromEmail(text) {
  // We'll use the same API key fallback logic as the Command Bar
  const geminiKey = process.env.GEMINI_API_KEY || (await getStoredApiKey('gemini_api'));
  if (!geminiKey) return null;

  const prompt = `Extract lead information from this email text. Return JSON ONLY.
Fields: name, email, phone, service_type, description.
Email Text: ${text}`;

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { response_mime_type: "application/json" }
      })
    });
    if (res.ok) {
      const data = await res.json();
      return JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text);
    }
  } catch (e) { return null; }
}

async function getStoredApiKey(platform) {
  const rows = await sql(`SELECT access_token FROM marketing_connections WHERE platform = $1 AND is_active = true LIMIT 1`, [platform]);
  return rows.length ? rows[0].access_token : null;
}
