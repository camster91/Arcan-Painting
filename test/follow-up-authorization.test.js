import { beforeEach, describe, expect, test, vi } from "vitest";

const sql = vi.fn();
const getCurrentUser = vi.fn();
const hasPermission = vi.fn();
const auditLog = vi.fn();
vi.mock("@/app/api/utils/sql", () => ({ default: sql }));
vi.mock("@/app/api/utils/auth", () => ({ getCurrentUser }));
vi.mock("@/app/api/utils/permissions", () => ({ hasPermission }));
vi.mock("@/app/api/utils/audit", () => ({ auditLog }));

const route = await import("@/app/api/follow-ups/route");

describe("follow-up authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCurrentUser.mockResolvedValue({
      id: 5,
      username: "crew@example.test",
      role: "crew",
    });
    hasPermission.mockReturnValue(false);
  });

  test.each([
    ["GET", route.GET, undefined, "customers.read"],
    ["POST", route.POST, {}, "customers.write"],
    ["PUT", route.PUT, { id: 1 }, "customers.write"],
    ["DELETE", route.DELETE, undefined, "customers.write"],
  ])("blocks %s without the required permission", async (method, handler, body, permission) => {
    const response = await handler(
      new Request("https://example.test/api/follow-ups?id=1", {
        method,
        headers: { "Content-Type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
      }),
    );

    expect(response.status).toBe(403);
    expect(hasPermission).toHaveBeenCalledWith(
      expect.objectContaining({ role: "crew" }),
      permission,
    );
    expect(sql).not.toHaveBeenCalled();
    expect(auditLog).not.toHaveBeenCalled();
  });
});
