import { getCurrentUser } from "../../utils/auth.js";
import sql from "../../utils/sql.js";

// GET — list campaigns from marketing_campaigns and live_campaigns
export async function GET(request) {
  const user = await getCurrentUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // Get marketing_campaigns (structured campaign definitions)
    const marketingCampaigns = await sql`
      SELECT id, campaign_name AS name, platform, status,
             budget AS total_budget,
             NULL::numeric AS daily_budget,
             start_date, end_date, created_at, updated_at
      FROM marketing_campaigns
      ORDER BY created_at DESC
    `;

    // Get live_campaigns (actual live ads from Meta/Google)
    const liveCampaigns = await sql`
      SELECT lc.id, lc.campaign_name AS name, lc.platform, lc.status,
             lc.daily_budget, lc.total_budget,
             lc.start_date, lc.end_date, lc.created_at, lc.updated_at,
             ac.campaign_name AS creative_name, ac.headline, ac.primary_text
      FROM live_campaigns lc
      LEFT JOIN ad_creatives ac ON lc.creative_id = ac.id
      ORDER BY lc.created_at DESC
    `;

    // Stats summary
    const total = marketingCampaigns.length + liveCampaigns.length;
    const active = [...marketingCampaigns, ...liveCampaigns].filter(
      (c) => c.status === "active" || c.status === "ENABLED"
    ).length;
    const paused = [...marketingCampaigns, ...liveCampaigns].filter(
      (c) => c.status === "paused" || c.status === "PAUSED"
    ).length;
    const completed = [...marketingCampaigns, ...liveCampaigns].filter(
      (c) => c.status === "completed" || c.status === "COMPLETED"
    ).length;

    const totalBudget = [...marketingCampaigns, ...liveCampaigns].reduce(
      (sum, c) => sum + (parseFloat(c.daily_budget) || 0) + (parseFloat(c.total_budget) || 0),
      0
    );

    return Response.json({
      marketing_campaigns: marketingCampaigns,
      live_campaigns: liveCampaigns,
      stats: {
        total,
        active,
        paused,
        completed,
        totalBudget: Math.round(totalBudget * 100) / 100,
      },
    });
  } catch (error) {
    console.error("GET /api/marketing/campaigns error:", error);
    return Response.json({ error: "Failed to load campaigns" }, { status: 500 });
  }
}

// POST — create a new campaign (marketing_campaigns table)
export async function POST(request) {
  const user = await getCurrentUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const {
      name,
      platform = "facebook",
      daily_budget,
      total_budget,
      start_date,
      end_date,
      targeting = {},
      status = "draft",
    } = body;

    if (!name) {
      return Response.json({ error: "Campaign name is required" }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO marketing_campaigns
        (name, platform, status, daily_budget, total_budget, start_date, end_date, targeting)
      VALUES (
        ${name},
        ${platform},
        ${status},
        ${daily_budget || null},
        ${total_budget || null},
        ${start_date || null},
        ${end_date || null},
        ${JSON.stringify(targeting)}
      )
      RETURNING *
    `;

    return Response.json({ success: true, campaign: result[0] });
  } catch (error) {
    console.error("POST /api/marketing/campaigns error:", error);
    return Response.json({ error: "Failed to create campaign" }, { status: 500 });
  }
}

// PATCH — update campaign status
export async function PATCH(request) {
  const user = await getCurrentUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id, status, platform } = await request.json();
    if (!id || !status) {
      return Response.json({ error: "id and status are required" }, { status: 400 });
    }

    // Determine which table based on platform hint
    if (platform === "google_ads" || platform === "meta") {
      await sql`
        UPDATE live_campaigns
        SET status = ${status}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
      `;
    } else {
      await sql`
        UPDATE marketing_campaigns
        SET status = ${status}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
      `;
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("PATCH /api/marketing/campaigns error:", error);
    return Response.json({ error: "Failed to update campaign" }, { status: 500 });
  }
}