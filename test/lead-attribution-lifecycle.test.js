import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const insertion = readFileSync(resolve(process.cwd(), "src/app/api/utils/insert-lead.js"), "utf8");
const route = readFileSync(resolve(process.cwd(), "src/app/api/leads/route.js"), "utf8");
const ui = readFileSync(resolve(process.cwd(), "src/components/admin/leads/LeadEditModal.jsx"), "utf8");

describe("lead attribution and lifecycle", () => {
  it("persists sanitized attribution on the lead record", () => {
    expect(insertion).toContain("meta_lead_id, attribution");
    expect(insertion).toContain("JSON.stringify(attribution || {})");
  });
  it("aligns UI stages with API stages and records outcomes", () => {
    expect(ui).not.toContain('value="estimate_scheduled"');
    expect(ui).not.toContain('value="estimate_sent"');
    expect(ui).toContain('value="qualified"');
    expect(ui).toContain('value="proposal_sent"');
    expect(route).toContain("qualified_at");
    expect(route).toContain("proposal_sent_at");
    expect(route).toContain("lost_reason");
  });
});
