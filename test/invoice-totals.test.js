import { describe, expect, it, vi } from "vitest";
import { invoiceBalance, recalcInvoiceTotals } from "@/app/api/utils/invoice-totals";

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
