import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
const source = readFileSync(
  resolve(process.cwd(), "src/app/api/sales-marketing-report/route.js"),
  "utf8",
);
describe("sales and marketing reporting", () => {
  it("is owner-only, non-cacheable, and uses cleared cash", () => {
    expect(source).toContain("Owner access required");
    expect(source).toContain("private, no-store");
    expect(source).toContain("pay.status = 'cleared'");
  });
  it("reports durable attribution and lost reasons", () => {
    expect(source).toContain("utmSource");
    expect(source).toContain("utmCampaign");
    expect(source).toContain("landingPage");
    expect(source).toContain("lost_reason");
  });
});
