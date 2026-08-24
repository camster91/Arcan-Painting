import { describe, expect, test } from "vitest";
import { isExpiredAt } from "@/app/api/utils/auth";

describe("isExpiredAt", () => {
  test("treats a past database Date as expired", () => {
    expect(isExpiredAt(new Date("2020-01-01T00:00:00.000Z"), new Date("2026-08-24T00:00:00.000Z"))).toBe(true);
  });

  test("accepts a future database Date", () => {
    expect(isExpiredAt(new Date("2027-01-01T00:00:00.000Z"), new Date("2026-08-24T00:00:00.000Z"))).toBe(false);
  });
});
