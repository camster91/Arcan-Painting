import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { LEAD_STATUSES, schemas } from "@/app/api/utils/validate";

const optionValues = (text, pattern) =>
  [...text.matchAll(pattern)].map((m) => m[1]).filter((v) => v !== "all");

// Only the <select name="status"> block, not the contact-method selects.
const statusSelect = (file) => readFileSync(file, "utf8").match(/<select\s+name="status"[\s\S]*?<\/select>/)[0];

describe("lead statuses", () => {
  it("accepts every status the admin dropdowns offer", () => {
    const offered = [
      ...optionValues(readFileSync("src/app/admin/leads/page.jsx", "utf8").match(/const statusOptions = \[[\s\S]*?\];/)[0], /\{ label: "[^"]+", value: "([a-z_]+)" \}/g),
      ...optionValues(statusSelect("src/components/admin/leads/LeadEditModal.jsx"), /<option value="([a-z_]+)"/g),
    ];
    expect(offered).toContain("estimate_scheduled");
    for (const status of offered) expect(LEAD_STATUSES).toContain(status);
  });

  it("validates estimate_sent on lead updates", async () => {
    await expect(schemas.leadUpdate.validate({ id: 1, status: "estimate_sent" })).resolves.toBeTruthy();
    await expect(schemas.leadUpdate.validate({ id: 1, status: "bogus" })).rejects.toThrow();
  });
});
