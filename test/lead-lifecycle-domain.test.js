import { describe, expect, it } from "vitest";
import { assertLeadTransition, canTransitionLead } from "@/app/api/utils/lead-lifecycle-domain";

describe("lead lifecycle", () => {
  it("supports the normal qualification and sales journey", () => {
    expect(canTransitionLead("new", "contacted")).toBe(true);
    expect(canTransitionLead("contacted", "qualified")).toBe(true);
    expect(canTransitionLead("qualified", "proposal_sent")).toBe(true);
    expect(canTransitionLead("proposal_sent", "won")).toBe(true);
  });

  it("rejects skipped or reversed terminal transitions", () => {
    expect(canTransitionLead("new", "won")).toBe(false);
    expect(canTransitionLead("won", "contacted")).toBe(false);
    expect(() => assertLeadTransition("qualified", "won")).toThrow(/cannot move/);
  });

  it("allows a lost lead to be deliberately reopened", () => {
    expect(canTransitionLead("lost", "contacted")).toBe(true);
  });
});
