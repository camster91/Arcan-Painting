import { describe, expect, it } from "vitest";
import { validateGalleryPublication } from "@/app/api/admin/gallery/route";

describe("portfolio publication controls", () => {
  it("allows drafts and review items to remain private", () => {
    expect(validateGalleryPublication({ publication_status: "draft", visible: false })).toBeNull();
    expect(validateGalleryPublication({ publication_status: "review", visible: false })).toBeNull();
  });

  it("requires consent and proof before approval", () => {
    expect(validateGalleryPublication({ publication_status: "approved", visible: false, customer_consent_confirmed: true, business_proof_confirmed: false })).toMatch(/consent and business proof/i);
  });

  it("only publishes fully approved evidence", () => {
    expect(validateGalleryPublication({ publication_status: "review", visible: true, customer_consent_confirmed: true, business_proof_confirmed: true })).toMatch(/only approved/i);
    expect(validateGalleryPublication({ publication_status: "approved", visible: true, customer_consent_confirmed: true, business_proof_confirmed: true })).toBeNull();
  });
});
