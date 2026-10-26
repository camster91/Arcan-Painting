import { beforeEach, describe, expect, it, vi } from "vitest";

const insertLead = vi.fn();
const sendGmailEmail = vi.fn();
const notifyGerardo = vi.fn();
const sendLeadEvent = vi.fn();

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
vi.mock("@/app/api/utils/meta-capi", () => ({ sendLeadEvent }));

const { POST } = await import("@/app/api/contact/route");

describe("POST /api/contact", () => {
  beforeEach(() => {
    insertLead.mockReset();
    sendGmailEmail.mockReset();
    notifyGerardo.mockReset();
    sendLeadEvent.mockReset();
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

  it("does not notify or acknowledge when the CRM returns no lead id", async () => {
    insertLead.mockResolvedValue(null);

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
    expect(await response.json()).toMatchObject({ success: false, lead_saved: false });
    expect(sendLeadEvent).not.toHaveBeenCalled();
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
      attribution: { utmSource: "search", landingPage: "/" },
    }));
  });

  it("accepts an SMS response preference and preserves it in CRM metadata", async () => {
    insertLead.mockResolvedValue(44);
    const response = await POST(new Request("https://example.test/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Customer",
        phone: "+1 416 555 0100",
        serviceType: "interior",
        preferredContact: "sms",
      }),
    }));

    expect(response.status).toBe(200);
    expect(insertLead).toHaveBeenCalledWith(expect.objectContaining({
      preferredContact: "sms",
      phone: "+1 416 555 0100",
    }));
  });

  it("requires a phone number for an SMS response preference", async () => {
    const response = await POST(new Request("https://example.test/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Customer",
        email: "customer@example.test",
        serviceType: "interior",
        preferredContact: "sms",
      }),
    }));

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: "Phone is required when preferred contact is sms" });
    expect(insertLead).not.toHaveBeenCalled();
  });

  it("rejects unknown response preferences", async () => {
    const response = await POST(new Request("https://example.test/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Customer",
        email: "customer@example.test",
        serviceType: "interior",
        preferredContact: "text",
      }),
    }));

    expect(response.status).toBe(400);
    expect(insertLead).not.toHaveBeenCalled();
  });
});

it('does not leak storage exception details into contact-route logs', async () => {
  const errorLog = vi.spyOn(console, 'error').mockImplementation(() => {});
  try {
    insertLead.mockRejectedValue(new Error('fixture-private@example.test query details'));
    const response = await POST(new Request('https://example.test/api/contact', {
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({name:'Privacy Fixture',email:'fixture@example.test',serviceType:'interior',preferredContact:'email'}),
    }));
    expect(response.status).toBe(503);
    expect(errorLog).toHaveBeenCalled();
    expect(JSON.stringify(errorLog.mock.calls)).not.toContain('fixture-private@example.test');
  } finally {errorLog.mockRestore();}
});

it('keeps malformed request content out of response and parser logs', async () => {
  const errorLog = vi.spyOn(console, 'error').mockImplementation(() => {});
  insertLead.mockReset();
  try {
    const response = await POST(new Request('https://example.test/api/contact', {
      method:'POST',headers:{'Content-Type':'application/json'},
      body:'{"email":"fixture-private@example.test"',
    }));
    expect(response.status).toBe(400);
    expect(await response.text()).not.toContain('fixture-private@example.test');
    expect(JSON.stringify(errorLog.mock.calls)).not.toContain('fixture-private@example.test');
    expect(insertLead).not.toHaveBeenCalled();
  } finally {errorLog.mockRestore();}
});

it('normalizes private URLs and drops personal campaign values at the server boundary', async () => {
  insertLead.mockReset();insertLead.mockResolvedValue(47);
  const response = await POST(new Request('https://example.test/api/contact', {
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({name:'Privacy Fixture',email:'fixture@example.test',serviceType:'interior',preferredContact:'email',attribution:{
      landingPage:'/i/private-invoice?email=fixture-private@example.test',
      referrer:'https://referrer.example/private-customer?email=fixture-private@example.test',
      utmSource:'search',utmCampaign:'fixture-private@example.test',utmMedium:'+1 416 555 0100',privateId:'secret',
    }}),
  }));
  expect(response.status).toBe(200);
  expect(insertLead).toHaveBeenCalledWith(expect.objectContaining({attribution:{
    landingPage:'/other',referrer:'https://referrer.example',utmSource:'search',
  }}));
});
