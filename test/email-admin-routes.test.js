import { beforeEach, describe, expect, test, vi } from "vitest";

const sql = vi.fn(); const getCurrentUser = vi.fn(); const sendEmail = vi.fn(); const auditLog = vi.fn();
vi.mock("@/app/api/utils/sql", () => ({ default: sql }));
vi.mock("@/app/api/utils/auth", () => ({ getCurrentUser, unauthorizedResponse: () => Response.json({ error: "Unauthorized" }, { status: 401 }) }));
vi.mock("@/app/api/utils/rate-limit", () => ({ generalLimiter: vi.fn(() => null) }));
vi.mock("@/app/api/utils/send-email", () => ({ sendEmail }));
vi.mock("@/app/api/utils/audit", () => ({ auditLog }));

const templates = await import("@/app/api/email-templates/route");
const emailTest = await import("@/app/api/email/test/route");

describe("email administration routes", () => {
  beforeEach(() => { sql.mockReset(); getCurrentUser.mockReset(); sendEmail.mockReset(); auditLog.mockReset(); });

  test("does not expose templates without an operator session", async () => {
    getCurrentUser.mockResolvedValue(null);
    const response = await templates.GET(new Request("https://example.test/api/email-templates"));
    expect(response.status).toBe(401); expect(sql).not.toHaveBeenCalled();
  });

  test("lists persisted templates for an admin", async () => {
    getCurrentUser.mockResolvedValue({ id: 2, role: "admin" }); sql.mockResolvedValue([{ id: 1, name: "estimate" }]);
    const response = await templates.GET(new Request("https://example.test/api/email-templates"));
    expect(await response.json()).toEqual({ templates: [{ id: 1, name: "estimate" }] });
  });

  test("requires an explicit owner action for test delivery", async () => {
    getCurrentUser.mockResolvedValue({ id: 2, role: "admin" });
    const response = await emailTest.POST(new Request("https://example.test/api/email/test", { method: "POST", body: JSON.stringify({ to: "client@example.test", subject: "Test", message: "Hello" }) }));
    expect(response.status).toBe(403); expect(sendEmail).not.toHaveBeenCalled();
  });

  test("reports provider failure without claiming delivery", async () => {
    getCurrentUser.mockResolvedValue({ id: 1, username: "owner", role: "owner" }); sendEmail.mockRejectedValue(new Error("Provider rejected message"));
    const response = await emailTest.POST(new Request("https://example.test/api/email/test", { method: "POST", body: JSON.stringify({ to: "client@example.test", subject: "Test", message: "Hello" }) }));
    expect(response.status).toBe(503); expect(await response.json()).toEqual({ error: "Provider rejected message" });
    expect(auditLog).toHaveBeenCalledWith(expect.objectContaining({ status: "failure" }));
  });
});
