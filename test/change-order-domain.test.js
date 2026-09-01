import { describe, expect, test } from "vitest";
import { calculateChangeOrder, canTransitionChangeOrder } from "@/app/api/change-orders/route";

describe("change order domain rules", () => {
  test("calculates Ontario tax and approved value", () => {
    expect(calculateChangeOrder("1000", "13")).toEqual({ amount: 1000, taxRate: 13, taxAmount: 130, totalAmount: 1130 });
  });
  test.each([["draft", "sent"], ["draft", "approved"], ["sent", "approved"], ["sent", "rejected"], ["approved", "void"]])("allows %s to %s", (from, to) => expect(canTransitionChangeOrder(from, to)).toBe(true));
  test.each([["approved", "draft"], ["rejected", "approved"], ["void", "draft"]])("rejects %s to %s", (from, to) => expect(canTransitionChangeOrder(from, to)).toBe(false));
  test("rejects negative value and invalid tax", () => {
    expect(() => calculateChangeOrder(-1, 13)).toThrow();
    expect(() => calculateChangeOrder(100, 101)).toThrow();
  });
});
