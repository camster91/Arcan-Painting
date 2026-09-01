import { beforeEach, describe, expect, test, vi } from "vitest";

const sql = vi.fn(); const getCurrentUser = vi.fn();
vi.mock("@/app/api/utils/sql", () => ({ default: sql }));
vi.mock("@/app/api/utils/auth", () => ({ getCurrentUser }));
vi.mock("@/app/api/utils/rate-limit", () => ({ generalLimiter: vi.fn(() => null) }));
const { GET } = await import("@/app/api/field/today/route");

describe("field today assignment boundary", () => {
  beforeEach(() => { sql.mockReset(); getCurrentUser.mockReset(); });

  test("scopes a painter's field queue and active timer to their team record", async () => {
    getCurrentUser.mockResolvedValue({ id: 8, username: "crew@example.test", role: "painter" });
    sql.mockResolvedValueOnce([{ id: 21, name: "Crew Member", email: "crew@example.test", role: "painter" }]).mockResolvedValueOnce([{ id: 3, project_name: "Assigned job" }]).mockResolvedValueOnce([]);
    const response = await GET(new Request("https://example.test/api/field/today"));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.can_manage).toBe(false);
    expect(body.projects).toHaveLength(1);
    expect(String(sql.mock.calls[1][0])).toContain("p.assigned_painter_id = $1");
    expect(sql.mock.calls[1][1]).toEqual([21]);
    expect(String(sql.mock.calls[2][0])).toContain("tt.team_member_id");
  });

  test("fails closed when a painter account is not linked to the field roster", async () => {
    getCurrentUser.mockResolvedValue({ id: 8, username: "crew@example.test", role: "painter" });
    sql.mockResolvedValueOnce([]);
    const response = await GET(new Request("https://example.test/api/field/today"));
    expect(response.status).toBe(409);
    expect(sql).toHaveBeenCalledOnce();
  });
});
