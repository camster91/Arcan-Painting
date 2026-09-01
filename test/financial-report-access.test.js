import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = readFileSync(
  resolve(process.cwd(), "src/app/api/financial-report/route.js"),
  "utf8",
);

describe("financial report access", () => {
  it("requires financial read authority and prevents caching sensitive exports", () => {
    expect(source).toContain('hasPermission(user, "finance.read")');
    expect(source).toContain('"Cache-Control": "private, no-store"');
  });
  it("exports invoices, payments, actual expenses, and commitments", () => {
    for (const table of [
      "invoices",
      "payments",
      "project_expenses",
      "purchase_orders",
    ])
      expect(source).toContain(table);
  });
});
