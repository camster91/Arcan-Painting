const percentage = (numerator, denominator) =>
  denominator > 0 ? Math.round((numerator / denominator) * 1000) / 10 : null;

export function summarizeFunnel(input = {}) {
  const leads = Number(input.leads) || 0;
  const qualified = Number(input.qualified) || 0;
  const estimates = Number(input.estimates) || 0;
  const won = Number(input.won) || 0;
  const lost = Number(input.lost) || 0;
  const revenue = Number(input.revenue) || 0;
  const spend = Number(input.spend) || 0;
  return {
    leads,
    qualified,
    estimates,
    won,
    lost,
    revenue,
    spend,
    lead_to_qualified_percent: percentage(qualified, leads),
    qualified_to_estimate_percent: percentage(estimates, qualified),
    close_rate_percent: percentage(won, won + lost),
    average_ticket: won > 0 ? Math.round((revenue / won) * 100) / 100 : 0,
    cost_per_lead: leads > 0 ? Math.round((spend / leads) * 100) / 100 : null,
    return_on_ad_spend:
      spend > 0 ? Math.round((revenue / spend) * 100) / 100 : null,
  };
}
