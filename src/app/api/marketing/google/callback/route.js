import sql from "../../../utils/sql.js";

export async function GET(request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error || !code) {
    return Response.redirect("/admin/marketing?error=google_auth_failed");
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || "https://arcanpainting.ca"}/api/marketing/google/callback`;

  try {
    // Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) throw new Error("Token exchange failed");
    const tokens = await tokenRes.json();

    // Get user info
    const userRes = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      { headers: { Authorization: `Bearer ${tokens.access_token}` } }
    );
    const userInfo = await userRes.json();

    const expiry = tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000)
      : null;

    // Upsert connection (platform has UNIQUE constraint)
    await sql(
      `INSERT INTO marketing_connections (platform, access_token, refresh_token, token_expiry, scopes, account_email, account_name, is_active)
       VALUES ('google', $1, $2, $3, $4, $5, $6, true)
       ON CONFLICT (platform) DO UPDATE SET
         access_token = EXCLUDED.access_token,
         refresh_token = COALESCE(EXCLUDED.refresh_token, marketing_connections.refresh_token),
         token_expiry = EXCLUDED.token_expiry,
         account_email = EXCLUDED.account_email,
         account_name = EXCLUDED.account_name,
         is_active = true,
         updated_at = CURRENT_TIMESTAMP`,
      [
        tokens.access_token,
        tokens.refresh_token || null,
        expiry,
        tokens.scope,
        userInfo.email,
        userInfo.name,
      ]
    );

    return Response.redirect("/admin/marketing?connected=google");
  } catch (err) {
    console.error("[google/callback]", err);
    return Response.redirect("/admin/marketing?error=google_token_failed");
  }
}
