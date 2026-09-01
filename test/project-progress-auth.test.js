import { beforeEach, describe, expect, test, vi } from "vitest";

const sql = vi.fn();
const getCurrentUser = vi.fn();
const requireAdmin = vi.fn();

vi.mock("@/app/api/utils/sql", () => ({ default: sql }));
vi.mock("@/app/api/utils/auth", () => ({ getCurrentUser, requireAdmin }));
vi.mock("@/app/api/notifications/route", () => ({ createNotification: vi.fn() }));

const { GET, POST } = await import("@/app/api/project-progress/route.js");

describe("project progress API", () => {
  beforeEach(() => {
    sql.mockReset();
    getCurrentUser.mockReset();
    requireAdmin.mockReset();
  });

  test("rejects unauthenticated reads before querying project data", async () => {
    getCurrentUser.mockResolvedValue(null);

    const response = await GET(new Request("https://arcanpainting.ca/api/project-progress"));

    expect(response.status).toBe(401);
    expect(sql).not.toHaveBeenCalled();
  });

  test("rejects unauthenticated progress updates before writing or notifying", async () => {
    getCurrentUser.mockResolvedValue(null);

    const response = await POST(new Request("https://arcanpainting.ca/api/project-progress", {
      method: "POST",
      body: JSON.stringify({ project_id: 1, report_date: "2026-08-24", work_description: "Test" }),
    }));

    expect(response.status).toBe(401);
    expect(sql).not.toHaveBeenCalled();
  });

  test("rejects a painter reading an unassigned project's reports", async () => {
    getCurrentUser.mockResolvedValue({ id: 4, username: "crew@example.test", role: "painter" });
    sql.mockResolvedValueOnce([]);
    const response = await GET(new Request("https://arcanpainting.ca/api/project-progress?project_id=12"));
    expect(response.status).toBe(403);
    expect(String(sql.mock.calls[0][0])).toContain("assigned_painter_id");
    expect(sql).toHaveBeenCalledOnce();
  });
});
