import { getCurrentUser } from "../../utils/auth.js";

export async function GET(request) {
  const user = await getCurrentUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const appId = process.env.META_APP_ID;
  if (!appId) {
    return Response.json(
      { error: "Meta App not configured. Add META_APP_ID to env vars." },
      { status: 501 }
    );
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || "https://arcanpainting.ca"}/api/marketing/facebook/callback`;

  const scopes = [
    "ads_management",
    "ads_read",
    "pages_manage_ads",
    "pages_read_engagement",
    "business_management",
    "instagram_basic",
    "instagram_content_publish",
  ].join(",");

  const authUrl = new URL("https://www.facebook.com/v19.0/dialog/oauth");
  authUrl.searchParams.set("client_id", appId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("scope", scopes);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("state", "arcan_facebook_connect");

  return Response.redirect(authUrl.toString());
}
