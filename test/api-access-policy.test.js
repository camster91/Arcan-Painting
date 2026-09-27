import { describe, expect, test } from "vitest";
import { requiresAdminApiAccess } from "@/app/api/utils/api-access-policy";

describe("company-wide API access policy", () => {
  test("requires an admin role for company-wide CRM and financial resources", () => {
    expect(requiresAdminApiAccess("/contracts/42/send")).toBe(true);
    expect(requiresAdminApiAccess("/api/invoices/42/pdf")).toBe(true);
    expect(requiresAdminApiAccess("/admin/gallery")).toBe(true);
    expect(requiresAdminApiAccess("/api/admin/audit-logs")).toBe(true);
    expect(requiresAdminApiAccess("/api/admin/migrate-passwords")).toBe(true);
    expect(requiresAdminApiAccess("/contract-templates")).toBe(true);
    expect(requiresAdminApiAccess("/payments")).toBe(true);
  });

  test("does not make painter-scoped or public workflows owner-only", () => {
    expect(requiresAdminApiAccess("/projects")).toBe(false);
    expect(requiresAdminApiAccess("/time-tracking")).toBe(false);
    expect(requiresAdminApiAccess("/contact")).toBe(false);
  });
});
