import { describe, expect, it } from "vitest";
import { validateLeadInput } from "@/app/api/utils/insert-lead";

describe("public lead input validation", () => {
  it("accepts values within the CRM schema limits", () => {
    expect(validateLeadInput({
      name: "A".repeat(255),
      email: "a@b.test",
      phone: "1".repeat(50),
      serviceType: "s".repeat(100),
      projectDescription: "d".repeat(4_000),
      address: "a".repeat(2_000),
    })).toBeNull();
  });

  it("rejects invalid types and values above the public limits", () => {
    expect(validateLeadInput({ name: "A".repeat(256) }))
      .toBe("Name must be 255 characters or fewer");
    expect(validateLeadInput({ phone: { unexpected: true } }))
      .toBe("Phone must be text");
    expect(validateLeadInput({ projectDescription: "d".repeat(4_001) }))
      .toBe("Project description must be 4000 characters or fewer");
  });
});
