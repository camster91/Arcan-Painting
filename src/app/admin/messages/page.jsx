"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  RefreshCw,
  Mail,
  CheckCircle2,
  CheckSquare,
  Square,
  Filter,
} from "lucide-react";

export default function AdminMessagesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selected, setSelected] = useState({}); // id:boolean
  const allSelectedIds = useMemo(
    () => Object.keys(selected).filter((k) => selected[k]),
    [selected],
  );
  const toggleAll = (items) => {
    const next = {};
    const shouldSelectAll = items.some((n) => !selected[n.id]);
    items.forEach((n) => {
      next[n.id] = shouldSelectAll;
    });
    setSelected(next);
  };

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["notifications", { search, status, startDate, endDate }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (status !== "all") params.set("status", status);
      if (startDate) params.set("start", startDate);
      if (endDate) params.set("end", endDate);
      const res = await fetch(`/api/notifications?${params.toString()}`);
      if (!res.ok) {
        throw new Error(
          `When fetching /api/notifications, the response was [${res.status}] ${res.statusText}`,
        );
      }
      return res.json();
    },
  });

  const notifications = data?.notifications || [];

  const markRead = useMutation({
    mutationFn: async (id) => {
      const res = await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_read: true }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(j?.error || "Failed to mark as read");
      }
      return j;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markSelectedRead = useMutation({
    mutationFn: async (ids) => {
      await Promise.all(
        ids.map(async (id) => {
          const res = await fetch("/api/notifications", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, is_read: true }),
          });
          if (!res.ok) {
            const j = await res.json().catch(() => ({}));
            throw new Error(j?.error || `Failed on id ${id}`);
          }
        }),
      );
    },
    onSuccess: () => {
      setSelected({});
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-50 rounded-lg">
                <Mail className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Messages</h1>
                <p className="text-sm text-slate-600 mt-1">
                  Client emails and notifications
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {allSelectedIds.length > 0 && (
                <button
                  onClick={() => markSelectedRead.mutate(allSelectedIds)}
                  className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium"
                >
                  Mark {allSelectedIds.length} Read
                </button>
              )}
              <button
                onClick={() => refetch()}
                disabled={isFetching}
                className="px-3 py-2 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2"
              >
                <RefreshCw
                  size={16}
                  className={isFetching ? "animate-spin" : ""}
                />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col gap-3">
          <div className="flex flex-col md:flex-row gap-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search subject, client, message..."
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
            <div className="flex gap-2">
              {[
                { label: "All", value: "all" },
                { label: "Unread", value: "unread" },
                { label: "Read", value: "read" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setStatus(opt.value)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    status === opt.value
                      ? "bg-amber-100 text-amber-800 border border-amber-200"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-transparent"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          {/* Date range */}
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-slate-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
            <span className="text-slate-500 text-sm">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>
        </div>
      </div>

      {/* List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-slate-600">Loading…</div>
          ) : error ? (
            <div className="p-8 text-center text-red-700">{error.message}</div>
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center text-slate-600">
              No messages found
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 text-sm bg-slate-50">
                <button
                  onClick={() => toggleAll(notifications)}
                  className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900"
                >
                  <CheckSquare size={14} /> Select all
                </button>
                {allSelectedIds.length > 0 && (
                  <button
                    onClick={() => markSelectedRead.mutate(allSelectedIds)}
                    className="inline-flex items-center gap-2 text-green-700 hover:text-green-900"
                  >
                    <CheckCircle2 size={14} /> Mark selected read
                  </button>
                )}
              </div>
              <ul className="divide-y divide-slate-200">
                {notifications.map((n) => (
                  <li key={n.id} className="p-4 flex items-start gap-3">
                    <div className="pt-1">
                      <input
                        type="checkbox"
                        checked={!!selected[n.id]}
                        onChange={(e) =>
                          setSelected((s) => ({
                            ...s,
                            [n.id]: e.target.checked,
                          }))
                        }
                        className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                        aria-label="Select message"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-3">
                        <div className="truncate">
                          <div className="text-sm text-slate-500 truncate">
                            {n.to_email || n.recipient || "Client"}
                          </div>
                          <div
                            className={`font-medium truncate ${n.read ? "text-slate-700" : "text-slate-900"}`}
                          >
                            {n.subject || n.title || "Message"}
                          </div>
                        </div>
                        <div className="text-xs text-slate-500 whitespace-nowrap">
                          {n.sent_at || n.created_at
                            ? new Date(
                                n.sent_at || n.created_at,
                              ).toLocaleString()
                            : ""}
                        </div>
                      </div>
                      {n.message || n.preview ? (
                        <div className="mt-1 text-sm text-slate-600 line-clamp-2">
                          {n.message || n.preview}
                        </div>
                      ) : null}
                      <div className="mt-2 text-xs text-slate-500">
                        {n.status
                          ? n.status.toUpperCase()
                          : n.read
                            ? "READ"
                            : "UNREAD"}
                      </div>
                    </div>
                    {!n.read && (
                      <button
                        onClick={() => markRead.mutate(n.id)}
                        className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium"
                      >
                        Mark Read
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
