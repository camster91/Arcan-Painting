import { beforeEach, describe, expect, test, vi } from "vitest";

const sql = vi.fn();
sql.transaction = vi.fn();
const getCurrentUser = vi.fn();
const auditLog = vi.fn();
vi.mock("@/app/api/utils/sql", () => ({ default: sql }));
vi.mock("@/app/api/utils/auth", () => ({ getCurrentUser }));
vi.mock("@/app/api/utils/permissions", () => ({
  hasPermission: vi.fn(() => true),
}));
vi.mock("@/app/api/utils/audit", () => ({ auditLog }));

const { DELETE } = await import("@/app/api/estimates/route");

describe("estimate deletion safety", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCurrentUser.mockResolvedValue({
      id: 1,
      username: "owner@example.test",
      role: "owner",
    });
  });

  test.each(["sent", "approved"])(
    "retains a %s estimate as a business record",
    async (status) => {
      const txn = vi.fn().mockResolvedValueOnce([
        {
          id: 8,
          estimate_number: "EST-8",
          project_title: "Kitchen",
          status,
          project_count: 0,
          contract_count: 0,
        },
      ]);
      sql.transaction.mockImplementation((callback) => callback(txn));

      const response = await DELETE(
        new Request("https://example.test/api/estimates", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: 8 }),
        }),
      );

      expect(response.status).toBe(409);
      expect(txn).toHaveBeenCalledOnce();
      expect(auditLog).not.toHaveBeenCalled();
    },
  );

  test("deletes an unlinked draft in the same transaction", async () => {
    const txn = vi
      .fn()
      .mockResolvedValueOnce([
        {
          id: 8,
          estimate_number: "EST-8",
          project_title: "Kitchen",
          status: "draft",
          project_count: 0,
          contract_count: 0,
        },
      ])
      .mockResolvedValueOnce([]);
    sql.transaction.mockImplementation((callback) => callback(txn));

    const response = await DELETE(
      new Request("https://example.test/api/estimates", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: 8 }),
      }),
    );

    expect(response.status).toBe(200);
    expect(txn).toHaveBeenCalledTimes(2);
    expect(String(txn.mock.calls[1][0])).toContain("DELETE FROM estimates");
    expect(String(txn.mock.calls[1][0])).not.toContain("DELETE FROM projects");
    expect(auditLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: "estimate.delete", resourceId: 8 }),
    );
  });
});
