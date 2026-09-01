import { beforeEach, describe, expect, test, vi } from "vitest";

const sql = vi.fn(); const txSql = vi.fn(); const auditLog = vi.fn();
sql.transaction = vi.fn(async (callback) => callback(txSql));
const getCurrentUser = vi.fn();
vi.mock("@/app/api/utils/sql", () => ({ default: sql }));
vi.mock("@/app/api/utils/auth", () => ({ getCurrentUser }));
vi.mock("@/app/api/utils/audit", () => ({ auditLog }));
vi.mock("@/app/api/utils/email-workflows", () => ({ queueEmailWorkflows: vi.fn(async () => ({ enabled: false, queued: 0 })) }));
const { POST, DELETE } = await import("@/app/api/time-tracking/route");

const request = (body) => new Request("https://example.test/api/time-tracking", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

describe("time tracking access boundaries", () => {
  beforeEach(() => { sql.mockReset(); txSql.mockReset(); auditLog.mockReset(); getCurrentUser.mockReset(); sql.transaction = vi.fn(async (callback) => callback(txSql)); });

  test("forces a painter onto their own team record and rejects an unassigned project", async () => {
    getCurrentUser.mockResolvedValue({ id: 7, username: "painter@example.test", role: "painter" });
    txSql.mockResolvedValueOnce([{ id: 11, email: "painter@example.test" }]).mockResolvedValueOnce([]);
    const response = await POST(request({ team_member_id: 99, project_id: 5, clock_in_time: new Date(Date.now() - 60_000).toISOString() }));
    expect(response.status).toBe(404);
    expect(String(txSql.mock.calls[0][0])).toContain("LOWER(email)");
    expect(String(txSql.mock.calls[0][0])).toContain("FOR UPDATE");
    expect(txSql.mock.calls[0].slice(1)).toContain("painter@example.test");
    expect(String(txSql.mock.calls[1][0])).toContain("assigned_painter_id");
    expect(auditLog).not.toHaveBeenCalled();
  });

  test("does not let a painter delete time records", async () => {
    getCurrentUser.mockResolvedValue({ id: 7, username: "painter@example.test", role: "painter" });
    const response = await DELETE(new Request("https://example.test/api/time-tracking?id=4", { method: "DELETE" }));
    expect(response.status).toBe(403);
    expect(sql).not.toHaveBeenCalled();
  });
});
