"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function AdminAvailabilityPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    slotDate: "",
    startTime: "09:00",
    endTime: "10:00",
    capacity: 1,
    notes: "",
  });
  const [bulkForm, setBulkForm] = useState({
    startDate: "",
    days: 14,
    startTime: "09:00",
    endTime: "17:00",
    slotsPerDay: 4,
    capacity: 1,
    notes: "Auto-generated",
  }); // NEW state
  const [error, setError] = useState(null);
  const [bulkMessage, setBulkMessage] = useState(null); // NEW message

  // Prefill startDate with today
  useEffect(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    const iso = `${y}-${m}-${d}`;
    setBulkForm((f) => ({ ...f, startDate: iso }));
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-availability"],
    queryFn: async () => {
      const res = await fetch("/api/availability?all=1");
      if (!res.ok) {
        throw new Error(
          `When fetching /api/availability (admin), the response was [${res.status}] ${res.statusText}`,
        );
      }
      return res.json();
    },
  });

  const slots = data?.slots || [];

  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await fetch("/api/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error(
          `Create slot failed: [${res.status}] ${res.statusText}`,
        );
      }
      return res.json();
    },
    onSuccess: () => {
      setForm({
        slotDate: "",
        startTime: "09:00",
        endTime: "10:00",
        capacity: 1,
        notes: "",
      });
      queryClient.invalidateQueries({ queryKey: ["admin-availability"] });
    },
    onError: (e) => setError(e.message || "Failed to create slot"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await fetch("/api/availability", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok)
        throw new Error(`Delete failed: [${res.status}] ${res.statusText}`);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin-availability"] }),
  });

  // NEW: Bulk generate mutation
  const bulkMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await fetch("/api/availability/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await res.json();
      if (!res.ok) {
        throw new Error(
          j?.error || `Bulk generate failed: [${res.status}] ${res.statusText}`,
        );
      }
      return j;
    },
    onSuccess: (j) => {
      setBulkMessage(
        `Created ${j.inserted} new slots (attempted ${j.attempted}).`,
      );
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["admin-availability"] });
    },
    onError: (e) => {
      setBulkMessage(null);
      setError(e.message || "Failed to bulk generate");
    },
  });

  const onSubmit = (e) => {
    e.preventDefault();
    setError(null);
    if (!form.slotDate) {
      setError("Date is required");
      return;
    }
    createMutation.mutate({
      slotDate: form.slotDate,
      startTime: form.startTime,
      endTime: form.endTime,
      capacity: Number(form.capacity) || 1,
      notes: form.notes,
      status: "open",
    });
  };

  // NEW: bulk submit handler
  const onBulkSubmit = (e) => {
    e.preventDefault();
    setError(null);
    setBulkMessage(null);
    const payload = {
      startDate: bulkForm.startDate,
      days: Number(bulkForm.days) || 14,
      startTime: bulkForm.startTime,
      endTime: bulkForm.endTime,
      slotsPerDay: Number(bulkForm.slotsPerDay) || 4,
      capacity: Number(bulkForm.capacity) || 1,
      notes: bulkForm.notes || "Auto-generated",
    };
    bulkMutation.mutate(payload);
  };

  return (
    <div
      className="max-w-7xl mx-auto px-6 py-6"
      style={{
        fontFamily:
          'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Availability</h1>
        <p className="text-slate-600">
          Create and manage time slots customers can book for on-site quotes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create slot */}
        <form
          onSubmit={onSubmit}
          className="bg-white border border-slate-200 rounded-xl p-6"
        >
          <h2 className="font-semibold text-slate-900 mb-4">New Time Slot</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-slate-700">Date</label>
              <input
                type="date"
                value={form.slotDate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, slotDate: e.target.value }))
                }
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-700">Start</label>
                <input
                  type="time"
                  value={form.startTime}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, startTime: e.target.value }))
                  }
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
              <div>
                <label className="text-sm text-slate-700">End</label>
                <input
                  type="time"
                  value={form.endTime}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, endTime: e.target.value }))
                  }
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-700">Capacity</label>
                <input
                  type="number"
                  min={1}
                  value={form.capacity}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, capacity: e.target.value }))
                  }
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
              <div>
                <label className="text-sm text-slate-700">Notes</label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  placeholder="Crew A, area, etc."
                />
              </div>
            </div>
            {error && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-2">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={createMutation.isLoading}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2.5 rounded-lg"
            >
              {createMutation.isLoading ? "Creating..." : "Create Slot"}
            </button>
          </div>
        </form>

        {/* NEW: Bulk generator */}
        <form
          onSubmit={onBulkSubmit}
          className="bg-white border border-slate-200 rounded-xl p-6"
        >
          <h2 className="font-semibold text-slate-900 mb-4">
            Quick Generate (M–F 9–5)
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-700">Start Date</label>
                <input
                  type="date"
                  value={bulkForm.startDate}
                  onChange={(e) =>
                    setBulkForm((f) => ({ ...f, startDate: e.target.value }))
                  }
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
              <div>
                <label className="text-sm text-slate-700">Days</label>
                <input
                  type="number"
                  min={1}
                  value={bulkForm.days}
                  onChange={(e) =>
                    setBulkForm((f) => ({ ...f, days: e.target.value }))
                  }
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-700">Start Time</label>
                <input
                  type="time"
                  value={bulkForm.startTime}
                  onChange={(e) =>
                    setBulkForm((f) => ({ ...f, startTime: e.target.value }))
                  }
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
              <div>
                <label className="text-sm text-slate-700">End Time</label>
                <input
                  type="time"
                  value={bulkForm.endTime}
                  onChange={(e) =>
                    setBulkForm((f) => ({ ...f, endTime: e.target.value }))
                  }
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-slate-700">Slots / Day</label>
                <input
                  type="number"
                  min={1}
                  value={bulkForm.slotsPerDay}
                  onChange={(e) =>
                    setBulkForm((f) => ({ ...f, slotsPerDay: e.target.value }))
                  }
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
              <div>
                <label className="text-sm text-slate-700">Capacity</label>
                <input
                  type="number"
                  min={1}
                  value={bulkForm.capacity}
                  onChange={(e) =>
                    setBulkForm((f) => ({ ...f, capacity: e.target.value }))
                  }
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
              <div>
                <label className="text-sm text-slate-700">Notes</label>
                <input
                  type="text"
                  value={bulkForm.notes}
                  onChange={(e) =>
                    setBulkForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
            </div>
            {bulkMessage && (
              <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-2">
                {bulkMessage}
              </div>
            )}
            {error && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-2">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={bulkMutation.isLoading}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2.5 rounded-lg"
            >
              {bulkMutation.isLoading
                ? "Generating..."
                : "Generate Weekday Slots"}
            </button>
            <p className="text-xs text-slate-500">
              Creates evenly spaced slots between start/end on weekdays only.
              Existing exact slots won't be duplicated.
            </p>
          </div>
        </form>

        {/* Slots list */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Upcoming Slots</h2>
          {isLoading ? (
            <p className="text-slate-600 text-sm">Loading...</p>
          ) : slots.length === 0 ? (
            <p className="text-slate-600 text-sm">No slots yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left py-2 px-3 text-slate-700">Date</th>
                    <th className="text-left py-2 px-3 text-slate-700">Time</th>
                    <th className="text-left py-2 px-3 text-slate-700">
                      Capacity
                    </th>
                    <th className="text-left py-2 px-3 text-slate-700">
                      Booked
                    </th>
                    <th className="text-left py-2 px-3 text-slate-700">
                      Status
                    </th>
                    <th className="text-left py-2 px-3 text-slate-700">
                      Notes
                    </th>
                    <th className="text-left py-2 px-3 text-slate-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {slots.map((s) => (
                    <tr key={s.id}>
                      <td className="py-2 px-3">
                        {new Date(s.slot_date).toLocaleDateString()}
                      </td>
                      <td className="py-2 px-3">
                        {s.start_time?.slice(0, 5)} - {s.end_time?.slice(0, 5)}
                      </td>
                      <td className="py-2 px-3">{s.capacity}</td>
                      <td className="py-2 px-3">
                        {Number(s.booked_count) || 0}
                      </td>
                      <td className="py-2 px-3 capitalize">{s.status}</td>
                      <td className="py-2 px-3">{s.notes || ""}</td>
                      <td className="py-2 px-3 text-right">
                        <button
                          onClick={() => deleteMutation.mutate(s.id)}
                          className="text-sm text-red-600 hover:text-red-700"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
