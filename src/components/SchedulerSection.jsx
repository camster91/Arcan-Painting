"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function SchedulerSection() {
  const queryClient = useQueryClient();
  // -- state
  // UPDATED: default to next available weekday (no same-day booking)
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 1); // start from tomorrow
    // skip weekends
    while (d.getDay() === 0 || d.getDay() === 6) {
      d.setDate(d.getDate() + 1);
    }
    return d;
  });
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
  });
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  // Prefill from URL params if available
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    setForm((f) => ({
      ...f,
      name: params.get("name") || f.name,
      email: params.get("email") || f.email,
      phone: params.get("phone") || f.phone,
      address: params.get("address") || f.address,
    }));
  }, []);

  // --- helpers
  const toISODate = useCallback((dateObj) => {
    if (!dateObj) return null;
    const d = new Date(dateObj);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split("T")[0];
  }, []);

  const formattedDate = useMemo(
    () => toISODate(selectedDate),
    [selectedDate, toISODate],
  );

  // Build a 90-day weekday strip (Mon–Fri), starting tomorrow to avoid same-day bookings
  const dateStrip = useMemo(() => {
    const days = [];
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() + 1); // start from tomorrow
    for (let i = 0; i < 90; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const day = d.getDay(); // 0 Sun .. 6 Sat
      if (day === 0 || day === 6) continue; // skip weekends
      days.push(d);
    }
    return days;
  }, []);

  const quickPick = useCallback((type) => {
    const base = new Date();
    base.setHours(0, 0, 0, 0);
    if (type === "tomorrow") {
      const t = new Date(base);
      t.setDate(t.getDate() + 1);
      // ensure weekday
      while (t.getDay() === 0 || t.getDay() === 6) t.setDate(t.getDate() + 1);
      setSelectedDate(t);
      return;
    }
    if (type === "nextweek") {
      const n = new Date(base);
      n.setDate(n.getDate() + 7);
      // ensure weekday
      while (n.getDay() === 0 || n.getDay() === 6) n.setDate(n.getDate() + 1);
      setSelectedDate(n);
      return;
    }
  }, []);

  // fetch availability for the picked date
  const { data: availabilityData, isLoading } = useQuery({
    queryKey: ["availability", formattedDate],
    enabled: !!formattedDate,
    queryFn: async () => {
      const res = await fetch(`/api/availability?date=${formattedDate}`);
      if (!res.ok) {
        throw new Error(
          `When fetching /api/availability, the response was [${res.status}] ${res.statusText}`,
        );
      }
      return res.json();
    },
  });

  const slots = availabilityData?.slots || [];

  const bookMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        if (res.status === 409) {
          const j = await res.json();
          throw new Error(j.error || "Selected time is no longer available");
        }
        throw new Error(
          `When booking /api/appointments, the response was [${res.status}] ${res.statusText}`,
        );
      }
      return res.json();
    },
    onSuccess: () => {
      setMessage(
        "Booked! We'll send a calendar invite and reach out to confirm.",
      );
      setError(null);
      setSelectedSlotId(null);
      setForm({ name: "", email: "", phone: "", address: "", notes: "" });
      queryClient.invalidateQueries({
        queryKey: ["availability", formattedDate],
      });
    },
    onError: (e) => {
      console.error(e);
      setError(e.message || "Could not book the appointment");
      setMessage(null);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedSlotId) {
      setError("Please select a time");
      return;
    }
    if (!form.name) {
      setError("Please enter your name");
      return;
    }
    if (!form.email && !form.phone) {
      setError("Please provide either email or phone");
      return;
    }
    if (!form.address) {
      setError("Please provide the meeting address");
      return;
    }
    bookMutation.mutate({
      slotId: selectedSlotId,
      name: form.name,
      email: (form.email || "").trim(),
      phone: (form.phone || "").trim(),
      address: form.address,
      notes: form.notes,
      serviceType: "Estimate",
    });
  };

  const timesForDay = useMemo(() => {
    return slots.map((s) => ({
      id: s.id,
      label: `${s.start_time?.slice(0, 5)} - ${s.end_time?.slice(0, 5)}`,
      remaining: Number(s.remaining),
    }));
  }, [slots]);

  // formatting helpers for date strip
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  return (
    <section
      id="schedule"
      className="py-16 bg-white"
      style={{
        fontFamily:
          'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-slate-900">
            Book a Free On-Site Quote
          </h2>
          <p className="text-slate-600 mt-2">
            Pick a weekday in the next few days, weeks, or months and choose a
            time. Tell us where to meet you and we'll send calendar invites.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left: Calendly-style date + times */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            {/* Quick picks */}
            <div className="flex items-center gap-2 mb-4 overflow-x-auto">
              {/* Removed Today to prevent same-day booking */}
              <button
                onClick={() => quickPick("tomorrow")}
                className="px-3 py-1.5 rounded-full border border-slate-300 bg-white text-slate-700 hover:border-amber-300 hover:text-amber-700 text-sm whitespace-nowrap"
              >
                Tomorrow
              </button>
              <button
                onClick={() => quickPick("nextweek")}
                className="px-3 py-1.5 rounded-full border border-slate-300 bg-white text-slate-700 hover:border-amber-300 hover:text-amber-700 text-sm whitespace-nowrap"
              >
                Next Week
              </button>
            </div>

            {/* Date strip */}
            <div className="overflow-x-auto -mx-2 px-2">
              <div className="inline-flex gap-2 min-w-full">
                {dateStrip.map((d) => {
                  const isActive = formattedDate === toISODate(d);
                  const dow = dayNames[d.getDay()];
                  const dateNum = d.getDate();
                  const mon = monthNames[d.getMonth()];
                  return (
                    <button
                      key={d.toISOString()}
                      onClick={() => setSelectedDate(d)}
                      className={`flex flex-col items-center justify-center w-[80px] py-2 rounded-xl border text-sm transition-all ${
                        isActive
                          ? "bg-amber-500 border-amber-600 text-white shadow"
                          : "bg-white border-slate-300 text-slate-700 hover:border-amber-300 hover:text-amber-700"
                      }`}
                    >
                      <span className="text-xs opacity-80">{dow}</span>
                      <span className="text-lg font-semibold leading-tight">
                        {String(dateNum).padStart(2, "0")}
                      </span>
                      <span className="text-[11px] opacity-80">{mon}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Times for selected date */}
            <div className="mt-5">
              <h3 className="font-semibold text-slate-900 mb-2">
                Available times
              </h3>
              {isLoading ? (
                <p className="text-slate-600 text-sm">Loading...</p>
              ) : timesForDay.length === 0 ? (
                <p className="text-slate-600 text-sm">
                  No availability on this day.
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {timesForDay.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedSlotId(t.id)}
                      className={`px-4 py-3 rounded-lg border text-base font-medium transition-all ${
                        selectedSlotId === t.id
                          ? "bg-amber-500 border-amber-600 text-white shadow"
                          : "bg-white border-slate-300 text-slate-700 hover:border-amber-300 hover:text-amber-700"
                      }`}
                    >
                      {t.label}
                      <span className="block text-[11px] opacity-70">
                        {t.remaining} left
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Booking form */}
          <form
            onSubmit={handleSubmit}
            className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-sm text-slate-700">Full name</label>
                <input
                  type="text"
                  autoComplete="name"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="text-sm text-slate-700">
                  Email (or Phone)
                </label>
                <input
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="text-sm text-slate-700">
                  Phone (or Email)
                </label>
                <input
                  type="tel"
                  autoComplete="tel"
                  value={form.phone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, phone: e.target.value }))
                  }
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  placeholder="(555) 123-4567"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm text-slate-700">
                  Meeting address
                </label>
                <input
                  type="text"
                  autoComplete="street-address"
                  value={form.address}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, address: e.target.value }))
                  }
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  placeholder="Street, City"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm text-slate-700">
                  Notes (optional)
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  rows={3}
                  placeholder="Tell us a bit about your project"
                />
              </div>
            </div>
            {error && (
              <div className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-2">
                {error}
              </div>
            )}
            {message && (
              <div className="mt-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-2">
                {message}
              </div>
            )}
            <button
              type="submit"
              disabled={!selectedSlotId || bookMutation.isLoading}
              className="mt-6 w-full bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              {bookMutation.isLoading ? "Booking..." : "Book Estimate"}
            </button>
            <p className="text-xs text-slate-500 mt-3">
              We'll email you a calendar invite with all details.
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}
