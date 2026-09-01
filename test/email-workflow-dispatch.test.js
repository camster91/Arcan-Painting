import { beforeEach, describe, expect, test, vi } from "vitest";

const sql = vi.fn();
vi.mock("@/app/api/utils/sql", () => ({ default: sql }));
const { queueEmailWorkflows } = await import("@/app/api/utils/email-workflows");

describe("email workflow dispatch", () => {
  beforeEach(() => { sql.mockReset(); delete process.env.EMAIL_AUTOMATIONS_ENABLED; });

  test("is inert unless explicitly enabled", async () => {
    expect(await queueEmailWorkflows({ event: "estimate_sent", recipientEmail: "client@example.test", relatedType: "estimate", relatedId: 8 })).toEqual({ enabled: false, queued: 0 });
    expect(sql).not.toHaveBeenCalled();
  });

  test("queues active workflows without sending inline", async () => {
    process.env.EMAIL_AUTOMATIONS_ENABLED = "true";
    sql
      .mockResolvedValueOnce([{ id: 2, delay_hours: 24, template_name: "estimate_followup" }])
      .mockResolvedValueOnce([{ id: 40 }]);
    const result = await queueEmailWorkflows({ event: "estimate_sent", recipientEmail: " Client@Example.Test ", data: { lead_name: "Alex" }, relatedType: "estimate", relatedId: 8 });
    expect(result).toEqual({ enabled: true, queued: 1 });
    expect(sql).toHaveBeenCalledTimes(2);
    expect(String(sql.mock.calls[1][0])).toContain("ON CONFLICT");
  });

  test("does not queue an invalid recipient", async () => {
    process.env.EMAIL_AUTOMATIONS_ENABLED = "true";
    expect(await queueEmailWorkflows({ event: "invoice_sent", recipientEmail: "not-an-email" })).toMatchObject({ queued: 0, reason: "missing_recipient" });
    expect(sql).not.toHaveBeenCalled();
  });
});
