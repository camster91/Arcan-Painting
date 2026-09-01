import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
const automation = readFileSync(
  resolve(process.cwd(), "src/app/api/marketing-automation/route.js"),
  "utf8",
);
const worker = readFileSync(
  resolve(process.cwd(), "src/app/api/delayed-emails/route.js"),
  "utf8",
);
describe("consent-aware lifecycle marketing", () => {
  it("requires owner confirmation and active opt-in before queueing", () => {
    expect(automation).toContain("Owner access required");
    expect(automation).toContain("confirm_queue");
    expect(automation).toContain("marketing_consent_status = 'opted_in'");
  });
  it("rechecks consent at delivery time and cancels unsafe jobs", () => {
    expect(worker).toContain("requires_marketing_consent");
    expect(worker).toContain("Marketing consent is not active");
    expect(worker).toContain("status = 'cancelled'");
  });
  it("covers follow-up, reactivation, review, and referral events", () => {
    for (const event of [
      "estimate_follow_up",
      "dormant_lead",
      "review_request",
      "referral_request",
    ])
      expect(automation).toContain(event);
  });
});
