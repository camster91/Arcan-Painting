import { getCurrentUser, unauthorizedResponse } from "@/app/api/utils/auth";

const OPENCLAW_URL = process.env.OPENCLAW_URL || "http://localhost:18789";
const OPENCLAW_TOKEN = process.env.OPENCLAW_TOKEN || "";
const REQUEST_TIMEOUT_MS = 30000;

export async function POST(request) {
  // Auth check
  const user = await getCurrentUser(request);
  if (!user) {
    return unauthorizedResponse();
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { message, conversationId } = body;

  if (!message || typeof message !== "string" || !message.trim()) {
    return new Response(JSON.stringify({ error: "Message is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Build the task prompt
  const task = `Answer this question about the Arcan Painting system: ${message.trim()}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const openclawRes = await fetch(`${OPENCLAW_URL}/api/agents/spawn`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(OPENCLAW_TOKEN ? { Authorization: `Bearer ${OPENCLAW_TOKEN}` } : {}),
      },
      body: JSON.stringify({
        task,
        ...(conversationId ? { conversationId } : {}),
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!openclawRes.ok) {
      const errText = await openclawRes.text().catch(() => "Unknown error");
      console.error("[AI Chat] OpenClaw error:", openclawRes.status, errText);
      return new Response(
        JSON.stringify({
          error: `AI assistant returned an error (${openclawRes.status}). Please try again.`,
        }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    const data = await openclawRes.json();

    // OpenClaw spawn response shape: { sessionId, result, ... }
    const response =
      data.result ||
      data.response ||
      data.output ||
      data.message ||
      "No response from AI assistant.";

    const newConversationId = data.sessionId || data.conversationId || conversationId || null;

    return new Response(
      JSON.stringify({
        response,
        conversationId: newConversationId,
        timestamp: new Date().toISOString(),
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    clearTimeout(timeoutId);

    if (err.name === "AbortError") {
      return new Response(
        JSON.stringify({
          error: "Request timed out. The AI assistant took too long to respond.",
        }),
        { status: 504, headers: { "Content-Type": "application/json" } }
      );
    }

    // Connection refused / network error
    const isConnectionError =
      err.code === "ECONNREFUSED" ||
      err.cause?.code === "ECONNREFUSED" ||
      err.message?.includes("fetch failed") ||
      err.message?.includes("ECONNREFUSED");

    if (isConnectionError) {
      return new Response(
        JSON.stringify({
          error:
            "Could not connect to the AI assistant. Make sure OpenClaw is running on this machine.",
        }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      );
    }

    console.error("[AI Chat] Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred. Please try again." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
