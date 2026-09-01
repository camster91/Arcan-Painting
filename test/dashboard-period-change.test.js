import { describe, expect, test } from "vitest";
import { calculatePeriodChange } from "@/app/api/admin/dashboard/route";

describe("dashboard period comparisons", () => {
  test("calculates source-backed increases and decreases", () => {
    expect(calculatePeriodChange(12, 10)).toBe(20);
    expect(calculatePeriodChange(5, 10)).toBe(-50);
  });
  test("does not invent a percentage when the prior period has no baseline", () => {
    expect(calculatePeriodChange(4, 0)).toBeNull();
    expect(calculatePeriodChange(0, 0)).toBe(0);
  });
});
