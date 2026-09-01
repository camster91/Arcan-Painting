import { describe, expect, test } from "vitest";
import { requiredApiPermission, requiresAdminApiAccess } from "@/app/api/utils/api-access-policy";

describe("company-wide API access policy", () => {
  test("requires an admin role for company-wide CRM and financial resources", () => {
    expect(requiresAdminApiAccess("/contracts/42/send")).toBe(true);
    expect(requiresAdminApiAccess("/api/invoices/42/pdf")).toBe(true);
    expect(requiresAdminApiAccess("/admin/gallery")).toBe(true);
    expect(requiresAdminApiAccess("/api/admin/chat")).toBe(true);
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

describe("method-aware API permissions", () => {
  it("separates read and write authority", () => {
    expect(requiredApiPermission("/api/invoices", "GET")).toBe("finance.read");
    expect(requiredApiPermission("/api/invoices", "POST")).toBe("finance.write");
    expect(requiredApiPermission("/contracts/42", "GET")).toBe("contracts.read");
    expect(requiredApiPermission("/contracts/42", "DELETE")).toBe("contracts.write");
  });

  it("defaults sensitive admin routes to owner-only", () => {
    expect(requiredApiPermission("/api/admin/audit-logs", "GET")).toBe("owner.only");
    expect(requiredApiPermission("/admin/dashboard", "GET")).toBe("dashboard.read");
    expect(requiredApiPermission("/projects", "GET")).toBeNull();
  });
});
