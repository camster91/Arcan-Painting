import { beforeEach, describe, expect, test, vi } from "vitest";

const { authLimiter, requireCsrf, getCurrentUser } = vi.hoisted(() => ({
  authLimiter: vi.fn(),
  requireCsrf: vi.fn(),
  getCurrentUser: vi.fn(),
}));

vi.mock("@/app/api/utils/rate-limit", () => ({ authLimiter }));
vi.mock("@/app/api/utils/csrf", () => ({ requireCsrf }));
vi.mock("@/app/api/utils/auth", () => ({ getCurrentUser }));
vi.mock("@/app/api/utils/sql", () => ({ default: vi.fn() }));
vi.mock("@/app/api/utils/audit", () => ({ auditLog: vi.fn() }));
vi.mock("@/app/api/utils/validate", () => ({ validateBody: vi.fn(), schemas: { changePassword: {} } }));
vi.mock("argon2", () => ({ hash: vi.fn(), verify: vi.fn() }));

const { POST } = await import("@/app/api/local-auth/change-password/route.js");

describe("change-password API", () => {
  beforeEach(() => {
    authLimiter.mockReset();
    requireCsrf.mockReset();
    getCurrentUser.mockReset();
    authLimiter.mockReturnValue(null);
  });

  test("rejects a missing CSRF token before looking up the signed-in user", async () => {
    requireCsrf.mockReturnValue(Response.json({ error: "CSRF token missing" }, { status: 403 }));

    const response = await POST(new Request("https://arcanpainting.ca/api/local-auth/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword: "old-password", newPassword: "new-password" }),
    }));

    expect(response.status).toBe(403);
    expect(getCurrentUser).not.toHaveBeenCalled();
  });
});
