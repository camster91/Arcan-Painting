import { beforeEach, describe, expect, test, vi } from "vitest";

const sql = vi.fn();
const getCurrentUser = vi.fn();
const hasPermission = vi.fn();
const auditLog = vi.fn();
vi.mock("@/app/api/utils/sql", () => ({ default: sql }));
vi.mock("@/app/api/utils/auth", () => ({ getCurrentUser }));
vi.mock("@/app/api/utils/permissions", () => ({ hasPermission }));
vi.mock("@/app/api/utils/audit", () => ({ auditLog }));
const { PUT } = await import("@/app/api/estimates/route");

describe("generic estimate update lifecycle guard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCurrentUser.mockResolvedValue({
      id: 1,
      username: "owner@example.test",
      role: "owner",
    });
    hasPermission.mockReturnValue(true);
  });

  test("rejects approval outside the transactional approval action", async () => {
    sql.mockResolvedValueOnce([{ id: 12, status: "sent", created_by: 1 }]);
    const response = await PUT(
      new Request("https://example.test/api/estimates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: 12, status: "approved" }),
      }),
    );
    expect(response.status).toBe(409);
    expect(sql).toHaveBeenCalledOnce();
    expect(auditLog).not.toHaveBeenCalled();
  });

  test("keeps an approved sold estimate read-only", async () => {
    sql.mockResolvedValueOnce([{ id: 12, status: "approved", created_by: 1 }]);
    const response = await PUT(
      new Request("https://example.test/api/estimates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: 12, total_cost: 1 }),
      }),
    );
    expect(response.status).toBe(409);
    expect(sql).toHaveBeenCalledOnce();
  });
});
