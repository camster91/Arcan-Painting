import { getCurrentUser } from "../../utils/auth.js";
import sql from "../../utils/sql.js";

export async function GET(request) {
  const user = await getCurrentUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // 1. Lead Stats
    const [leadsTotal] = await sql`SELECT count(*)::int as count FROM leads WHERE deleted_at IS NULL`;
    const [leadsNew] = await sql`SELECT count(*)::int as count FROM leads WHERE status = 'new' AND deleted_at IS NULL`;
    const [leadsQualified] = await sql`SELECT count(*)::int as count FROM leads WHERE qualification_score >= 60 AND deleted_at IS NULL`;

    // 2. Project Stats
    const [revenueTotal] = await sql`SELECT COALESCE(sum(total_amount), 0)::numeric as sum FROM projects WHERE status = 'completed'`;
    const [revenuePending] = await sql`SELECT COALESCE(sum(total_amount), 0)::numeric as sum FROM projects WHERE status IN ('active', 'scheduled')`;

    // 3. Marketing Stats
    const [spendTotal] = await sql`SELECT COALESCE(sum(spend), 0)::numeric as sum FROM live_campaigns`;
    const activeCampaignsCount = await sql`SELECT count(*)::int as count FROM live_campaigns WHERE status = 'active'`;
    
    // 4. ROI Calculation
    const roi = spendTotal.sum > 0 ? ((revenueTotal.sum - spendTotal.sum) / spendTotal.sum * 100).toFixed(1) : 0;

    return Response.json({
      leads: {
        total: leadsTotal.count,
        new: leadsNew.count,
        qualified: leadsQualified.count,
      },
      projects: {
        totalRevenue: revenueTotal.sum,
        pendingRevenue: revenuePending.sum,
      },
      marketing: {
        totalSpend: spendTotal.sum,
        activeCampaigns: activeCampaignsCount[0].count,
        roiPercent: roi,
      }
    });
  } catch (err) {
    console.error("[marketing/stats] Error:", err.message);
    return Response.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
