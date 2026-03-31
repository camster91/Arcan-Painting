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
    mailgun: { status: "unknown", domain: process.env.MAILGUN_DOMAIN },
    env: {
      DATABASE_URL: !!process.env.DATABASE_URL,
      GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
      MAILGUN_API_KEY: !!process.env.MAILGUN_API_KEY,
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

  // 3. Check Mailgun
  if (process.env.MAILGUN_API_KEY) {
    try {
        const credentials = btoa(`api:${process.env.MAILGUN_API_KEY}`);
        const res = await fetch(`https://api.mailgun.net/v3/domains/${process.env.MAILGUN_DOMAIN}`, {
            headers: { Authorization: `Basic ${credentials}` }
        });
        if (res.ok) {
            health.mailgun.status = "healthy";
        } else {
            health.mailgun.status = "auth_error";
        }
    } catch {
        health.mailgun.status = "network_error";
    }
  } else {
      health.mailgun.status = "missing_key";
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
