import { describe, expect, test } from "vitest";
import { calculateInvoiceTotals } from "@/app/api/invoices/route";

describe("invoice financial invariants", () => {
  test("calculates subtotal, tax, and total from normalized line items", () => {
    const result = calculateInvoiceTotals([
      { description: "  Prep and protection  ", quantity: "2", unit_price: "125.50" },
      { description: "Finish coat", quantity: 1, unit_price: 500 },
    ], "13");

    expect(result.lineItems[0]).toMatchObject({ description: "Prep and protection", quantity: 2, unit_price: 125.5, line_total: 251 });
    expect(result.subtotal).toBe(751);
    expect(result.taxAmount).toBeCloseTo(97.63);
    expect(result.totalAmount).toBeCloseTo(848.63);
  });

  test.each([
    [[{ description: "", quantity: 1, unit_price: 10 }], 13],
    [[{ description: "Paint", quantity: 0, unit_price: 10 }], 13],
    [[{ description: "Paint", quantity: 1, unit_price: -1 }], 13],
    [[{ description: "Paint", quantity: 1, unit_price: 10 }], -1],
    [[], 13],
  ])("rejects invalid financial input", (lines, rate) => {
    expect(() => calculateInvoiceTotals(lines, rate)).toThrow();
  });
});
