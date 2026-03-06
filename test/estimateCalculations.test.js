import { describe, test, expect } from "vitest";
import { calculateEstimate } from "@/utils/estimateCalculations";

describe("calculateEstimate", () => {
  test("calculates estimate with valid dimensions", () => {
    const result = calculateEstimate({
      length: 10,
      width: 12,
      height: 8,
      hourlyCost: 35,
      finishPaintCost: 42,
      markupPct: 20,
      taxRate: 13,
    });

    expect(result).toHaveProperty("labor");
    expect(result).toHaveProperty("materials");
    expect(result).toHaveProperty("markup");
    expect(result).toHaveProperty("subtotal");
    expect(result).toHaveProperty("tax");
    expect(result).toHaveProperty("total");
    expect(result).toHaveProperty("wallArea");
    expect(result).toHaveProperty("ceilingArea");
    expect(result).toHaveProperty("laborHours");
    expect(result).toHaveProperty("paintGallons");

    // Basic sanity checks
    expect(result.wallArea).toBe(352); // 2 * (10 + 12) * 8 = 352
    expect(result.ceilingArea).toBe(120); // 10 * 12 = 120
    expect(result.total).toBeGreaterThan(0);
    expect(result.tax).toBeGreaterThan(0);
    expect(result.subtotal).toBeGreaterThan(0);
  });

  test("returns zeros for invalid dimensions", () => {
    const result = calculateEstimate({
      length: 0,
      width: 0,
      height: 0,
    });

    expect(result.labor).toBe(0);
    expect(result.materials).toBe(0);
    expect(result.markup).toBe(0);
    expect(result.subtotal).toBe(0);
    expect(result.tax).toBe(0);
    expect(result.total).toBe(0);
  });

  test("handles missing optional parameters with defaults", () => {
    const result = calculateEstimate({
      length: 10,
      width: 12,
      height: 8,
      // hourlyCost defaults to 35
      // finishPaintCost defaults to 42
      // markupPct defaults to 20
      // taxRate defaults to 13
    });

    expect(result.total).toBeGreaterThan(0);
  });

  test("calculates correct values with custom parameters", () => {
    const result = calculateEstimate({
      length: 20,
      width: 15,
      height: 10,
      hourlyCost: 50,
      finishPaintCost: 60,
      markupPct: 30,
      taxRate: 10,
    });

    // Verify calculations
    const wallArea = 2 * (20 + 15) * 10; // 700
    const ceilingArea = 20 * 15; // 300
    expect(result.wallArea).toBe(wallArea);
    expect(result.ceilingArea).toBe(ceilingArea);
  });
});