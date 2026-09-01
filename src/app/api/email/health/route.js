import { getCurrentUser, unauthorizedResponse } from "@/app/api/utils/auth";

export async function GET(request) {
  const user = await getCurrentUser(request);
  if (!user) return unauthorizedResponse();
  const configured = Boolean(process.env.MATON_API_KEY && process.env.GOOGLE_EMAIL);
  return Response.json({
    ok: configured,
    configured,
    provider: "Maton Gmail gateway",
    sender: process.env.GOOGLE_EMAIL || null,
    message: configured
      ? "Email credentials are configured. Use a test delivery to verify provider acceptance."
      : "Email is unavailable until MATON_API_KEY and GOOGLE_EMAIL are configured.",
  }, { status: configured ? 200 : 503 });
}
