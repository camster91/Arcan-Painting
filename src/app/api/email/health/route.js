import { getCurrentUser, unauthorizedResponse } from "@/app/api/utils/auth";
import { getEmailProviderConfig } from "@/app/api/utils/email-delivery-provider";

export async function GET(request) {
  const user = await getCurrentUser(request);
  if (!user) return unauthorizedResponse();
  const config = getEmailProviderConfig();
  return Response.json({
    ok: config.configured,
    configured: config.configured,
    provider: config.label,
    provider_key: config.provider,
    sender: config.sender,
    message: config.configured
      ? "Email credentials are configured. Use a test delivery to verify provider acceptance."
      : `Email is unavailable: ${config.reason}.`,
  }, { status: config.configured ? 200 : 503 });
}
