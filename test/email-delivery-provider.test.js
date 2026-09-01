import { describe, expect, it, vi } from "vitest";
import { deliverEmail, getEmailProviderConfig } from "@/app/api/utils/email-delivery-provider";

describe("email delivery provider seam", () => {
  it("is explicitly disabled when no provider is configured", () => {
    expect(getEmailProviderConfig({})).toMatchObject({ provider: "disabled", configured: false });
  });

  it("validates provider-specific configuration without exposing secrets", () => {
    expect(getEmailProviderConfig({ EMAIL_PROVIDER: "http_email", EMAIL_DELIVERY_ENDPOINT: "http://unsafe.test", EMAIL_DELIVERY_TOKEN: "secret", EMAIL_FROM: "sender@test.invalid" }).configured).toBe(false);
    expect(getEmailProviderConfig({ EMAIL_PROVIDER: "http_email", EMAIL_DELIVERY_ENDPOINT: "https://provider.test/send", EMAIL_DELIVERY_TOKEN: "secret", EMAIL_FROM: "sender@test.invalid" })).toMatchObject({ configured: true, sender: "sender@test.invalid" });
  });

  it("reports acceptance only after the configured provider accepts", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ messageId: "accepted-1" }) });
    const result = await deliverEmail({ from: "sender@test.invalid", to: "customer@test.invalid", subject: "Estimate", text: "Ready" }, {
      env: { EMAIL_PROVIDER: "http_email", EMAIL_DELIVERY_ENDPOINT: "https://provider.test/send", EMAIL_DELIVERY_TOKEN: "secret", EMAIL_FROM: "sender@test.invalid" },
      fetchImpl,
    });
    expect(result).toMatchObject({ accepted: true, id: "accepted-1", provider: "http_email" });
    expect(fetchImpl).toHaveBeenCalledWith("https://provider.test/send", expect.objectContaining({ method: "POST" }));
  });

  it("surfaces provider rejection instead of claiming success", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false, status: 503, json: async () => ({ error: "provider unavailable" }) });
    await expect(deliverEmail({ from: "sender@test.invalid", to: "customer@test.invalid", subject: "Estimate", text: "Ready" }, {
      env: { EMAIL_PROVIDER: "http_email", EMAIL_DELIVERY_ENDPOINT: "https://provider.test/send", EMAIL_DELIVERY_TOKEN: "secret", EMAIL_FROM: "sender@test.invalid" }, fetchImpl,
    })).rejects.toThrow("provider unavailable");
  });
});
