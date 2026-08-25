import { beforeEach, describe, expect, test, vi } from "vitest";

const sql = vi.fn();
const requireAdmin = vi.fn();
const requireCsrf = vi.fn();

vi.mock("@/app/api/utils/sql", () => ({ default: sql }));
vi.mock("@/app/api/utils/auth", () => ({ requireAdmin }));
vi.mock("@/app/api/utils/csrf", () => ({ requireCsrf }));
vi.mock("@/app/api/notifications/route", () => ({ createNotification: vi.fn() }));

const { GET, POST } = await import("@/app/api/project-progress/route.js");

describe("project progress API", () => {
  beforeEach(() => {
    sql.mockReset();
    requireAdmin.mockReset();
    requireCsrf.mockReset();
  });

  test("rejects unauthenticated reads before querying project data", async () => {
    requireAdmin.mockResolvedValue(false);

    const response = await GET(new Request("https://arcanpainting.ca/api/project-progress"));

    expect(response.status).toBe(401);
    expect(sql).not.toHaveBeenCalled();
  });

  test("rejects unauthenticated progress updates before writing or notifying", async () => {
    requireAdmin.mockResolvedValue(false);

    const response = await POST(new Request("https://arcanpainting.ca/api/project-progress", {
      method: "POST",
      body: JSON.stringify({ project_id: 1, report_date: "2026-08-24", work_description: "Test" }),
    }));

    expect(response.status).toBe(401);
    expect(sql).not.toHaveBeenCalled();
  });
});
