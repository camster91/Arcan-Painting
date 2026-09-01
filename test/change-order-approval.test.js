import { beforeEach, describe, expect, test, vi } from "vitest";

const sql = vi.fn(); const txSql = vi.fn(); const auditLog = vi.fn();
sql.transaction = vi.fn(async (callback) => callback(txSql));
vi.mock("@/app/api/utils/sql", () => ({ default: sql }));
vi.mock("@/app/api/utils/auth", () => ({ getCurrentUser: vi.fn(async () => ({ id: 1, username: "owner@example.test", role: "owner" })), unauthorizedResponse: vi.fn() }));
vi.mock("@/app/api/utils/rate-limit", () => ({ generalLimiter: vi.fn(() => null) }));
vi.mock("@/app/api/utils/audit", () => ({ auditLog }));
const { PUT } = await import("@/app/api/change-orders/route");

const current = { id: 5, project_id: 9, status: "sent", title: "Extra prep", description: "Repair concealed damage", amount: "1000", tax_rate: "13", tax_amount: "130", total_amount: "1130", schedule_impact_days: 2 };
const request = (status = "approved") => new Request("https://example.test/api/change-orders", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: 5, status }) });

describe("change order approval transaction", () => {
  beforeEach(() => { txSql.mockReset(); sql.transaction.mockClear(); auditLog.mockReset(); });

  test("applies approved value and schedule impact exactly once", async () => {
    txSql.mockResolvedValueOnce([current]).mockResolvedValueOnce([{ ...current, status: "approved" }]).mockResolvedValueOnce([]);
    const response = await PUT(request());
    expect(response.status).toBe(200); expect(txSql).toHaveBeenCalledTimes(3);
    expect(String(txSql.mock.calls[0][0])).toContain("FOR UPDATE");
    expect(String(txSql.mock.calls[2][0])).toContain("final_cost");
    expect(auditLog).toHaveBeenCalledWith(expect.objectContaining({ action: "change_order.update" }));
  });

  test("an approval retry does not increase project value again", async () => {
    txSql.mockResolvedValueOnce([{ ...current, status: "approved" }]).mockResolvedValueOnce([{ ...current, status: "approved" }]);
    const response = await PUT(request());
    expect(response.status).toBe(200); expect(txSql).toHaveBeenCalledTimes(2);
  });

  test("cannot revive a void change order", async () => {
    txSql.mockResolvedValueOnce([{ ...current, status: "void" }]);
    const response = await PUT(request());
    expect(response.status).toBe(409); expect(txSql).toHaveBeenCalledOnce(); expect(auditLog).not.toHaveBeenCalled();
  });
});
