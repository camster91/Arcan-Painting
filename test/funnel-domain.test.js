import { describe, expect, it } from "vitest";
import { summarizeFunnel } from "../src/app/api/utils/funnel-domain";

describe("sales funnel metrics", () => {
  it("calculates conversion, ticket, CPL, and ROAS without fabricated denominators", () => {
    expect(
      summarizeFunnel({
        leads: 20,
        qualified: 10,
        estimates: 8,
        won: 3,
        lost: 2,
        revenue: 6000,
        spend: 1000,
      }),
    ).toEqual({
      leads: 20,
      qualified: 10,
      estimates: 8,
      won: 3,
      lost: 2,
      revenue: 6000,
      spend: 1000,
      lead_to_qualified_percent: 50,
      qualified_to_estimate_percent: 80,
      close_rate_percent: 60,
      average_ticket: 2000,
      cost_per_lead: 50,
      return_on_ad_spend: 6,
    });
    expect(summarizeFunnel()).toMatchObject({
      close_rate_percent: null,
      cost_per_lead: null,
      return_on_ad_spend: null,
    });
  });
});
