import { beforeEach, describe, expect, test, vi } from "vitest";

const sql = vi.fn(); const getCurrentUser = vi.fn(); const auditLog = vi.fn();
vi.mock("@/app/api/utils/sql", () => ({ default: sql }));
vi.mock("@/app/api/utils/auth", () => ({ getCurrentUser }));
vi.mock("@/app/api/utils/audit", () => ({ auditLog }));
vi.mock("@/app/api/utils/rate-limit", () => ({ generalLimiter: vi.fn(() => null) }));
const { GET, POST } = await import("@/app/api/project-expenses/route");

describe("project expense access", () => {
  beforeEach(() => { sql.mockReset(); getCurrentUser.mockReset(); auditLog.mockReset(); });

  test("keeps the financial ledger owner-only", async () => {
    getCurrentUser.mockResolvedValue({ id: 3, username: "crew@example.test", role: "painter" });
    const response = await GET(new Request("https://example.test/api/project-expenses?project_id=4"));
    expect(response.status).toBe(403);
    expect(sql).not.toHaveBeenCalled();
  });

  test("allows assigned crew to record a validated field cost", async () => {
    getCurrentUser.mockResolvedValue({ id: 3, username: "crew@example.test", role: "painter" });
    sql.mockResolvedValueOnce([{ id: 4 }]).mockResolvedValueOnce([{ id: 8, project_id: 4, total_amount: "113.00" }]);
    const response = await POST(new Request("https://example.test/api/project-expenses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ project_id: 4, category: "material", description: "Primer and patch compound", amount: 100, tax_amount: 13, incurred_on: "2026-09-01" }) }));
    expect(response.status).toBe(201);
    expect(String(sql.mock.calls[0][0])).toContain("project_crew_members");
    expect(auditLog).toHaveBeenCalledWith(expect.objectContaining({ action: "project_expense.create" }));
  });
});
