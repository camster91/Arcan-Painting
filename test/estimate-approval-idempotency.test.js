import { beforeEach, describe, expect, test, vi } from "vitest";

const sql = vi.fn();
const txSql = vi.fn();
const auditLog = vi.fn();
sql.transaction = vi.fn(async (callback) => callback(txSql));

vi.mock("@/app/api/utils/sql", () => ({ default: sql }));
vi.mock("@/app/api/utils/auth", () => ({ getCurrentUser: vi.fn(async () => ({ id: 1, username: "owner@example.test", role: "owner" })) }));
vi.mock("@/app/api/utils/audit", () => ({ auditLog }));

const { POST } = await import("@/app/api/estimates/[id]/approve/route");
const request = () => new Request("https://example.test/api/estimates/7/approve", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ project_name: "Main-floor repaint" }),
});

describe("estimate approval conversion", () => {
  beforeEach(() => {
    txSql.mockReset();
    sql.transaction.mockClear();
    auditLog.mockReset();
  });

  test("locks the estimate and creates one project", async () => {
    txSql
      .mockResolvedValueOnce([{ id: 7, lead_id: 3, project_title: "Repaint", total_cost: "2500", status: "sent" }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: 9, project_name: "Main-floor repaint", status: "scheduled" }]);

    const response = await POST(request(), { params: { id: "7" } });
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ success: true, created: true, project: { id: 9 } });
    expect(txSql).toHaveBeenCalledTimes(4);
    expect(String(txSql.mock.calls[0][0])).toContain("FOR UPDATE");
    expect(auditLog).toHaveBeenCalledWith(expect.objectContaining({ action: "estimate.approve_and_create_project" }));
  });

  test("returns the existing project on a repeated approval", async () => {
    txSql
      .mockResolvedValueOnce([{ id: 7, lead_id: 3, project_title: "Repaint", total_cost: "2500", status: "approved" }])
      .mockResolvedValueOnce([{ id: 9, project_name: "Main-floor repaint", status: "scheduled" }]);

    const response = await POST(request(), { params: { id: "7" } });
    expect(await response.json()).toMatchObject({ success: true, created: false, project: { id: 9 } });
    expect(txSql).toHaveBeenCalledTimes(2);
    expect(auditLog).toHaveBeenCalledWith(expect.objectContaining({ action: "estimate.approve_retry" }));
  });

  test("does not revive a rejected estimate", async () => {
    txSql.mockResolvedValueOnce([{ id: 7, lead_id: 3, project_title: "Repaint", total_cost: "2500", status: "rejected" }]);
    const response = await POST(request(), { params: { id: "7" } });
    expect(response.status).toBe(409);
    expect(txSql).toHaveBeenCalledOnce();
    expect(auditLog).not.toHaveBeenCalled();
  });
});
