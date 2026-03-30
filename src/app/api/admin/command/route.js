import { getCurrentUser } from "../../utils/auth.js";
import { getBusinessContext, callLLM } from "@/lib/ai-bridge.js";

export async function POST(request) {
  const user = await getCurrentUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { command } = await request.json();
  if (!command) return Response.json({ error: "Command required" }, { status: 400 });

  // Get business context from bridge
  const context = await getBusinessContext();

  const systemPrompt = `You are the Command Center for Arcan Painting's admin dashboard.
Business: ${context.company}
Services: Interior, Exterior, Cabinet Painting in the GTA.

Your job is to interpret the user's command and return a structured response.
COMMANDS you can handle:
1. SEARCH: "Find [name]", "Show me leads from [city]"
2. ANALYZE: "How many leads this week?", "What is our revenue?"
3. CONTENT: "Write a [post/email/ad] about [topic]"
4. ACTION: "Create a lead for [name]", "Update project [name] to completed"

Context: ${JSON.stringify(context)}

RESPONSE FORMAT (JSON):
{
  "reply": "Friendly response to the user",
  "action": "search | analyze | content | redirect",
  "data": { ... any relevant data or search results ... },
  "redirectUrl": "/admin/leads?search=..." // if applicable
}`;

  try {
    const replyData = await callLLM(command, systemPrompt, { json: true });
    return Response.json(replyData);
  } catch (err) {
    console.error("[admin/command] Error:", err.message);
    return Response.json({ error: "Command AI unavailable" }, { status: 503 });
  }
}
