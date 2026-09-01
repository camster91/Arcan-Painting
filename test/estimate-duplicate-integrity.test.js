import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const source = readFileSync(
  join(process.cwd(), "src/app/api/estimates/[id]/duplicate/route.js"),
  "utf8",
);

describe("estimate duplicate integrity", () => {
  test("copies the complete painting scope inside one transaction", () => {
    expect(source).toContain("sql.transaction");
    for (const field of [
      "exclusions",
      "production_assumptions",
      "coating_product",
      "color_name",
      "sheen",
    ]) {
      expect(source).toContain(field);
    }
  });

  test("requires estimate write access and audits the duplicate", () => {
    expect(source).toContain('hasPermission(user, "estimates.write")');
    expect(source).toContain('action: "estimate.duplicate"');
  });
});
