export async function GET() {
  try {
    const apiKey = process.env.MATON_API_KEY;

    if (!apiKey) {
      return Response.json({
        ok: false,
        configured: false,
        message:
          "Maton API key is not configured. Set MATON_API_KEY in Project Settings → Secrets.",
        default_from: process.env.GOOGLE_EMAIL || "info@arcanpainting.ca",
        provider: "maton",
        last_checked: new Date().toISOString(),
      });
    }

    // Validate key by listing Gmail labels (lightweight read-only call)
    const res = await fetch(
      "https://gateway.maton.ai/google-mail/gmail/v1/users/me/labels",
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      },
    );

    if (res.status === 401 || res.status === 403) {
      return Response.json({
        ok: false,
        configured: true,
        message: "Maton API key is invalid or Gmail connection is not set up.",
        provider: "maton",
        default_from: process.env.GOOGLE_EMAIL || "info@arcanpainting.ca",
        last_checked: new Date().toISOString(),
      });
    }

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      return Response.json({
        ok: false,
        configured: true,
        message: `Unexpected response from Maton gateway [${res.status}] ${res.statusText}`,
        details: data,
        provider: "maton",
        default_from: process.env.GOOGLE_EMAIL || "info@arcanpainting.ca",
        last_checked: new Date().toISOString(),
      });
    }

    const data = await res.json().catch(() => ({}));

    return Response.json({
      ok: true,
      configured: true,
      message: "Maton → Gmail gateway is connected and working.",
      provider: "maton",
      default_from: process.env.GOOGLE_EMAIL || "info@arcanpainting.ca",
      labelsCount: data?.labels?.length || 0,
      last_checked: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Email health check failed:", err?.message || err);
    return Response.json({
      ok: false,
      configured: !!process.env.MATON_API_KEY,
      message: "Health check failed due to an unexpected error.",
      provider: "maton",
      default_from: process.env.GOOGLE_EMAIL || "info@arcanpainting.ca",
      last_checked: new Date().toISOString(),
    });
  }
}
