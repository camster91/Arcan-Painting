import { beforeEach, describe, expect, it, vi } from "vitest";

const insertLead = vi.fn();
const sendGmailEmail = vi.fn();
const notifyGerardo = vi.fn();

vi.mock("@/app/api/utils/insert-lead", () => ({
  insertLead,
  validateLeadInput: (input) => input.name.length > 255 ? "Name must be 255 characters or fewer" : null,
}));
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

  it("rejects oversized public input before CRM or notification side effects", async () => {
    const response = await POST(new Request("https://example.test/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "x".repeat(256),
        email: "customer@example.test",
        serviceType: "interior",
      }),
    }));

    expect(response.status).toBe(400);
    expect(insertLead).not.toHaveBeenCalled();
    expect(sendGmailEmail).not.toHaveBeenCalled();
    expect(notifyGerardo).not.toHaveBeenCalled();
  });

  it("escapes public values before constructing email content", async () => {
    insertLead.mockResolvedValue(42);

    const response = await POST(new Request("https://example.test/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: '<img src=x onerror="alert(1)">',
        email: "customer@example.test",
        serviceType: "interior\r\nBcc: attacker@example.test",
      }),
    }));

    expect(response.status).toBe(200);
    const [businessEmail] = sendGmailEmail.mock.calls;
    expect(businessEmail[0].subject).not.toContain("\r");
    expect(businessEmail[0].subject).not.toContain("\n");
    expect(businessEmail[0].body).toContain("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
    expect(businessEmail[0].body).not.toContain('<img src=x onerror="alert(1)">');
  });

  it("passes only bounded attribution fields to CRM persistence", async () => {
    insertLead.mockResolvedValue(43);
    const response = await POST(new Request("https://example.test/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Customer",
        email: "customer@example.test",
        serviceType: "interior",
        attribution: { utmSource: "search", landingPage: "/?utm_source=search", unexpected: "discard" },
      }),
    }));

    expect(response.status).toBe(200);
    expect(insertLead).toHaveBeenCalledWith(expect.objectContaining({
      attribution: { utmSource: "search", landingPage: "/?utm_source=search" },
    }));
  });
});
