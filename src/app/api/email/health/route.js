export async function GET() {
  try {
    const apiKey = process.env.RESEND_API_KEY || process.env.RESEND;

    if (!apiKey) {
      return Response.json({
        ok: false,
        configured: false,
        message:
          "Resend API key is not configured. Set RESEND (preferred) or RESEND_API_KEY in Project Settings → Secrets.",
        default_from: "info@arcanpainting.ca",
        domains: [],
        last_checked: new Date().toISOString(),
      });
    }

    // Call a harmless endpoint to validate the key without sending an email
    const res = await fetch("https://api.resend.com/domains", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    // Try to parse JSON, but handle non-JSON responses too
    let data = null;
    try {
      data = await res.json();
    } catch {}

    if (res.status === 401) {
      return Response.json(
        {
          ok: false,
          configured: true,
          message:
            "Resend API key appears to be invalid or expired (401 Unauthorized).",
          default_from: "info@arcanpainting.ca",
          domains: [],
          last_checked: new Date().toISOString(),
        },
        { status: 200 },
      );
    }

    if (!res.ok) {
      return Response.json(
        {
          ok: false,
          configured: true,
          message: `Unexpected response from Resend [${res.status}] ${res.statusText}`,
          details: data || null,
          default_from: "info@arcanpainting.ca",
          domains: [],
          last_checked: new Date().toISOString(),
        },
        { status: 200 },
      );
    }

    return Response.json({
      ok: true,
      configured: true,
      message: "Resend API key is set and accepted by the API.",
      default_from: "info@arcanpainting.ca",
      domains: data?.data || [],
      domainsCount: Array.isArray(data?.data) ? data.data.length : 0,
      last_checked: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Resend health check failed:", err?.message || err);
    return Response.json({
      ok: false,
      configured: !!(process.env.RESEND_API_KEY || process.env.RESEND),
      message: "Health check failed due to an unexpected error.",
      default_from: "info@arcanpainting.ca",
      last_checked: new Date().toISOString(),
    });
  }
}
