import { describe, expect, it } from "vitest";
import { assertPaymentCreateStatus, assertPaymentUpdate, invoiceBalance } from "../src/app/api/utils/payment-domain";

describe("payment ledger rules", () => {
  it("counts cleared cash only and clamps customer balances", () => {
    expect(invoiceBalance(1000, 250)).toEqual({ amount_paid: 250, amount_due: 750, customer_credit: 0, payment_status: "partial" });
    expect(invoiceBalance(1000, 1100)).toEqual({ amount_paid: 1100, amount_due: 0, customer_credit: 100, payment_status: "paid" });
  });

  it("prevents fabricated refunds and mutation of settled financial facts", () => {
    expect(() => assertPaymentCreateStatus("refunded")).toThrow(/cannot start/);
    expect(() => assertPaymentUpdate({ status: "cleared" }, { amount: 5 })).toThrow(/immutable/);
    expect(() => assertPaymentUpdate({ status: "cleared" }, { status: "pending" })).toThrow(/cannot move/);
    expect(() => assertPaymentUpdate({ status: "cleared" }, { status: "refunded" })).not.toThrow();
  });
});
