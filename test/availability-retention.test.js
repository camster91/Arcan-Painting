import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const source = readFileSync(
  join(process.cwd(), "src/app/api/availability/route.js"),
  "utf8",
);

describe("availability history retention", () => {
  test("protects booked appointment history inside a transaction", () => {
    expect(source).toContain("sql.transaction");
    expect(source).toContain("FROM appointments");
    expect(source).toContain("appointments.count > 0");
    expect(source).toContain("Close the slot instead");
  });

  test("audits slot creation and deletion", () => {
    expect(source).toContain('action: "availability_slot.create"');
    expect(source).toContain('action: "availability_slot.status_update"');
    expect(source).toContain('action: "availability_slot.delete"');
  });
});
