import { describe, expect, it } from "vitest";
import {
  CUSTOMER_PORTAL_MAX_DAYS,
  canCustomerApproveEstimate,
  canCustomerDecideChangeOrder,
  canCustomerSignContract,
  createCustomerPortalToken,
  hashCustomerPortalToken,
  isCustomerPortalToken,
  normalizePortalExpiryDays,
  sanitizeCustomerPhotoUrls,
  shouldNotifyCustomerProgress,
} from "@/app/api/utils/customer-portal";
import { getPublicSeo } from "@/utils/publicSeo";

describe("customer portal bearer links", () => {
  it("creates 256-bit base64url tokens and stores deterministic SHA-256 hashes", () => {
    const token = createCustomerPortalToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(isCustomerPortalToken(token)).toBe(true);
    expect(hashCustomerPortalToken(token)).toMatch(/^[a-f0-9]{64}$/);
    expect(hashCustomerPortalToken(token)).toBe(hashCustomerPortalToken(token));
    expect(createCustomerPortalToken()).not.toBe(token);
  });

  it("rejects malformed token values before database lookup", () => {
    for (const token of ["", "short", "../portal", "a".repeat(42), "a".repeat(44)]) {
      expect(isCustomerPortalToken(token)).toBe(false);
      expect(() => hashCustomerPortalToken(token)).toThrow("Invalid portal token");
    }
  });

  it("bounds link expiry", () => {
    expect(normalizePortalExpiryDays()).toBe(30);
    expect(normalizePortalExpiryDays("1")).toBe(1);
    expect(normalizePortalExpiryDays(CUSTOMER_PORTAL_MAX_DAYS)).toBe(90);
    for (const days of [0, 91, 1.5, "nope"]) expect(() => normalizePortalExpiryDays(days)).toThrow();
  });

  it("only exposes safe HTTPS project photos", () => {
    expect(sanitizeCustomerPhotoUrls(["https://cdn.example.test/photo.jpg", "javascript:alert(1)", "/private.jpg", null])).toEqual(["https://cdn.example.test/photo.jpg"]);
  });

  it("keeps progress private unless staff explicitly shares it", () => {
    expect(shouldNotifyCustomerProgress({ customerVisible: false, isMilestone: true, progressPercentage: 100 })).toBe(false);
    expect(shouldNotifyCustomerProgress({ customerVisible: true, isMilestone: true, progressPercentage: 0 })).toBe(true);
    expect(shouldNotifyCustomerProgress({ customerVisible: true, isMilestone: false, progressPercentage: 25 })).toBe(true);
  });

  it("does not place a bearer token in SEO metadata", () => {
    const token = createCustomerPortalToken();
    const seo = getPublicSeo(`/portal/${token}`);
    expect(seo.indexable).toBe(false);
    expect(seo.canonical).toBe("https://arcanpainting.ca/portal");
    expect(JSON.stringify(seo)).not.toContain(token);
  });
});

describe("customer portal action gates", () => {
  it("only permits customer decisions on records explicitly sent for review", () => {
    expect(canCustomerApproveEstimate("sent")).toBe(true);
    expect(canCustomerApproveEstimate("draft")).toBe(false);
    expect(canCustomerSignContract("sent")).toBe(true);
    expect(canCustomerSignContract("viewed")).toBe(true);
    expect(canCustomerSignContract("draft")).toBe(false);
    expect(canCustomerDecideChangeOrder("sent")).toBe(true);
    expect(canCustomerDecideChangeOrder("approved")).toBe(false);
  });
});
