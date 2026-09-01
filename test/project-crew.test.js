import { beforeEach, describe, expect, test, vi } from "vitest";

const sql = vi.fn(); const txSql = vi.fn(); const getCurrentUser = vi.fn(); const auditLog = vi.fn();
sql.transaction = vi.fn(async (callback) => callback(txSql));
vi.mock("@/app/api/utils/sql", () => ({ default: sql }));
vi.mock("@/app/api/utils/auth", () => ({ getCurrentUser }));
vi.mock("@/app/api/utils/audit", () => ({ auditLog }));
vi.mock("@/app/api/utils/rate-limit", () => ({ generalLimiter: vi.fn(() => null) }));
const { GET, POST } = await import("@/app/api/admin/project-crew/route");

describe("project crew management", () => {
  beforeEach(() => { sql.mockReset(); txSql.mockReset(); getCurrentUser.mockReset(); auditLog.mockReset(); sql.transaction = vi.fn(async (callback) => callback(txSql)); });

  test("returns the primary painter and active additional crew", async () => {
    getCurrentUser.mockResolvedValue({ id: 1, username: "owner@example.test", role: "owner" });
    sql.mockResolvedValueOnce([{ id: 9, assigned_painter_id: 2 }]).mockResolvedValueOnce([{ team_member_id: 3, name: "Crew Three" }]);
    const response = await GET(new Request("https://example.test/api/admin/project-crew?project_id=9"));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ primary_painter_id: 2, crew: [{ team_member_id: 3 }] });
  });

  test("replaces crew transactionally and audits the resulting membership", async () => {
    getCurrentUser.mockResolvedValue({ id: 1, username: "owner@example.test", role: "owner" });
    txSql.mockResolvedValueOnce([{ id: 9, assigned_painter_id: 2 }]).mockResolvedValueOnce([{ id: 3 }, { id: 4 }]).mockResolvedValueOnce([]).mockResolvedValueOnce([]).mockResolvedValueOnce([]);
    const response = await POST(new Request("https://example.test/api/admin/project-crew", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ project_id: 9, team_member_ids: [3, 4, 3] }) }));
    expect(response.status).toBe(200);
    expect(txSql).toHaveBeenCalledTimes(5);
    expect(String(txSql.mock.calls[0][0])).toContain("FOR UPDATE");
    expect(String(txSql.mock.calls[2][0])).toContain("removed_at");
    expect(auditLog).toHaveBeenCalledWith(expect.objectContaining({ action: "project.crew_replace", changes: expect.objectContaining({ team_member_ids: [3, 4] }) }));
  });

  test("does not expose crew administration to field users", async () => {
    getCurrentUser.mockResolvedValue({ id: 8, username: "crew@example.test", role: "painter" });
    const response = await GET(new Request("https://example.test/api/admin/project-crew?project_id=9"));
    expect(response.status).toBe(403);
    expect(sql).not.toHaveBeenCalled();
  });
});
