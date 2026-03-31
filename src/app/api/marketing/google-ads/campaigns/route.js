import { getCurrentUser } from "../../../utils/auth.js";
import sql from "../../../utils/sql.js";

// Helper: get valid Google access token with auto-refresh
async function getGoogleAccessToken() {
  const rows = await sql(
    `SELECT access_token, refresh_token, token_expiry FROM marketing_connections WHERE platform = 'google' AND is_active = true LIMIT 1`
  );
  if (!rows.length) return null;

  const { access_token, refresh_token, token_expiry } = rows[0];

  if (token_expiry && new Date(token_expiry) > new Date(Date.now() + 5 * 60 * 1000)) {
    return access_token;
  }

  if (!refresh_token) return null;

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) return null;

  const tokens = await res.json();
  const newExpiry = tokens.expires_in
    ? new Date(Date.now() + tokens.expires_in * 1000)
    : null;

  await sql(
    `UPDATE marketing_connections SET access_token = $1, token_expiry = $2, updated_at = CURRENT_TIMESTAMP WHERE platform = 'google'`,
    [tokens.access_token, newExpiry]
  );

  return tokens.access_token;
}

// Helper: get Google Ads customer ID from marketing_connections metadata
async function getAdsCustomerId() {
  const rows = await sql(
    `SELECT metadata FROM marketing_connections WHERE platform = 'google' AND is_active = true LIMIT 1`
  );
  if (!rows.length) return null;
  const metadata = typeof rows[0].metadata === "string" ? JSON.parse(rows[0].metadata) : rows[0].metadata;
  return metadata?.ads_customer_id || null;
}

// Helper: call Google Ads API
async function googleAdsRequest(method, path, token, devToken, customerId, body) {
  const url = `https://googleads.googleapis.com/v17/${path}`;
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    "developer-token": devToken,
  };
  if (customerId) {
    headers["login-customer-id"] = customerId.replace(/-/g, "");
  }

  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(url, opts);
  const data = await res.json();

  if (!res.ok) {
    const errMsg = data.error?.message || JSON.stringify(data.error || data);
    throw new Error(errMsg);
  }
  return data;
}

// GET — list Google Ads campaigns (from local DB, optionally sync from API)
export async function GET(request) {
  const user = await getCurrentUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  if (!devToken) {
    return Response.json({
      error: "Setup required",
      setup_steps: ["Apply for Google Ads Developer Token at ads.google.com/aw/apicenter"],
    }, { status: 400 });
  }

  const customerId = await getAdsCustomerId();
  if (!customerId) {
    return Response.json({
      error: "Select your Google Ads account first",
      code: "NO_CUSTOMER",
    }, { status: 400 });
  }

  const url = new URL(request.url);
  const sync = url.searchParams.get("sync") === "true";

  // Get local campaigns
  const campaigns = await sql`
    SELECT lc.*, ac.campaign_name AS creative_name, ac.headline, ac.primary_text
    FROM live_campaigns lc
    LEFT JOIN ad_creatives ac ON lc.creative_id = ac.id
    WHERE lc.platform = 'google_ads'
    ORDER BY lc.created_at DESC
  `;

  // Optionally sync stats from Google Ads API
  if (sync) {
    const token = await getGoogleAccessToken();
    if (token) {
      try {
        const cleanId = customerId.replace(/-/g, "");
        const data = await googleAdsRequest(
          "POST",
          `customers/${cleanId}/googleAds:search`,
          token,
          devToken,
          customerId,
          {
            query: `SELECT campaign.id, campaign.name, campaign.status,
                    campaign_budget.amount_micros,
                    metrics.impressions, metrics.clicks, metrics.conversions,
                    metrics.cost_micros
                    FROM campaign
                    WHERE campaign.status != 'REMOVED'
                    ORDER BY campaign.id DESC
                    LIMIT 50`,
          }
        );

        for (const row of data.results || []) {
          const camp = row.campaign;
          const metrics = row.metrics;
          if (camp?.id && metrics) {
            await sql(
              `UPDATE live_campaigns SET
                 impressions = $1, clicks = $2, conversions = $3,
                 spent = $4, status = $5, updated_at = CURRENT_TIMESTAMP
               WHERE platform_campaign_id = $6 AND platform = 'google_ads'`,
              [
                parseInt(metrics.impressions || 0, 10),
                parseInt(metrics.clicks || 0, 10),
                Math.round(parseFloat(metrics.conversions || 0)),
                parseFloat(metrics.costMicros || 0) / 1_000_000,
                camp.status?.toLowerCase() || "active",
                String(camp.id),
              ]
            );
          }
        }

        // Re-fetch updated campaigns
        const updated = await sql`
          SELECT lc.*, ac.campaign_name AS creative_name, ac.headline, ac.primary_text
          FROM live_campaigns lc
          LEFT JOIN ad_creatives ac ON lc.creative_id = ac.id
          WHERE lc.platform = 'google_ads'
          ORDER BY lc.created_at DESC
        `;
        return Response.json({ campaigns: updated, synced: true });
      } catch (err) {
        console.error("[google-ads/campaigns] sync error:", err.message);
      }
    }
  }

  return Response.json({ campaigns });
}

// POST — create a new Google Ads campaign
export async function POST(request) {
  const user = await getCurrentUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  if (!devToken) {
    return Response.json({ error: "Google Ads Developer Token not configured" }, { status: 400 });
  }

  const token = await getGoogleAccessToken();
  if (!token) {
    return Response.json({ error: "Google not connected or token expired. Please reconnect." }, { status: 400 });
  }

  const customerId = await getAdsCustomerId();
  if (!customerId) {
    return Response.json({ error: "Select your Google Ads account first", code: "NO_CUSTOMER" }, { status: 400 });
  }

  const body = await request.json();
  const {
    creative_id,
    campaign_name,
    daily_budget,
    total_budget,
    start_date,
    end_date,
    headline,
    primary_text,
    description,
    target_url = "https://arcanpainting.ca",
    targeting = {},
    campaign_type = "SEARCH",
  } = body;

  if (!campaign_name) {
    return Response.json({ error: "campaign_name is required" }, { status: 400 });
  }

  let finalCreativeId = creative_id;

  // If no creative_id but fields are provided, create a new ad_creative
  if (!finalCreativeId && (headline || primary_text || description)) {
    try {
      const creativeRes = await sql(
        `INSERT INTO ad_creatives (campaign_name, platform, headline, primary_text, description, status)
         VALUES ($1, 'google_ads', $2, $3, $4, 'active')
         RETURNING id`,
        [campaign_name, headline || null, primary_text || null, description || null]
      );
      finalCreativeId = creativeRes[0].id;
    } catch (err) {
      console.error("[google-ads/campaigns] Failed to create creative:", err);
    }
  }

  const cleanId = customerId.replace(/-/g, "");
  const resourcePrefix = `customers/${cleanId}`;

  try {
    // Step 1: Create a campaign budget
    const budgetMicros = daily_budget
      ? Math.round(daily_budget * 1_000_000)
      : total_budget
        ? Math.round(total_budget * 1_000_000)
        : 20_000_000; // $20/day default

    const budgetData = await googleAdsRequest(
      "POST",
      `${resourcePrefix}/campaignBudgets:mutate`,
      token,
      devToken,
      customerId,
      {
        operations: [{
          create: {
            name: `${campaign_name} - Budget`,
            amountMicros: String(budgetMicros),
            deliveryMethod: "STANDARD",
            ...(total_budget && !daily_budget
              ? { explicitlyShared: false }
              : {}),
          },
        }],
      }
    );
    const budgetResource = budgetData.results?.[0]?.resourceName;

    // Step 2: Create the campaign
    const campaignPayload = {
      name: campaign_name,
      advertisingChannelType: campaign_type,
      status: "PAUSED", // Start paused for safety
      campaignBudget: budgetResource,
      networkSettings: {
        targetGoogleSearch: true,
        targetSearchNetwork: true,
        targetContentNetwork: false,
      },
      ...(start_date && { startDate: start_date.replace(/-/g, "") }),
      ...(end_date && { endDate: end_date.replace(/-/g, "") }),
    };

    const campaignData = await googleAdsRequest(
      "POST",
      `${resourcePrefix}/campaigns:mutate`,
      token,
      devToken,
      customerId,
      { operations: [{ create: campaignPayload }] }
    );
    const campaignResource = campaignData.results?.[0]?.resourceName;
    const campaignId = campaignResource?.split("/").pop();

    // Step 3: Create an ad group
    const adGroupData = await googleAdsRequest(
      "POST",
      `${resourcePrefix}/adGroups:mutate`,
      token,
      devToken,
      customerId,
      {
        operations: [{
          create: {
            name: `${campaign_name} - Ad Group`,
            campaign: campaignResource,
            status: "ENABLED",
            type: "SEARCH_STANDARD",
            cpcBidMicros: "2000000", // $2 default CPC
          },
        }],
      }
    );
    const adGroupResource = adGroupData.results?.[0]?.resourceName;

    // Step 4: Create a responsive search ad (if creative content available)
    let headline1 = headline || "Professional Painting Services";
    let headline2 = "Free Estimates Available";
    let headline3 = "Licensed & Insured Painters";
    let desc1 = primary_text || "Transform your home with Arcan Painting. Quality workmanship, fully insured. Get a free estimate today!";
    let desc2 = description || "Ottawa's trusted painting professionals. Interior, exterior, and commercial painting services.";

    if (finalCreativeId) {
      const creativeRows = await sql`SELECT * FROM ad_creatives WHERE id = ${finalCreativeId}`;
      if (creativeRows.length) {
        const c = creativeRows[0];
        if (c.headline) headline1 = c.headline.substring(0, 30);
        if (c.primary_text) desc1 = c.primary_text.substring(0, 90);
        if (c.description) desc2 = c.description.substring(0, 90);
      }
    }

    const adData = await googleAdsRequest(
      "POST",
      `${resourcePrefix}/adGroupAds:mutate`,
      token,
      devToken,
      customerId,
      {
        operations: [{
          create: {
            adGroup: adGroupResource,
            status: "ENABLED",
            ad: {
              responsiveSearchAd: {
                headlines: [
                  { text: headline1.substring(0, 30), pinnedField: "HEADLINE_1" },
                  { text: headline2.substring(0, 30) },
                  { text: headline3.substring(0, 30) },
                ],
                descriptions: [
                  { text: desc1.substring(0, 90), pinnedField: "DESCRIPTION_1" },
                  { text: desc2.substring(0, 90) },
                ],
                path1: "painting",
                path2: "services",
              },
              finalUrls: [target_url],
            },
          },
        }],
      }
    );

    // Step 5: Add location targeting if specified
    if (targeting.locationIds?.length) {
      const locationOps = targeting.locationIds.map((locId) => ({
        create: {
          campaign: campaignResource,
          location: { geoTargetConstant: `geoTargetConstants/${locId}` },
        },
      }));
      await googleAdsRequest(
        "POST",
        `${resourcePrefix}/campaignCriteria:mutate`,
        token,
        devToken,
        customerId,
        { operations: locationOps }
      );
    }

    // Step 6: Add keyword targeting if specified
    if (targeting.keywords?.length) {
      const keywordOps = targeting.keywords.map((kw) => ({
        create: {
          adGroup: adGroupResource,
          keyword: {
            text: typeof kw === "string" ? kw : kw.text,
            matchType: (typeof kw === "string" ? "PHRASE" : kw.matchType) || "PHRASE",
          },
        },
      }));
      await googleAdsRequest(
        "POST",
        `${resourcePrefix}/adGroupCriteria:mutate`,
        token,
        devToken,
        customerId,
        { operations: keywordOps }
      );
    }

    // Step 7: Save to local database
    const saved = await sql(
      `INSERT INTO live_campaigns
         (platform, platform_campaign_id, creative_id, campaign_name, status,
          daily_budget, total_budget, start_date, end_date, target_url, targeting, platform_data)
       VALUES ('google_ads', $1, $2, $3, 'paused', $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        campaignId,
        finalCreativeId || null,
        campaign_name,
        daily_budget || null,
        total_budget || null,
        start_date || null,
        end_date || null,
        target_url,
        JSON.stringify(targeting),
        JSON.stringify({
          campaignResource,
          adGroupResource,
          budgetResource,
          campaignType: campaign_type,
        }),
      ]
    );

    return Response.json({
      success: true,
      campaign: saved[0],
      google: { campaignId, adGroupResource },
      message: "Google Ads campaign created (PAUSED). Go to the Campaigns tab to activate it.",
    });
  } catch (err) {
    console.error("[google-ads/campaigns] POST error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// PATCH — pause, activate, or update a Google Ads campaign
export async function PATCH(request) {
  const user = await getCurrentUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  const token = await getGoogleAccessToken();
  if (!token || !devToken) {
    return Response.json({ error: "Google Ads not connected or configured" }, { status: 400 });
  }

  const customerId = await getAdsCustomerId();
  if (!customerId) {
    return Response.json({ error: "No Google Ads customer ID" }, { status: 400 });
  }

  const { id, action } = await request.json();
  if (!id || !action) {
    return Response.json({ error: "id and action are required" }, { status: 400 });
  }

  const rows = await sql`SELECT * FROM live_campaigns WHERE id = ${id} AND platform = 'google_ads'`;
  if (!rows.length) {
    return Response.json({ error: "Campaign not found" }, { status: 404 });
  }

  const campaign = rows[0];
  let newStatus;

  if (action === "pause") newStatus = "PAUSED";
  else if (action === "activate") newStatus = "ENABLED";
  else return Response.json({ error: "Invalid action. Use 'pause' or 'activate'." }, { status: 400 });

  const cleanId = customerId.replace(/-/g, "");
  const campaignResource = `customers/${cleanId}/campaigns/${campaign.platform_campaign_id}`;

  try {
    await googleAdsRequest(
      "POST",
      `customers/${cleanId}/campaigns:mutate`,
      token,
      devToken,
      customerId,
      {
        operations: [{
          update: {
            resourceName: campaignResource,
            status: newStatus,
          },
          updateMask: "status",
        }],
      }
    );

    const dbStatus = newStatus === "ENABLED" ? "active" : "paused";
    await sql(
      `UPDATE live_campaigns SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [dbStatus, id]
    );

    return Response.json({ success: true, status: dbStatus });
  } catch (err) {
    console.error("[google-ads/campaigns] PATCH error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// DELETE — remove a Google Ads campaign
export async function DELETE(request) {
  const user = await getCurrentUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  const token = await getGoogleAccessToken();
  const customerId = await getAdsCustomerId();

  const { id } = await request.json();
  const rows = await sql`SELECT * FROM live_campaigns WHERE id = ${id} AND platform = 'google_ads'`;
  if (!rows.length) {
    return Response.json({ error: "Campaign not found" }, { status: 404 });
  }

  const campaign = rows[0];

  // Try to remove from Google Ads (set to REMOVED status — Google doesn't truly delete)
  if (token && devToken && customerId && campaign.platform_campaign_id) {
    try {
      const cleanId = customerId.replace(/-/g, "");
      const campaignResource = `customers/${cleanId}/campaigns/${campaign.platform_campaign_id}`;
      await googleAdsRequest(
        "POST",
        `customers/${cleanId}/campaigns:mutate`,
        token,
        devToken,
        customerId,
        {
          operations: [{
            remove: campaignResource,
          }],
        }
      );
    } catch (err) {
      console.error("[google-ads/campaigns] Google delete error:", err.message);
    }
  }

  await sql`DELETE FROM live_campaigns WHERE id = ${id}`;
  return Response.json({ success: true });
}
