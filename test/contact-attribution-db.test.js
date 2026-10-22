// @vitest-environment node
import { beforeAll, describe, expect, it, vi } from "vitest";
import sql from "../src/app/api/utils/sql.js";

// Exercise the production API, sanitizer, insertion helper and SQL adapter.
// Only outbound integrations are mocked; this fixture must never send messages.
vi.mock("@/lib/google.js", () => ({ sendGmailEmail: vi.fn() }));
vi.mock("@/app/api/utils/telegram.js", () => ({
  notifyGerardo: vi.fn(), formatLeadNotification: vi.fn(() => "Synthetic inquiry"),
}));
vi.mock("@/app/api/utils/meta-capi.js", () => ({ sendLeadEvent: vi.fn() }));
const { POST } = await import("../src/app/api/contact/route.js");

const enabled = process.env.ARCAN_LEAD_DB_TEST === "1";
if (enabled) {
  const url = new URL(process.env.DATABASE_URL || "http://missing");
  if (!["postgresql:", "mysql:"].includes(url.protocol)
    || !["127.0.0.1", "localhost"].includes(url.hostname)
    || url.pathname !== "/arcan_lead_privacy_ci"
    || process.env.ARCAN_DISPOSABLE_DB !== "1") {
    throw new Error("Lead database tests require an explicitly disposable local arcan_lead_privacy_ci database");
  }
}

const attribution = {
  landingPage: "/?utm_source=search", referrer: "https://search.example.test/",
  utmSource: "search", utmMedium: "paid", utmCampaign: "painting", utmContent: "hero", utmTerm: "interior",
};
function submit(overrides = {}) {
  return POST(new Request("https://example.test/api/contact", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Privacy Fixture", email: "fixture@example.test", serviceType: "interior", attribution, ...overrides }),
  }));
}
const count = async () => Number((await sql("SELECT COUNT(*) AS count FROM leads"))[0].count);
async function savedNotification(response) {
  expect(response.status).toBe(200);
  const body = await response.json();
  expect(body.lead_saved).toBe(true);
  const [row] = await sql(`SELECT leads.name, leads.email, leads.phone, leads.preferred_contact,
    notifications.related_id, notifications.related_type, notifications.data
    FROM leads JOIN notifications ON notifications.related_id = leads.id
    WHERE leads.id = $1`, [body.lead_id]);
  expect(Number(row.related_id)).toBe(Number(body.lead_id));
  expect(row.related_type).toBe("lead");
  return row;
}

describe.runIf(enabled)("contact attribution in a fresh disposable database", () => {
  beforeAll(async () => {
    // Minimal production-compatible columns; CREATE refuses an existing fixture.
    // Never drop, truncate or reuse tables from another run.
    await sql(`CREATE TABLE leads (
      id SERIAL PRIMARY KEY, name VARCHAR(255), email VARCHAR(255), phone VARCHAR(50),
      service_type VARCHAR(100), project_description TEXT, preferred_contact VARCHAR(20),
      address TEXT, status VARCHAR(50), lead_source VARCHAR(100), meta_lead_id VARCHAR(255)
    )`);
    await sql(`CREATE TABLE notifications (
      id SERIAL PRIMARY KEY, type VARCHAR(50), title TEXT, message TEXT, email VARCHAR(255),
      related_id INTEGER, related_type VARCHAR(50), is_read BOOLEAN, send_email BOOLEAN,
      data JSONB, created_at TIMESTAMP,
      CONSTRAINT fixture_reject_notification CHECK (message <> 'Rollback Fixture requested interior.')
    )`);
  });

  it.each(["email", "phone"])("commits all seven attribution fields with a %s lead", async method => {
    const row = await savedNotification(await submit({
      preferredContact: method, email: method === "email" ? "fixture@example.test" : "",
      phone: method === "phone" ? "4165550101" : "",
    }));
    expect(row.data).toEqual({ source: "website", attribution });
    expect(row.preferred_contact).toBe(method);
    expect(row[method]).toBe(method === "email" ? "fixture@example.test" : "4165550101");
  });

  it("stores only allowed string fields and applies the existing length limit", async () => {
    const row = await savedNotification(await submit({
      attribution: { ...attribution, utmTerm: "x".repeat(600), utmContent: 123, extra: "discard" },
    }));
    const { utmContent: _unused, ...expected } = attribution;
    expect(row.data).toEqual({ source: "website", attribution: { ...expected, utmTerm: "x".repeat(500) } });
  });

  it("accepts an inquiry without attribution", async () => {
    const row = await savedNotification(await submit({ attribution: undefined }));
    expect(row.data).toEqual({ source: "website" });
  });

  it("rejects invalid input without inserting a lead", async () => {
    const before = await count();
    expect((await submit({ name: "x".repeat(256) })).status).toBe(400);
    expect(await count()).toBe(before);
  });

  it("rolls back the lead if its attribution notification cannot be stored", async () => {
    const before = await count();
    const response = await submit({ name: "Rollback Fixture" });
    expect(response.status).toBe(503);
    expect(await count()).toBe(before);
    expect(await sql("SELECT id FROM leads WHERE name = $1", ["Rollback Fixture"])).toEqual([]);
  });
});
