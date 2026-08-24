import { beforeEach, describe, expect, it, vi } from "vitest";

const insertLead = vi.fn();
const sendGmailEmail = vi.fn();
const notifyGerardo = vi.fn();

vi.mock("@/app/api/utils/insert-lead", () => ({ insertLead }));
vi.mock("@/lib/google", () => ({ sendGmailEmail }));
vi.mock("@/app/api/utils/telegram", () => ({
  notifyGerardo,
  formatLeadNotification: vi.fn(() => "lead notification"),
}));
vi.mock("@/app/api/utils/rate-limit", () => ({ generalLimiter: vi.fn(() => null) }));
vi.mock("@/app/api/utils/audit", () => ({ auditLog: vi.fn() }));
vi.mock("@/app/api/utils/meta-capi", () => ({ sendLeadEvent: vi.fn() }));

const { POST } = await import("@/app/api/contact/route");

describe("POST /api/contact", () => {
  beforeEach(() => {
    insertLead.mockReset();
    sendGmailEmail.mockReset();
    notifyGerardo.mockReset();
  });

  it("does not confirm a lead when the CRM write fails", async () => {
    insertLead.mockRejectedValue(new Error("database unavailable"));

    const response = await POST(new Request("https://example.test/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Customer",
        email: "customer@example.test",
        serviceType: "interior",
        preferredContact: "email",
      }),
    }));

    expect(response.status).toBe(503);
    expect(sendGmailEmail).not.toHaveBeenCalled();
    expect(notifyGerardo).not.toHaveBeenCalled();
  });
});
