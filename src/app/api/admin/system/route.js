import { getCurrentUser } from "../../utils/auth.js";
import sql from "../../utils/sql.js";
import { getEmailProviderConfig } from "../../utils/email-delivery-provider.js";

export async function GET(request) {
  const user = await getCurrentUser(request);
  if (!user || user.role !== "owner") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const emailProvider = getEmailProviderConfig();
  const health = {
    database: { status: "unknown", message: "" },
    ollama: { status: "unknown", provider: "OpenClaw", url: process.env.OPENCLAW_URL || "not configured" },
    email: { status: emailProvider.configured ? "configured" : "missing", provider: emailProvider.label, sender: emailProvider.sender, reason: emailProvider.reason, automations_enabled: process.env.EMAIL_AUTOMATIONS_ENABLED === "true" },
    env: {
      DATABASE_URL: !!process.env.DATABASE_URL,
      EMAIL_PROVIDER: emailProvider.configured,
      STRIPE: !!(process.env.STRIPE_SECRET_KEY && (process.env.ARCAN_STRIPE_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET)),
      OPENCLAW: !!(process.env.OPENCLAW_URL && process.env.OPENCLAW_TOKEN),
      GOOGLE_MAPS: !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
      SENTRY: !!process.env.SENTRY_DSN,
      ANALYTICS: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === "true",
      META_APP_ID: !!process.env.META_APP_ID,
    },
    queue: { pending: 0, failed: 0 },
  };

  // 1. Check DB
  try {
    const started = Date.now();
    const res = await sql`SELECT 1 as connected`;
    if (res[0]?.connected === 1) {
      health.database.status = "healthy";
      health.database.latency_ms = Date.now() - started;
    }
    const [queue] = await sql`SELECT COUNT(*) FILTER (WHERE status = 'pending')::int AS pending, COUNT(*) FILTER (WHERE status = 'failed')::int AS failed FROM delayed_emails`;
    health.queue = queue || health.queue;
  } catch (err) {
    health.database.status = "error";
    health.database.message = err.message;
  }

  // A network probe is meaningful only when the provider is configured.
  if (process.env.OPENCLAW_URL && process.env.OPENCLAW_TOKEN) try {
    const ollamaUrl = health.ollama.url;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`${ollamaUrl}/health`, { signal: controller.signal, headers: { Authorization: `Bearer ${process.env.OPENCLAW_TOKEN}` } });
    clearTimeout(timeout);
    if (res.ok) {
      health.ollama.status = "healthy";
    } else {
      health.ollama.status = "unreachable";
    }
  } catch (err) {
    health.ollama.status = "error";
    health.ollama.message = err.message;
  } else health.ollama.status = "missing";

  return Response.json({ health });
}

export async function POST(request) {
    const user = await getCurrentUser(request);
    if (!user || user.role !== "owner") {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    return Response.json({ error: "Remote restart is intentionally unavailable; use the authenticated Ashbi runbook" }, { status: 501 });
}
