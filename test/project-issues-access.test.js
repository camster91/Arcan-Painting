import { beforeEach, describe, expect, test, vi } from "vitest";

const sql = vi.fn(); const getCurrentUser = vi.fn(); const auditLog = vi.fn();
sql.transaction = vi.fn();
vi.mock("@/app/api/utils/sql", () => ({ default: sql }));
vi.mock("@/app/api/utils/auth", () => ({ getCurrentUser }));
vi.mock("@/app/api/utils/audit", () => ({ auditLog }));
vi.mock("@/app/api/utils/rate-limit", () => ({ generalLimiter: vi.fn(() => null) }));
const { GET, POST } = await import("@/app/api/project-issues/route");

describe("project issue access", () => {
  beforeEach(() => { sql.mockReset(); getCurrentUser.mockReset(); auditLog.mockReset(); });

  test("rejects an unassigned field user before issue data is queried", async () => {
    getCurrentUser.mockResolvedValue({ id: 5, username: "crew@example.test", role: "painter" });
    sql.mockResolvedValueOnce([]);
    const response = await GET(new Request("https://example.test/api/project-issues?project_id=9"));
    expect(response.status).toBe(403);
    expect(String(sql.mock.calls[0][0])).toContain("project_crew_members");
    expect(sql).toHaveBeenCalledOnce();
  });

  test("lets an assigned crew member raise a validated issue without assigning another person", async () => {
    getCurrentUser.mockResolvedValue({ id: 5, username: "crew@example.test", role: "painter" });
    sql.mockResolvedValueOnce([{ id: 9 }]).mockResolvedValueOnce([{ id: 12, project_id: 9, severity: "high" }]).mockResolvedValueOnce([]);
    const response = await POST(new Request("https://example.test/api/project-issues", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ project_id: 9, issue_type: "damage", severity: "high", title: "Trim damage", description: "Existing trim split found on arrival.", assigned_to: 99 }) }));
    expect(response.status).toBe(201);
    const insertValues = sql.mock.calls[1].slice(1);
    expect(insertValues).toContain(null);
    expect(auditLog).toHaveBeenCalledWith(expect.objectContaining({ action: "project_issue.create" }));
  });
});
