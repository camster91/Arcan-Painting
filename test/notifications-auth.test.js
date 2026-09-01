import { beforeEach, describe, expect, test, vi } from "vitest";

const sql = vi.fn();
const getCurrentUser = vi.fn();
const requireCsrf = vi.fn();
const auditLog = vi.fn();

vi.mock("@/app/api/utils/sql", () => ({ default: sql }));
vi.mock("@/app/api/utils/send-email", () => ({ sendEmail: vi.fn() }));
vi.mock("@/app/api/utils/auth", () => ({ getCurrentUser }));
vi.mock("@/app/api/utils/csrf", () => ({ requireCsrf }));
vi.mock("@/app/api/utils/audit", () => ({ auditLog }));

const { GET, POST, PUT } = await import("@/app/api/notifications/route.js");

describe("notifications API", () => {
  beforeEach(() => {
    sql.mockReset();
    getCurrentUser.mockReset();
    requireCsrf.mockReset();
    auditLog.mockReset();
  });

  test("rejects unauthenticated reads before querying notification data", async () => {
    getCurrentUser.mockResolvedValue(null);

    const response = await GET(new Request("https://arcanpainting.ca/api/notifications"));

    expect(response.status).toBe(401);
    expect(sql).not.toHaveBeenCalled();
  });

  test("rejects unauthenticated notification creation before sending mail", async () => {
    getCurrentUser.mockResolvedValue(null);

    const response = await POST(new Request("https://arcanpainting.ca/api/notifications", {
      method: "POST",
      body: JSON.stringify({ type: "test", title: "Test", message: "Test" }),
    }));

    expect(response.status).toBe(401);
    expect(sql).not.toHaveBeenCalled();
  });

  test("audits notification creation without message or recipient PII", async () => {
    getCurrentUser.mockResolvedValue({ id: 7, username: "owner", role: "owner" });
    requireCsrf.mockReturnValue(null);
    sql.mockResolvedValueOnce([{ id: 41 }]);

    const response = await POST(new Request("https://arcanpainting.ca/api/notifications", {
      method: "POST",
      body: JSON.stringify({
        type: "project",
        title: "Private title",
        message: "Private message",
        email: "customer@example.com",
        related_id: 12,
        related_type: "project",
      }),
    }));

    expect(response.status).toBe(201);
    expect(auditLog).toHaveBeenCalledWith(expect.objectContaining({
      action: "notification.create",
      userId: 7,
      resourceId: 41,
      changes: {
        type: "project",
        related_type: "project",
        related_id: 12,
        send_email: false,
      },
    }));
    const auditPayload = JSON.stringify(auditLog.mock.calls[0][0]);
    expect(auditPayload).not.toContain("Private title");
    expect(auditPayload).not.toContain("Private message");
    expect(auditPayload).not.toContain("customer@example.com");
  });

  test("audits notification read-state changes", async () => {
    getCurrentUser.mockResolvedValue({ id: 7, username: "owner", role: "admin" });
    requireCsrf.mockReturnValue(null);
    sql.mockResolvedValueOnce([{ id: 41, is_read: true }]);

    const response = await PUT(new Request("https://arcanpainting.ca/api/notifications", {
      method: "PUT",
      body: JSON.stringify({ id: 41, is_read: true }),
    }));

    expect(response.status).toBe(200);
    expect(auditLog).toHaveBeenCalledWith(expect.objectContaining({
      action: "notification.read_state_update",
      resourceId: 41,
      changes: { is_read: true },
    }));
  });
});
