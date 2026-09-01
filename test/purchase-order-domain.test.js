import { describe, expect, it } from "vitest";
import {
  assertPurchaseTransition,
  validatePurchaseEvidence,
  validatePurchaseOrder,
} from "../src/app/api/utils/purchase-order-domain";

describe("purchase order domain", () => {
  it("validates vendor commitments", () => {
    expect(
      validatePurchaseOrder({
        category: "material",
        vendor: "Dulux",
        description: "Interior paint",
        amount: 100,
        tax_amount: 13,
      }),
    ).toMatchObject({ totalAmount: 113 });
    expect(() =>
      validatePurchaseOrder({
        category: "material",
        vendor: "",
        description: "Paint",
        amount: 100,
      }),
    ).toThrow(/Vendor/);
    expect(
      validatePurchaseEvidence({
        receipt_url: "https://files.example.test/receipt.pdf",
      }),
    ).toMatchObject({ receiptUrl: "https://files.example.test/receipt.pdf" });
    expect(() =>
      validatePurchaseEvidence({ receipt_url: "javascript:alert(1)" }),
    ).toThrow(/HTTPS/);
  });
  it("enforces a one-way purchasing lifecycle", () => {
    expect(() => assertPurchaseTransition("draft", "approved")).not.toThrow();
    expect(() => assertPurchaseTransition("approved", "received")).toThrow(
      /cannot move/,
    );
    expect(() => assertPurchaseTransition("received", "cancelled")).toThrow(
      /cannot move/,
    );
  });
});
