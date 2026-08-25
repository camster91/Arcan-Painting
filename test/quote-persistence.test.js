import { beforeEach, describe, expect, it, vi } from "vitest";

const insertLead = vi.fn();
const notifyGerardo = vi.fn();

vi.mock("@/app/api/utils/insert-lead", () => ({
  insertLead,
  validateLeadInput: (input) => input.projectDescription.length > 4_000 ? "Project description must be 4000 characters or fewer" : null,
}));
vi.mock("@/app/api/utils/telegram", () => ({
  notifyGerardo,
  formatQuoteNotification: vi.fn(() => "quote notification"),
}));
vi.mock("@/app/api/utils/gemini", () => ({ chatWithGemini: vi.fn() }));
vi.mock("@/app/api/utils/rate-limit", () => ({
  createRateLimiter: vi.fn(() => () => null),
}));

const { POST } = await import("@/app/api/quote/route");

describe("POST /api/quote", () => {
  beforeEach(() => {
    insertLead.mockReset();
    notifyGerardo.mockReset();
  });

  it("does not report success when the quote cannot be persisted", async () => {
    insertLead.mockRejectedValue(new Error("database unavailable"));

    const response = await POST(new Request("https://example.test/api/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Customer",
        email: "customer@example.test",
        serviceType: "interior",
      }),
    }));

    expect(response.status).toBe(503);
    expect(notifyGerardo).not.toHaveBeenCalled();
  });

  it("rejects oversized quote details before CRM or notification side effects", async () => {
    const response = await POST(new Request("https://example.test/api/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Customer",
        email: "customer@example.test",
        serviceType: "interior",
        details: "x".repeat(4_001),
      }),
    }));

    expect(response.status).toBe(400);
    expect(insertLead).not.toHaveBeenCalled();
    expect(notifyGerardo).not.toHaveBeenCalled();
  });
});
