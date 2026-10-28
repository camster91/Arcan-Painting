// App timestamps are stored as UTC in timezone-less database columns. Parse a
// database text value explicitly as UTC, independently of the host's timezone.
const timestamp = value => new Date(typeof value === "string" && /^\d{4}-\d\d-\d\d[ T]\d\d:\d\d:\d\d(?:\.\d+)?$/.test(value)
  ? value.replace(" ", "T") + "Z" : value).getTime();

/** Derive hours/cost from the saved interval, break and explicit internal rate. */
export function timeEntryTotals({ clock_in_time, clock_out_time, break_duration_minutes, hourly_rate }) {
  const start = timestamp(clock_in_time);
  const minutes = Number(break_duration_minutes ?? 0);
  const rate = hourly_rate == null || hourly_rate === "" ? null : Number(hourly_rate);
  if (!Number.isFinite(start)) return { error: "Clock in time is invalid" };
  if (!Number.isFinite(minutes) || minutes < 0) return { error: "Break duration must be zero or greater" };
  if (rate !== null && (!Number.isFinite(rate) || rate < 0)) return { error: "Hourly rate must be zero or greater" };
  if (!clock_out_time) return { total_hours: null, total_cost: null };
  const end = timestamp(clock_out_time);
  if (!Number.isFinite(end) || end < start) return { error: "Clock out time must be at or after clock in time" };
  const elapsedMinutes = (end - start) / 60000;
  if (minutes > elapsedMinutes) return { error: "Break duration cannot exceed the time worked" };
  const hours = (elapsedMinutes - minutes) / 60;
  return { total_hours: hours, total_cost: rate === null ? null : hours * rate };
}
