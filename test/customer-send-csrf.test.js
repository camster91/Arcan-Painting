import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const read = (path) => readFileSync(join(process.cwd(), path), "utf8");

describe("customer document delivery CSRF and receipt controls", () => {
  test.each([
    "src/app/api/estimates/[id]/send/route.js",
    "src/app/api/contracts/[id]/send/route.js",
    "src/app/api/invoices/[id]/send/route.js",
    "src/app/api/payments/[id]/receipt/route.js",
  ])("enforces CSRF before delivery in %s", (path) => {
    const source = read(path);
    expect(source).toContain("const csrfError = requireCsrf(request)");
    expect(source.indexOf("const csrfError")).toBeLessThan(
      source.indexOf("await sendEmail({"),
    );
  });

  test("requires finance permission, cleared state, and an audit event for receipts", () => {
    const source = read("src/app/api/payments/[id]/receipt/route.js");
    expect(source).toContain('hasPermission(user, "finance.write")');
    expect(source).toContain("assertReceiptEligible(p.status)");
    expect(source).toContain('action: "payment.receipt_send"');
  });
});
