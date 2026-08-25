import { beforeEach, describe, expect, test, vi } from "vitest";

const sql = vi.fn();
const requireAdmin = vi.fn();
const requireCsrf = vi.fn();

vi.mock("@/app/api/utils/sql", () => ({ default: sql }));
vi.mock("@/app/api/utils/auth", () => ({ requireAdmin }));
vi.mock("@/app/api/utils/csrf", () => ({ requireCsrf }));

const { GET, POST } = await import("@/app/api/team-availability/route.js");

describe("team availability API", () => {
  beforeEach(() => {
    sql.mockReset();
    requireAdmin.mockReset();
    requireCsrf.mockReset();
  });

  test("rejects unauthenticated schedule reads before querying the database", async () => {
    requireAdmin.mockResolvedValue(false);

    const response = await GET(new Request("https://arcanpainting.ca/api/team-availability"));

    expect(response.status).toBe(401);
    expect(sql).not.toHaveBeenCalled();
  });

  test("rejects unauthenticated schedule writes before changing availability", async () => {
    requireAdmin.mockResolvedValue(false);

    const response = await POST(new Request("https://arcanpainting.ca/api/team-availability", {
      method: "POST",
      body: JSON.stringify({ team_member_id: 1, date: "2026-08-24", start_time: "09:00", end_time: "17:00" }),
    }));

    expect(response.status).toBe(401);
    expect(sql).not.toHaveBeenCalled();
  });
});
