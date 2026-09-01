import { beforeEach, describe, expect, test, vi } from "vitest";

const sql = vi.fn();
const getCurrentUser = vi.fn();
const auditLog = vi.fn();
vi.mock("@/app/api/utils/sql", () => ({ default: sql }));
vi.mock("@/app/api/utils/auth", () => ({ getCurrentUser }));
vi.mock("@/app/api/utils/audit", () => ({ auditLog }));

const route = await import("@/app/api/onboarding/route");

describe("onboarding authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCurrentUser.mockResolvedValue({
      id: 7,
      username: "office@example.test",
      role: "office",
    });
  });

  test.each([
    ["GET", route.GET, undefined],
    ["POST", route.POST, { action: "complete" }],
  ])("blocks %s for a non-owner role", async (method, handler, body) => {
    const response = await handler(
      new Request("https://example.test/api/onboarding", {
        method,
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      }),
    );
    expect(response.status).toBe(403);
    expect(sql).not.toHaveBeenCalled();
    expect(auditLog).not.toHaveBeenCalled();
  });
});
