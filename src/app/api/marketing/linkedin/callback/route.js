import sql from "../../../utils/sql.js";

export async function GET(request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error || !code) {
    return Response.redirect("/admin/marketing?error=linkedin_auth_failed");
  }

  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || "https://arcanpainting.ca"}/api/marketing/linkedin/callback`;

  try {
    // Exchange code for tokens
    const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!tokenRes.ok) throw new Error("Token exchange failed");
    const tokens = await tokenRes.json();

    // Get profile info
    const profileRes = await fetch(
      "https://api.linkedin.com/v2/me?projection=(id,localizedFirstName,localizedLastName)",
      { headers: { Authorization: `Bearer ${tokens.access_token}` } }
    );
    const profile = await profileRes.json();

    const expiry = tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000)
      : null;
    const name = `${profile.localizedFirstName || ""} ${profile.localizedLastName || ""}`.trim();

    // Upsert connection (platform has UNIQUE constraint)
    await sql(
      `INSERT INTO marketing_connections (platform, access_token, refresh_token, token_expiry, account_name, metadata, is_active)
       VALUES ('linkedin', $1, $2, $3, $4, $5, true)
       ON CONFLICT (platform) DO UPDATE SET
         access_token = EXCLUDED.access_token,
         refresh_token = COALESCE(EXCLUDED.refresh_token, marketing_connections.refresh_token),
         token_expiry = EXCLUDED.token_expiry,
         account_name = EXCLUDED.account_name,
         is_active = true,
         updated_at = CURRENT_TIMESTAMP`,
      [
        tokens.access_token,
        tokens.refresh_token || null,
        expiry,
        name,
        JSON.stringify({ memberId: profile.id }),
      ]
    );

    return Response.redirect("/admin/marketing?connected=linkedin");
  } catch (err) {
    console.error("[linkedin/callback]", err);
    return Response.redirect("/admin/marketing?error=linkedin_token_failed");
  }
}
