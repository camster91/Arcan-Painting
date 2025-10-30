export function groupByDate(appointments) {
  const map = new Map();
  for (const a of appointments) {
    const key = a.slot_date;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(a);
  }
  // sort within each day by start_time
  for (const arr of map.values()) {
    arr.sort((x, y) => (x.start_time || "").localeCompare(y.start_time || ""));
  }
  return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
}

export function groupProjectsByStart(projects) {
  const map = new Map();
  for (const p of projects) {
    const key = p.start_date || "Unscheduled";
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(p);
  }
  return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
}

export function formatTime(hhmmss) {
  if (!hhmmss) return "";
  const [h, m] = hhmmss.split(":");
  const d = new Date();
  d.setHours(Number(h), Number(m), 0, 0);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function toISODate(d) {
  if (!d) return null;
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return null;
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const da = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
}

export const AVAIL_COLORS = {
  available: "bg-emerald-50 text-emerald-700 border-emerald-200",
  busy: "bg-rose-50 text-rose-700 border-rose-200",
  pto: "bg-amber-50 text-amber-800 border-amber-200",
  holiday: "bg-slate-100 text-slate-700 border-slate-200",
};

export const AVAIL_OPTIONS = [
  { value: "available", label: "Available" },
  { value: "busy", label: "Busy" },
  { value: "pto", label: "PTO" },
  { value: "holiday", label: "Holiday" },
];
