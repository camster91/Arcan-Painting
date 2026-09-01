import { describe, expect, test } from "vitest";
import { parseTimeEntryInput } from "@/app/api/utils/time-tracking-domain";

const now = new Date("2026-09-01T17:00:00.000Z");

describe("time tracking invariants", () => {
  test("calculates payable hours after a bounded break", () => {
    expect(parseTimeEntryInput({ clock_in_time: "2026-09-01T08:00:00.000Z", clock_out_time: "2026-09-01T16:30:00.000Z", break_duration_minutes: 30 }, { now })).toMatchObject({ breakMinutes: 30, totalHours: 8 });
  });

  test("rejects impossible or unsafe shift windows", () => {
    expect(() => parseTimeEntryInput({ clock_in_time: "invalid" }, { now })).toThrow("valid clock-in");
    expect(() => parseTimeEntryInput({ clock_in_time: "2026-09-01T18:00:00.000Z" }, { now })).toThrow("future");
    expect(() => parseTimeEntryInput({ clock_in_time: "2026-09-01T16:00:00.000Z", clock_out_time: "2026-09-01T15:00:00.000Z" }, { now })).toThrow("after clock-in");
    expect(() => parseTimeEntryInput({ clock_in_time: "2026-08-30T08:00:00.000Z", clock_out_time: "2026-09-01T09:00:00.000Z" }, { now })).toThrow("24 hours");
    expect(() => parseTimeEntryInput({ clock_in_time: "2026-09-01T08:00:00.000Z", clock_out_time: "2026-09-01T09:00:00.000Z", break_duration_minutes: 60 }, { now })).toThrow("shorter than the shift");
  });
});
