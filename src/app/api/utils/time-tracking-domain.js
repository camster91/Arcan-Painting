export function parseTimeEntryInput(input, { now = new Date() } = {}) {
  const clockIn = new Date(input.clock_in_time);
  const clockOut = input.clock_out_time ? new Date(input.clock_out_time) : null;
  if (Number.isNaN(clockIn.getTime())) throw new Error("A valid clock-in time is required");
  if (clockIn.getTime() > now.getTime() + 5 * 60_000) throw new Error("Clock-in time cannot be in the future");
  if (clockOut && Number.isNaN(clockOut.getTime())) throw new Error("Clock-out time is invalid");
  if (clockOut && clockOut <= clockIn) throw new Error("Clock-out time must be after clock-in time");
  const breakMinutes = Number(input.break_duration_minutes || 0);
  if (!Number.isInteger(breakMinutes) || breakMinutes < 0 || breakMinutes > 720) throw new Error("Break must be between 0 and 720 minutes");
  const elapsedMinutes = clockOut ? (clockOut - clockIn) / 60_000 : null;
  if (elapsedMinutes !== null && elapsedMinutes > 24 * 60) throw new Error("A time entry cannot exceed 24 hours");
  if (elapsedMinutes !== null && breakMinutes >= elapsedMinutes) throw new Error("Break must be shorter than the shift");
  const totalHours = elapsedMinutes === null ? null : (elapsedMinutes - breakMinutes) / 60;
  return { clockIn, clockOut, breakMinutes, totalHours };
}
