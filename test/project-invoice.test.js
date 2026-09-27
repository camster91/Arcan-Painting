import { describe, expect, it } from "vitest";
import { estimatePreTax, planProjectInvoice, invoiceTotals, generateInvoiceNumber } from "@/app/api/utils/project-invoice";

describe("estimatePreTax", () => {
  it("removes HST from estimate-builder totals", () => {
    expect(estimatePreTax("1130.00", "13.00")).toBe(1000);
  });
  it("treats estimates without a tax rate as pre-tax", () => {
    expect(estimatePreTax("1000.00", null)).toBe(1000);
  });
});

describe("planProjectInvoice", () => {
  it("bills a percentage of the pre-tax amount as the deposit", () => {
    expect(planProjectInvoice({ contractSubtotal: 1000, kind: "deposit", depositPercent: 25 })).toMatchObject({ subtotal: 250 });
  });
  it("refuses a second deposit", () => {
    expect(planProjectInvoice({ contractSubtotal: 1000, kind: "deposit", hasDeposit: true }).error).toMatch(/already/);
  });
  it("bills the remaining balance on the final invoice", () => {
    expect(planProjectInvoice({ contractSubtotal: 1000, kind: "final", invoicedSubtotal: 250 })).toMatchObject({ subtotal: 750 });
  });
  it("refuses a final invoice when nothing is left", () => {
    expect(planProjectInvoice({ contractSubtotal: 1000, kind: "final", invoicedSubtotal: 1000 }).error).toMatch(/in full/);
  });
  it("rejects jobs without an amount and unknown kinds", () => {
    expect(planProjectInvoice({ contractSubtotal: 0, kind: "final" }).error).toBeTruthy();
    expect(planProjectInvoice({ contractSubtotal: 100, kind: "progress" }).error).toBeTruthy();
  });
});

describe("invoiceTotals", () => {
  it("adds 13% HST rounded to the cent", () => {
    expect(invoiceTotals(333.33)).toEqual({ subtotal: 333.33, tax_amount: 43.33, total_amount: 376.66 });
  });
});

it("generates dated invoice numbers", () => {
  expect(generateInvoiceNumber(new Date("2026-09-27T12:00:00Z"))).toMatch(/^INV-20260927-\d{5}$/);
});
