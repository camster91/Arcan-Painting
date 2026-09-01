import { describe, expect, it } from "vitest";
import { anonymizationConfirmation, privacyHoldReason } from "@/app/api/utils/privacy-domain";

describe("customer privacy controls", () => {
  it("requires an identifier-specific destructive confirmation", () => {
    expect(anonymizationConfirmation(42)).toBe("ANONYMIZE 42");
  });
  it("prioritizes unsettled and active-work holds before legal retention", () => {
    expect(privacyHoldReason({ unsettled_invoices: 1 })).toContain("unsettled invoice");
    expect(privacyHoldReason({ active_projects: 1 })).toContain("active project");
    expect(privacyHoldReason({ signed_contracts: 1 })).toContain("7 years");
    expect(privacyHoldReason({})).toBeNull();
  });
});
