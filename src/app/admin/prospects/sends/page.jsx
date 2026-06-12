"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Mail, RefreshCw, Loader2, Search } from "lucide-react";

const ROLE_OPTIONS = [
  { value: "real_estate_agent", label: "Real Estate Agent" },
  { value: "property_manager", label: "Property Manager" },
  { value: "hoa_manager", label: "HOA Manager" },
  { value: "condo_board", label: "Condo Board" },
  { value: "facilities_manager", label: "Facilities Manager" },
];

function getRoleLabel(role) {
  return ROLE_OPTIONS.find((r) => r.value === role)?.label || role || "—";
}

function getStatusColor(status) {
  const colors = {
    sent: "bg-green-100 text-green-700 border-green-200",
    delivered: "bg-blue-100 text-blue-700 border-blue-200",
    opened: "bg-indigo-100 text-indigo-700 border-indigo-200",
    clicked: "bg-purple-100 text-purple-700 border-purple-200",
    bounced: "bg-red-100 text-red-700 border-red-200",
    failed: "bg-red-100 text-red-700 border-red-200",
  };
  return colors[status] || "bg-gray-100 text-gray-700 border-gray-200";
}

export default function SendsPage() {
  const [search, setSearch] = useState("");
  const [days, setDays] = useState("30");

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["cold-email-sends", days],
    queryFn: async () => {
      const res = await fetch(`/api/marketing/cold-email/send?days=${days}`);
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Failed to load send history");
      return j;
    },
  });

  const sends = data?.sends || [];
  const dailyStats = data?.dailyStats || [];

  const filtered = sends.filter((s) => {
    if (!search) return true;
    const s2 = search.toLowerCase();
    return (
      (s.prospect_name || "").toLowerCase().includes(s2) ||
      (s.prospect_email || "").toLowerCase().includes(s2) ||
      (s.subject || "").toLowerCase().includes(s2)
    );
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Mail className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Send Log</h1>
                <p className="text-sm text-slate-600 mt-0.5">
                  {filtered.length} emails sent in the last {days} days
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={days}
                onChange={(e) => setDays(e.target.value)}
                className="text-sm border border-slate-300 rounded-lg px-3 py-2"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
              </select>
              <button
                onClick={() => refetch()}
                disabled={isFetching}
                className="px-3 py-2 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2 text-sm"
              >
                <RefreshCw size={14} className={isFetching ? "animate-spin" : ""} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Stats */}
      {dailyStats.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-white rounded-lg border border-slate-200 p-4 overflow-x-auto">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Daily Breakdown</h3>
            <div className="flex gap-4">
              {dailyStats.slice(0, 14).map((d) => (
                <div key={d.date} className="flex flex-col items-center min-w-[60px]">
                  <span className="text-xs text-slate-500">{new Date(d.date).toLocaleDateString("en", { month: "short", day: "numeric" })}</span>
                  <span className="text-lg font-bold text-slate-900">{d.total}</span>
                  <div className="flex gap-1 text-xs">
                    {d.sent > 0 && <span className="text-green-600">{d.sent}S</span>}
                    {d.opened > 0 && <span className="text-indigo-600">{d.opened}O</span>}
                    {d.bounced > 0 && <span className="text-red-600">{d.bounced}B</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by prospect name, email, or subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm">{error.message}</p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-medium text-slate-900 mb-1">No emails sent yet</h3>
              <p className="text-slate-500 text-sm">Send emails to prospects and they will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700 hidden sm:table-cell">Prospect</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700 hidden lg:table-cell">Role</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Subject</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Step</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 text-slate-500 text-xs whitespace-nowrap">
                        {new Date(s.sent_at).toLocaleDateString()}
                        <span className="ml-1 text-slate-400">
                          {new Date(s.sent_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </td>
                      <td className="py-3 px-4 hidden sm:table-cell">
                        <div className="font-medium text-slate-900">{s.prospect_name || "—"}</div>
                        <div className="text-xs text-slate-500">{s.prospect_email || "—"}</div>
                      </td>
                      <td className="py-3 px-4 hidden lg:table-cell text-slate-700 text-xs">
                        {getRoleLabel(s.role)}
                      </td>
                      <td className="py-3 px-4 text-slate-700 max-w-xs truncate">
                        {s.subject || "—"}
                      </td>
                      <td className="py-3 px-4 text-slate-700">{s.sequence_step}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(s.status)}`}>
                          {s.status || "sent"}
                        </span>
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
