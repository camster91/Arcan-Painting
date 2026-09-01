import { beforeEach, describe, expect, test, vi } from "vitest";

const sql = vi.fn();
const getCurrentUser = vi.fn();
const hasPermission = vi.fn();
const auditLog = vi.fn();
vi.mock("@/app/api/utils/sql", () => ({ default: sql }));
vi.mock("@/app/api/utils/auth", () => ({
  getCurrentUser,
  unauthorizedResponse: () => Response.json({ error: "Unauthorized" }, { status: 401 }),
}));
vi.mock("@/app/api/utils/permissions", () => ({ hasPermission }));
vi.mock("@/app/api/utils/audit", () => ({ auditLog }));
vi.mock("@/app/api/utils/send-email", () => ({ sendTemplatedEmail: vi.fn() }));

const { GET } = await import("@/app/api/delayed-emails/route");

describe("delayed email queue authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCurrentUser.mockResolvedValue({
      id: 9,
      username: "crew@example.test",
      role: "crew",
    });
    hasPermission.mockReturnValue(false);
  });

  test("does not expose recipient delivery records to crew users", async () => {
    const response = await GET(
      new Request("https://example.test/api/delayed-emails"),
    );
    expect(response.status).toBe(403);
    expect(hasPermission).toHaveBeenCalledWith(
      expect.objectContaining({ role: "crew" }),
      "communications.manage",
    );
    expect(sql).not.toHaveBeenCalled();
  });
});
