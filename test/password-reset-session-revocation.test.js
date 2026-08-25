import { describe, expect, test, vi } from "vitest";

const sql = vi.fn();
const txSql = vi.fn();
sql.transaction = vi.fn(async (callback) => callback(txSql));

vi.mock("argon2", () => ({ hash: vi.fn().mockResolvedValue("argon2-hash") }));
vi.mock("@/app/api/utils/sql", () => ({ default: sql }));
vi.mock("@/app/api/utils/rate-limit", () => ({ passwordLimiter: vi.fn(() => null) }));
vi.mock("@/app/api/utils/audit", () => ({ auditLog: vi.fn() }));
vi.mock("@/app/api/utils/validate", () => ({
  validateBody: vi.fn().mockResolvedValue([{ token: "reset-token", newPassword: "new-password" }, null]),
  schemas: { passwordResetConfirm: {} },
}));
vi.mock("@/migrations/001-initial-schema", () => ({ ensureSchema: vi.fn() }));
vi.mock("@/app/api/utils/auth", () => ({ isExpiredAt: vi.fn(() => false) }));

const { POST } = await import("@/app/api/local-auth/password-reset/confirm/route");

describe("password-reset confirmation", () => {
  test("revokes all active sessions as part of a successful reset", async () => {
    sql.mockResolvedValueOnce([{ id: "reset-1", user_id: "user-1", expires_at: new Date(Date.now() + 60_000), used: false }]);

    const response = await POST(new Request("https://arcanpainting.ca/api/local-auth/password-reset/confirm", {
      method: "POST",
      body: JSON.stringify({ token: "reset-token", newPassword: "new-password" }),
    }));

    expect(response.status).toBe(200);
    expect(sql.transaction).toHaveBeenCalledOnce();
    expect(txSql).toHaveBeenCalledTimes(3);
    expect(txSql.mock.calls.some(([strings]) => strings.join("").includes("UPDATE auth_sessions SET deleted_at = NOW()"))).toBe(true);
  });
});
