import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const read = (path) => readFileSync(join(process.cwd(), path), "utf8");

describe("customer send audit coverage", () => {
  test.each([
    ["estimate", "src/app/api/estimates/[id]/send/route.js", "estimate.send"],
    ["contract", "src/app/api/contracts/[id]/send/route.js", "contract.send"],
    ["invoice", "src/app/api/invoices/[id]/send/route.js", "invoice.send"],
  ])("audits successful %s delivery", (_name, path, action) => {
    const source = read(path);
    expect(source).toContain("await auditLog({");
    expect(source).toContain(`action: "${action}"`);
    expect(source.indexOf("await sendEmail({")).toBeLessThan(
      source.indexOf(`action: "${action}"`),
    );
  });
});
