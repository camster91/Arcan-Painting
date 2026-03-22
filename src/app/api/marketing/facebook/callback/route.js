import sql from "../../../utils/sql.js";

export async function GET(request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error || !code) {
    return Response.redirect("/admin/marketing?error=facebook_auth_failed");
  }

  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || "https://arcanpainting.ca"}/api/marketing/facebook/callback`;

  try {
    // Exchange code for short-lived token
    const tokenRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${code}`
    );
    if (!tokenRes.ok) throw new Error("Token exchange failed");
    const shortToken = await tokenRes.json();

    // Exchange for long-lived token (60 days)
    const longRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortToken.access_token}`
    );
    const longToken = await longRes.json();

    // Get user info
    const meRes = await fetch(
      `https://graph.facebook.com/v19.0/me?fields=id,name,email&access_token=${longToken.access_token}`
    );
    const me = await meRes.json();

    // Get ad accounts
    const adAccountsRes = await fetch(
      `https://graph.facebook.com/v19.0/me/adaccounts?fields=id,name,currency,account_status&access_token=${longToken.access_token}`
    );
    const adAccounts = await adAccountsRes.json();
    const firstAccount = adAccounts.data?.[0];

    const expiry = longToken.expires_in
      ? new Date(Date.now() + longToken.expires_in * 1000)
      : null;

    // Upsert into marketing_connections (platform has UNIQUE constraint)
    await sql(
      `INSERT INTO marketing_connections (platform, access_token, token_expiry, account_email, account_name, metadata, is_active)
       VALUES ('facebook', $1, $2, $3, $4, $5, true)
       ON CONFLICT (platform) DO UPDATE SET
         access_token = EXCLUDED.access_token,
         token_expiry = EXCLUDED.token_expiry,
         account_email = EXCLUDED.account_email,
         account_name = EXCLUDED.account_name,
         metadata = EXCLUDED.metadata,
         is_active = true,
         updated_at = CURRENT_TIMESTAMP`,
      [
        longToken.access_token,
        expiry,
        me.email || me.id,
        me.name,
        JSON.stringify({
          userId: me.id,
          adAccountId: firstAccount?.id,
          adAccounts: adAccounts.data || [],
        }),
      ]
    );

    return Response.redirect("/admin/marketing?connected=facebook");
  } catch (err) {
    console.error("[facebook/callback]", err);
    return Response.redirect("/admin/marketing?error=facebook_token_failed");
  }
}
