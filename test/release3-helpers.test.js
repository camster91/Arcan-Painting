import { describe, expect, it, vi } from "vitest";
import { isPublicToken, newPublicToken, publicUrl, ensurePublicToken } from "@/app/api/utils/public-links";
import { sniffType, saveUpload } from "@/app/api/utils/uploads";
import { recordCheckoutPayment } from "@/app/api/utils/stripe-payments";

describe("public links", () => {
  it("creates 32-character url-safe tokens and rejects anything else", () => {
    const token = newPublicToken();
    expect(isPublicToken(token)).toBe(true);
    expect(isPublicToken("../../etc/passwd")).toBe(false);
    expect(isPublicToken(`${token}x`)).toBe(false);
  });
  it("builds customer URLs", () => {
    expect(publicUrl("estimates", "abc", "https://arcanpainting.ca/")).toBe("https://arcanpainting.ca/e/abc");
    expect(publicUrl("invoices", "abc", "https://arcanpainting.ca")).toBe("https://arcanpainting.ca/i/abc");
  });
  it("reuses an existing token", async () => {
    const db = vi.fn().mockResolvedValueOnce([{ public_token: "kept" }]);
    await expect(ensurePublicToken(db, "invoices", 3)).resolves.toBe("kept");
    expect(db).toHaveBeenCalledOnce();
  });
  it("refuses tables without public pages", async () => {
    await expect(ensurePublicToken(vi.fn(), "leads", 1)).rejects.toThrow();
  });
});

describe("uploads", () => {
  it("identifies photos and PDFs by content", () => {
    expect(sniffType(Buffer.from([0xff, 0xd8, 0xff, 0xe0]))).toMatchObject({ ext: "jpg" });
    expect(sniffType(Buffer.from("%PDF-1.7"))).toMatchObject({ ext: "pdf" });
    expect(sniffType(Buffer.from("<script>alert(1)</script>"))).toBeNull();
  });
  it("rejects empty and unknown files before writing", async () => {
    expect((await saveUpload(Buffer.alloc(0))).status).toBe(400);
    expect((await saveUpload(Buffer.from("MZ executable"))).status).toBe(415);
  });
});

describe("recordCheckoutPayment", () => {
  const session = { id: "cs_test_123", payment_status: "paid", amount_total: 56500, payment_intent: "pi_1", metadata: { invoice_id: "7" } };

  it("records a cleared card payment and recalculates the invoice", async () => {
    const tx = vi.fn()
      .mockResolvedValueOnce([{ id: 7 }])            // invoice exists
      .mockResolvedValueOnce([{ id: 99 }])           // payment inserted
      .mockResolvedValueOnce([{ total_amount: "565.00", status: "sent" }]) // recalc: invoice
      .mockResolvedValueOnce([{ paid: "565.00" }])   // recalc: sum
      .mockResolvedValueOnce([{ id: 7 }])            // recalc: update
      .mockResolvedValueOnce([]);                    // notification
    const db = { transaction: (fn) => fn(tx) };
    await expect(recordCheckoutPayment(db, session)).resolves.toEqual({ recorded: true, paymentId: 99 });
    const insert = tx.mock.calls[1];
    expect(insert[0].join("?")).toContain("ON CONFLICT (payment_number) DO NOTHING");
    expect(insert.slice(1, 6)).toEqual(["STRIPE-cs_test_123", 7, "cs_test_123", 565, expect.any(String)]);
  });

  it("ignores a webhook it has already recorded", async () => {
    const tx = vi.fn().mockResolvedValueOnce([{ id: 7 }]).mockResolvedValueOnce([]);
    await expect(recordCheckoutPayment({ transaction: (fn) => fn(tx) }, session)).resolves.toMatchObject({ recorded: false, reason: "already recorded" });
  });

  it("ignores unpaid or unrelated sessions", async () => {
    await expect(recordCheckoutPayment({}, { ...session, payment_status: "unpaid" })).resolves.toMatchObject({ recorded: false });
    await expect(recordCheckoutPayment({}, { ...session, metadata: {} })).resolves.toMatchObject({ recorded: false });
  });
});

describe("approveEstimate", async () => {
  const { approveEstimate } = await import("@/app/api/utils/approve-estimate");

  it("records the customer's acceptance even when the job already exists", async () => {
    const tx = vi.fn()
      .mockResolvedValueOnce([{ id: 4, lead_id: null, project_title: "Kitchen", total_cost: "1130", status: "sent" }])
      .mockResolvedValueOnce([])                                   // UPDATE estimates
      .mockResolvedValueOnce([{ id: 9, project_name: "Kitchen" }]); // existing project
    await expect(approveEstimate(tx, 4, { acceptedName: "Dana" })).resolves.toEqual({ project: { id: 9, project_name: "Kitchen" }, created: false });
    expect(tx.mock.calls[1][0].join("?")).toContain("accepted_name");
    expect(tx).toHaveBeenCalledTimes(3);
  });

  it("refuses expired estimates", async () => {
    const tx = vi.fn().mockResolvedValueOnce([{ id: 4, status: "expired" }]);
    await expect(approveEstimate(tx, 4)).resolves.toMatchObject({ status: 409 });
  });
});
