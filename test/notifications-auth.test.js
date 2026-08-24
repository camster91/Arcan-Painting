import { beforeEach, describe, expect, test, vi } from "vitest";

const sql = vi.fn();
const requireAdmin = vi.fn();
const requireCsrf = vi.fn();

vi.mock("@/app/api/utils/sql", () => ({ default: sql }));
vi.mock("@/app/api/utils/send-email", () => ({ sendEmail: vi.fn() }));
vi.mock("@/app/api/utils/auth", () => ({ requireAdmin }));
vi.mock("@/app/api/utils/csrf", () => ({ requireCsrf }));

const { GET, POST } = await import("@/app/api/notifications/route.js");

describe("notifications API", () => {
  beforeEach(() => {
    sql.mockReset();
    requireAdmin.mockReset();
    requireCsrf.mockReset();
  });

  test("rejects unauthenticated reads before querying notification data", async () => {
    requireAdmin.mockResolvedValue(false);

    const response = await GET(new Request("https://arcanpainting.ca/api/notifications"));

    expect(response.status).toBe(401);
    expect(sql).not.toHaveBeenCalled();
  });

  test("rejects unauthenticated notification creation before sending mail", async () => {
    requireAdmin.mockResolvedValue(false);

    const response = await POST(new Request("https://arcanpainting.ca/api/notifications", {
      method: "POST",
      body: JSON.stringify({ type: "test", title: "Test", message: "Test" }),
    }));

    expect(response.status).toBe(401);
    expect(sql).not.toHaveBeenCalled();
  });
});
