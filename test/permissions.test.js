import { describe, expect, it } from "vitest";
import { hasPermission, isStaffRole, normalizeRole } from "../src/app/api/utils/permissions";

describe("contractor operating roles", () => {
  it("defines six staff roles while mapping legacy accounts safely", () => {
    for (const role of ["owner", "office", "estimator", "project_manager", "crew", "finance_readonly"]) expect(isStaffRole(role)).toBe(true);
    expect(normalizeRole("admin")).toBe("office");
    expect(normalizeRole("painter")).toBe("crew");
  });
  it("separates financial, field, sales, and owner authority", () => {
    expect(hasPermission("finance_readonly", "finance.read")).toBe(true);
    expect(hasPermission("finance_readonly", "finance.write")).toBe(false);
    expect(hasPermission("crew", "field.write")).toBe(true);
    expect(hasPermission("crew", "customers.read")).toBe(false);
    expect(hasPermission("estimator", "estimates.write")).toBe(true);
    expect(hasPermission("project_manager", "projects.write")).toBe(true);
    expect(hasPermission("owner", "anything")).toBe(true);
  });
});
