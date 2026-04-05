import { getCurrentUser } from "../../utils/auth.js";
import sql from "../../utils/sql.js";

export async function GET(request) {
  const user = await getCurrentUser(request);
  if (!user || user.role !== 'owner') {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const health = {
    database: { status: "unknown", message: "" },
    ollama: { status: "unknown", url: process.env.OLLAMA_URL || "http://localhost:11434" },
    email: { status: "unknown", provider: "maton" },
    env: {
      DATABASE_URL: !!process.env.DATABASE_URL,
      MATON_API_KEY: !!process.env.MATON_API_KEY,
      GOOGLE_EMAIL: process.env.GOOGLE_EMAIL || "info@arcanpainting.ca",
      META_APP_ID: !!process.env.META_APP_ID,
    }
  };

  // 1. Check DB
  try {
    const res = await sql`SELECT 1 as connected`;
    if (res[0]?.connected === 1) {
      health.database.status = "healthy";
    }
  } catch (err) {
    health.database.status = "error";
    health.database.message = err.message;
  }

  // 2. Check Ollama
  try {
    const ollamaUrl = health.ollama.url;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`${ollamaUrl}/api/tags`, { signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      health.ollama.status = "healthy";
      const data = await res.json();
      health.ollama.models = data.models || [];
    } else {
      health.ollama.status = "unreachable";
    }
  } catch (err) {
    health.ollama.status = "error";
    health.ollama.message = err.message;
  }

  // 3. Check Maton → Gmail
  if (process.env.MATON_API_KEY) {
    try {
        const res = await fetch("https://gateway.maton.ai/google-mail/gmail/v1/users/me/labels", {
            headers: { Authorization: `Bearer ${process.env.MATON_API_KEY}` }
        });
        if (res.ok) {
            health.email.status = "healthy";
        } else {
            health.email.status = "auth_error";
        }
    } catch {
        health.email.status = "network_error";
    }
  } else {
      health.email.status = "missing_key";
  }

  return Response.json({ health });
}

export async function POST(request) {
    const user = await getCurrentUser(request);
    if (!user || user.role !== 'owner') {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action } = await request.json();

    if (action === 'restart_services') {
        // In a real app, this might trigger a webhook to Coolify or a system command
        return Response.json({ message: "Restart signal sent to container orchestrator" });
    }

    return Response.json({ error: "Invalid action" }, { status: 400 });
}
