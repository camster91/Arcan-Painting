import { describe, expect, it, vi } from "vitest";
import { invoiceBalance, recalcInvoiceTotals, lockPaymentForMutation } from "@/app/api/utils/invoice-totals";

describe("invoiceBalance", () => {
  it("marks a fully paid invoice as paid", () => {
    expect(invoiceBalance("1130.00", "1130.00", "sent")).toEqual({ paid: 1130, due: 0, paymentStatus: "paid", status: "paid" });
  });

  it("handles partial payments without float drift", () => {
    expect(invoiceBalance("100.10", "33.37", "sent")).toEqual({ paid: 33.37, due: 66.73, paymentStatus: "partial", status: "sent" });
  });

  it("moves a paid invoice back to sent when a payment is removed", () => {
    expect(invoiceBalance("500", "0", "paid")).toMatchObject({ paymentStatus: "unpaid", status: "sent" });
  });

  it("keeps cancelled invoices cancelled", () => {
    expect(invoiceBalance("500", "500", "cancelled").status).toBe("cancelled");
  });
});

describe("recalcInvoiceTotals", () => {
  it("counts only cleared payments and writes the computed balance", async () => {
    const db = vi.fn()
      .mockResolvedValueOnce([{ total_amount: "1000.00", status: "sent" }])
      .mockResolvedValueOnce([{ paid: "250.00" }])
      .mockResolvedValueOnce([{ id: 7, payment_status: "partial" }]);

    await expect(recalcInvoiceTotals(db, 7)).resolves.toEqual({ id: 7, payment_status: "partial" });
    expect(db.mock.calls[0][0].join("")).toContain("FOR UPDATE");

    const sumSql = db.mock.calls[1][0].join("");
    expect(sumSql).toContain("status = 'cleared'");
    expect(sumSql).not.toContain("pending");
    expect(db.mock.calls[2].slice(1)).toEqual([250, 750, "partial", "sent", 7]);
  });

  it("does nothing for a missing invoice", async () => {
    const db = vi.fn().mockResolvedValueOnce([]);
    await expect(recalcInvoiceTotals(db, 99)).resolves.toBeNull();
    expect(db).toHaveBeenCalledOnce();
  });
});

describe("payment mutation locks", () => {
  it("locks the parent before the payment and returns the fresh payment state", async () => {
    const tx = vi.fn()
      .mockResolvedValueOnce([{ invoice_id: 7 }])
      .mockResolvedValueOnce([{ total_amount: 1000, status: "sent" }])
      .mockResolvedValueOnce([{ id: 2, invoice_id: 7, amount: 250 }]);
    expect(await lockPaymentForMutation(tx, 2)).toMatchObject({ id: 2, amount: 250 });
    const queries = tx.mock.calls.map(([parts]) => parts.join("?"));
    expect(queries[0]).not.toContain("FOR UPDATE");
    expect(queries[1]).toMatch(/FROM invoices .*FOR UPDATE/);
    expect(queries[2]).toMatch(/FROM payments .*FOR UPDATE/);
  });

  it("handles a payment deleted while waiting for the parent", async () => {
    const tx = vi.fn().mockResolvedValueOnce([{ invoice_id: 7 }])
      .mockResolvedValueOnce([{ total_amount: 1000, status: "sent" }])
      .mockResolvedValueOnce([]);
    expect(await lockPaymentForMutation(tx, 2)).toBeNull();
  });

  it("locks contract-only payments without requiring an invoice", async () => {
    const tx = vi.fn().mockResolvedValueOnce([{ invoice_id: null }])
      .mockResolvedValueOnce([{ id: 2, invoice_id: null }]);
    expect(await lockPaymentForMutation(tx, 2)).toMatchObject({ id: 2, invoice_id: null });
    expect(tx).toHaveBeenCalledTimes(2);
  });

  it("returns null for a missing payment without any locking write", async () => {
    const tx = vi.fn().mockResolvedValueOnce([]);
    expect(await lockPaymentForMutation(tx, 99)).toBeNull();
    expect(tx).toHaveBeenCalledOnce();
  });
});
