import { beforeEach, describe, expect, test, vi } from "vitest";

const sql = vi.fn();
const txSql = vi.fn();
sql.transaction = vi.fn(async (callback) => callback(txSql));

vi.mock("@/app/api/utils/sql", () => ({ default: sql }));
vi.mock("@/app/api/utils/rate-limit", () => ({ authLimiter: vi.fn(() => null) }));
vi.mock("@/app/api/utils/audit", () => ({ auditLog: vi.fn() }));
vi.mock("@/app/api/utils/auth", () => ({
  generateSecureToken: vi.fn(() => "session-token"),
  parseCookies: vi.fn(() => ({})),
}));

const { POST } = await import("@/app/api/local-auth/verify-code/route");

describe("magic-code verification", () => {
  beforeEach(() => {
    sql.mockReset();
    txSql.mockReset();
    sql.transaction.mockClear();
  });

  test("records an invalid attempt against the latest issued code", async () => {
    txSql
      .mockResolvedValueOnce([{ id: "code-1", username: "owner@example.test", code: "123456", failed_attempts: 0, locked_at: null }])
      .mockResolvedValueOnce([]);

    const response = await POST(new Request("https://arcanpainting.ca/api/local-auth/verify-code", {
      method: "POST",
      body: JSON.stringify({ email: "owner@example.test", code: "000000" }),
    }));

    expect(response.status).toBe(401);
    expect(sql.transaction).toHaveBeenCalledOnce();
    expect(txSql.mock.calls.some(([strings]) => strings.join("").includes("SET failed_attempts = failed_attempts + 1"))).toBe(true);
  });

  test("consumes the valid code inside the same transaction", async () => {
    txSql
      .mockResolvedValueOnce([{ id: "code-1", username: "owner@example.test", code: "123456", failed_attempts: 0, locked_at: null }])
      .mockResolvedValueOnce([]);
    sql
      .mockResolvedValueOnce([{ id: "user-1", username: "owner@example.test", role: "owner" }])
      .mockResolvedValueOnce([]);

    const response = await POST(new Request("https://arcanpainting.ca/api/local-auth/verify-code", {
      method: "POST",
      body: JSON.stringify({ email: "owner@example.test", code: "123456" }),
    }));

    expect(response.status).toBe(200);
    expect(txSql.mock.calls.some(([strings]) => strings.join("").includes("SET used_at = NOW()"))).toBe(true);
  });
});
