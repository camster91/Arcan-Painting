import { beforeEach, describe, expect, it, vi } from "vitest";
import { createHmac } from "node:crypto";

const insertLead = vi.fn();
const notifyGerardo = vi.fn();
const sendLeadEvent = vi.fn();
const auditLog = vi.fn();
const sql = vi.fn();

vi.mock("@/app/api/utils/insert-lead.js", () => ({ insertLead }));
vi.mock("@/app/api/utils/telegram.js", () => ({ notifyGerardo }));
vi.mock("@/app/api/utils/meta-capi.js", () => ({ sendLeadEvent }));
vi.mock("@/app/api/utils/audit.js", () => ({ auditLog }));
vi.mock("@/app/api/utils/rate-limit.js", () => ({ generalLimiter: vi.fn(() => null) }));
vi.mock("@/app/api/utils/sql.js", () => ({ default: sql }));

process.env.META_LEAD_VERIFY_TOKEN = "test-meta-webhook-token";

const { POST } = await import("@/app/api/lead-webhook/meta/route.js");

function signedRequest(payload) {
  const body = JSON.stringify(payload);
  const signature = createHmac("sha256", process.env.META_LEAD_VERIFY_TOKEN)
    .update(body)
    .digest("hex");
  return new Request("https://example.test/api/lead-webhook/meta", {
    method: "POST",
    headers: { "x-hub-signature-256": `sha256=${signature}` },
    body,
  });
}

describe("POST /api/lead-webhook/meta", () => {
  beforeEach(() => {
    insertLead.mockReset();
    notifyGerardo.mockReset();
    sendLeadEvent.mockReset();
    auditLog.mockReset();
    sql.mockReset();
    sql.mockResolvedValue([]);
    insertLead.mockResolvedValue({ lead: { id: "lead-123" } });
    notifyGerardo.mockResolvedValue(undefined);
    auditLog.mockResolvedValue(undefined);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 204 })));
  });

  it("persists a valid Meta lead and dispatches only supported downstream effects", async () => {
    const response = await POST(signedRequest({
      entry: [{ changes: [{ field: "leadgen", value: {
        id: "meta-lead-123",
        ad_id: "ad-123",
        field_data: [
          { name: "full_name", values: ["Test Customer"] },
          { name: "email", values: ["customer@example.test"] },
          { name: "service_type", values: ["exterior"] },
        ],
      } }] }],
    }));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ received: 1, succeeded: 1 });
    expect(insertLead).toHaveBeenCalledWith(expect.objectContaining({
      name: "Test Customer",
      leadSource: "meta_lead_ad",
      metaLeadId: "meta-lead-123",
    }));
    expect(notifyGerardo).toHaveBeenCalledOnce();
    expect(sendLeadEvent).toHaveBeenCalledWith(expect.objectContaining({ leadId: "lead-123" }));
    expect(fetch).toHaveBeenCalledWith(
      "https://example.test/api/agents/lead-qualifier",
      expect.any(Object),
    );
  });

  it("rejects an invalid signature before a lead is persisted", async () => {
    const response = await POST(new Request("https://example.test/api/lead-webhook/meta", {
      method: "POST",
      headers: { "x-hub-signature-256": "sha256=invalid" },
      body: JSON.stringify({ entry: [] }),
    }));

    expect(response.status).toBe(401);
    expect(insertLead).not.toHaveBeenCalled();
  });
});
