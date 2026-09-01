import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = readFileSync(resolve(process.cwd(), "src/app/api/payments/route.js"), "utf8");
const ui = readFileSync(resolve(process.cwd(), "src/components/admin/invoices/PaymentsListModal.jsx"), "utf8");

describe("payment ledger access and persistence", () => {
  it("restricts payment operations to the owner and counts cleared cash only", () => {
    expect(source.match(/Owner access required/g)?.length).toBeGreaterThanOrEqual(4);
    expect(source).toContain("status = 'cleared'");
    expect(source).not.toContain("status IN ('cleared', 'pending')");
  });

  it("does not physically delete financial history", () => {
    expect(source).not.toMatch(/DELETE FROM payments/);
    expect(source).toContain("Payments cannot be deleted");
    expect(ui).not.toContain("deletePayment");
  });
});
