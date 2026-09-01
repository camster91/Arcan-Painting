import { beforeEach, describe, expect, test, vi } from "vitest";

const sql = vi.fn(); const txSql = vi.fn(); const auditLog = vi.fn();
sql.transaction = vi.fn(async (callback) => callback(txSql));
vi.mock("@/app/api/utils/sql", () => ({ default: sql }));
vi.mock("@/app/api/utils/audit", () => ({ auditLog }));
vi.mock("@/app/api/utils/rate-limit", () => ({ createRateLimiter: vi.fn(() => () => null) }));
const { POST } = await import("@/app/api/customer-portal/[token]/route");

const token = "a".repeat(43);
const request = () => new Request(`https://example.test/api/customer-portal/${token}`, {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ action: "decide_change_order", id: 5, decision: "approved", signed_by_name: "Alex Customer" }),
});
const order = { id: 5, lead_id: 3, project_id: 9, status: "sent", total_amount: "1130", schedule_impact_days: 2 };

describe("customer portal transactional decisions", () => {
  beforeEach(() => {
    txSql.mockReset(); auditLog.mockReset(); sql.mockReset(); sql.transaction = vi.fn(async (callback) => callback(txSql));
    sql.mockImplementation(async (strings) => {
      const query = String(strings);
      if (query.includes("FROM customer_portal_tokens")) return [{ id: 2, lead_id: 3 }];
      if (query.includes("SELECT id, name FROM leads")) return [{ id: 3, name: "Alex Customer" }];
      return [];
    });
  });

  test("applies an approved change order to project value exactly once across retries", async () => {
    txSql.mockResolvedValueOnce([order]).mockResolvedValueOnce([{ ...order, status: "approved" }]).mockResolvedValueOnce([]);
    const first = await POST(request(), { params: { token } });
    expect(first.status).toBe(200);
    expect(String(txSql.mock.calls[2][0])).toContain("final_cost");
    expect(auditLog).toHaveBeenCalledWith(expect.objectContaining({ action: "customer_portal.decide_change_order" }));

    txSql.mockReset();
    txSql.mockResolvedValueOnce([{ ...order, status: "approved" }]);
    const retry = await POST(request(), { params: { token } });
    expect(retry.status).toBe(200);
    expect(txSql).toHaveBeenCalledOnce();
    expect(String(txSql.mock.calls[0][0])).toContain("FOR UPDATE");
  });

  test("does not let a portal token decide another customer's change order", async () => {
    txSql.mockResolvedValueOnce([{ ...order, lead_id: 99 }]);
    const response = await POST(request(), { params: { token } });
    expect(response.status).toBe(404);
    expect(txSql).toHaveBeenCalledOnce();
    expect(auditLog).not.toHaveBeenCalled();
  });
});
