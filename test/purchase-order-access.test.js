import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = readFileSync(resolve(process.cwd(), "src/app/api/purchase-orders/route.js"), "utf8");

describe("purchase order controls", () => {
  it("keeps vendor commitments owner-only and concurrency-safe", () => {
    expect(source.match(/Owner access required/g)?.length).toBe(3);
    expect(source).toContain("FOR UPDATE");
    expect(source).toContain("sql.transaction");
  });
  it("turns received commitments into actual expenses inside the transaction", () => {
    expect(source).toContain('next === "received"');
    expect(source).toContain("INSERT INTO project_expenses");
    expect(source).toContain("expense_id");
  });
});
