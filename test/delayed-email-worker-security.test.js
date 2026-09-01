import { beforeEach, describe, expect, test, vi } from "vitest";

const sql = vi.fn(); const getCurrentUser = vi.fn();
sql.transaction = vi.fn();
vi.mock("@/app/api/utils/sql", () => ({ default: sql }));
vi.mock("@/app/api/utils/auth", () => ({
  getCurrentUser,
  unauthorizedResponse: () => Response.json({ error: "Unauthorized" }, { status: 401 }),
}));
vi.mock("@/app/api/utils/send-email", () => ({ sendTemplatedEmail: vi.fn() }));
const { POST } = await import("@/app/api/delayed-emails/route");

describe("delayed email worker gate", () => {
  beforeEach(() => {
    sql.mockReset(); sql.transaction.mockReset(); getCurrentUser.mockReset();
    delete process.env.EMAIL_AUTOMATIONS_ENABLED; delete process.env.CRON_SECRET;
  });

  test("refuses to process when automations are disabled", async () => {
    const response = await POST(new Request("https://example.test/api/delayed-emails", { method: "POST" }));
    expect(response.status).toBe(503); expect(sql.transaction).not.toHaveBeenCalled();
  });

  test("does not treat two missing cron secrets as authentication", async () => {
    process.env.EMAIL_AUTOMATIONS_ENABLED = "true"; getCurrentUser.mockResolvedValue(null);
    const response = await POST(new Request("https://example.test/api/delayed-emails", { method: "POST" }));
    expect(response.status).toBe(401); expect(getCurrentUser).toHaveBeenCalledOnce(); expect(sql.transaction).not.toHaveBeenCalled();
  });
});
