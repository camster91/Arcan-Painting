import { describe, expect, it } from "vitest";
import {
  agingBucket,
  toCsv,
} from "../src/app/api/utils/accounting-export-domain";

describe("accounting export", () => {
  it("assigns receivables to standard aging buckets", () => {
    expect([
      agingBucket(0),
      agingBucket(15),
      agingBucket(45),
      agingBucket(75),
      agingBucket(120),
    ]).toEqual([
      "current",
      "days_1_30",
      "days_31_60",
      "days_61_90",
      "days_90_plus",
    ]);
  });
  it("quotes CSV and neutralizes spreadsheet formulas", () => {
    const csv = toCsv(
      [{ name: '=HYPERLINK("bad")', amount: 10 }],
      ["name", "amount"],
    );
    expect(csv).toContain("'=HYPERLINK");
    expect(csv).toContain('""bad""');
  });
});
