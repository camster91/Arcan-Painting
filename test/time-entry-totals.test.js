import { expect, it } from "vitest";
import { timeEntryTotals } from "../src/app/api/utils/time-entry-totals.js";

const shift = { clock_in_time: "2026-10-21T12:00:00Z", clock_out_time: "2026-10-21T20:00:00Z", break_duration_minutes: 60, hourly_rate: 50 };
it("calculates hours and cost from the interval and break", () => {
  expect(timeEntryTotals(shift)).toEqual({ total_hours: 7, total_cost: 350 });
});
it("preserves zero breaks and zero rates", () => {
  expect(timeEntryTotals({ ...shift, break_duration_minutes: 0, hourly_rate: 100 })).toEqual({ total_hours: 8, total_cost: 800 });
  expect(timeEntryTotals({ ...shift, break_duration_minutes: "0", hourly_rate: "0" })).toEqual({ total_hours: 8, total_cost: 0 });
});
it("keeps missing rates and active timers incomplete", () => {
  expect(timeEntryTotals({ ...shift, hourly_rate: null })).toEqual({ total_hours: 7, total_cost: null });
  expect(timeEntryTotals({ ...shift, clock_out_time: null })).toEqual({ total_hours: null, total_cost: null });
});
it("compares saved UTC database text with a client ISO clock-out without a host-timezone shift", () => {
  expect(timeEntryTotals({ ...shift, clock_in_time: "2026-10-21 12:00:00", break_duration_minutes: 0 })).toEqual({ total_hours: 8, total_cost: 400 });
});
it.each([
  { clock_in_time: "bad" }, { clock_out_time: "bad" }, { clock_out_time: "2026-10-21T11:00:00Z" },
  { break_duration_minutes: -1 }, { break_duration_minutes: 481 }, { break_duration_minutes: "bad" },
  { hourly_rate: -1 }, { hourly_rate: "bad" },
])("rejects invalid financial inputs %j", (fields) => {
  expect(timeEntryTotals({ ...shift, ...fields }).error).toBeTruthy();
});
