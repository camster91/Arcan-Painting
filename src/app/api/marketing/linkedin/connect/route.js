import { getCurrentUser } from "../../utils/auth.js";

export async function GET(request) {
  const user = await getCurrentUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const clientId = process.env.LINKEDIN_CLIENT_ID;
  if (!clientId) {
    return Response.json(
      {
        error: "LinkedIn not configured. Add LINKEDIN_CLIENT_ID to env vars.",
        setup_url: "https://www.linkedin.com/developers/apps/new",
      },
      { status: 501 }
    );
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || "https://arcanpainting.ca"}/api/marketing/linkedin/callback`;

  // w_member_social = post as member, r_liteprofile = read profile
  const scopes = ["openid", "profile", "w_member_social", "r_liteprofile"].join(" ");

  const authUrl = new URL("https://www.linkedin.com/oauth/v2/authorization");
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("scope", scopes);
  authUrl.searchParams.set("state", "arcan_linkedin_connect");

  return Response.redirect(authUrl.toString());
}
