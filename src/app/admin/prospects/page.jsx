"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Mail,
  Search,
  Plus,
  RefreshCw,
  Users,
  Filter,
  Pencil,
  Send,
  ChevronRight,
  Loader2,
} from "lucide-react";
import ProspectEditDrawer from "@/components/admin/prospects/ProspectEditDrawer";

const ROLE_OPTIONS = [
  { value: "real_estate_agent", label: "Real Estate Agent" },
  { value: "property_manager", label: "Property Manager" },
  { value: "hoa_manager", label: "HOA Manager" },
  { value: "condo_board", label: "Condo Board" },
  { value: "facilities_manager", label: "Facilities Manager" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "new", label: "New" },
  { value: "emailed", label: "Emailed" },
  { value: "replied", label: "Replied" },
  { value: "converted", label: "Converted" },
  { value: "unsubscribed", label: "Unsubscribed" },
  { value: "bounced", label: "Bounced" },
];

function getStatusColor(status) {
  const colors = {
    new: "bg-blue-100 text-blue-700 border-blue-200",
    emailed: "bg-yellow-100 text-yellow-700 border-yellow-200",
    replied: "bg-green-100 text-green-700 border-green-200",
    converted: "bg-purple-100 text-purple-700 border-purple-200",
    bounced: "bg-red-100 text-red-700 border-red-200",
    unsubscribed: "bg-gray-100 text-gray-500 border-gray-200",
  };
  return colors[status] || "bg-gray-100 text-gray-700 border-gray-200";
}

function getRoleLabel(role) {
  return ROLE_OPTIONS.find((r) => r.value === role)?.label || role || "—";
}

export default function ProspectsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedProspect, setSelectedProspect] = useState(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["cold-email-prospects", roleFilter, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (roleFilter) params.set("role", roleFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetch(`/api/marketing/cold-email/prospects?${params}`);
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Failed to load prospects");
      return j;
    },
  });

  const sendNextMutation = useMutation({
    mutationFn: async (prospectId) => {
      const res = await fetch("/api/marketing/cold-email/send-next", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prospectId }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Failed to send");
      return j;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cold-email-prospects"] });
    },
  });

  const prospects = data?.prospects || [];
  const stats = data?.stats || {};

  const filtered = prospects.filter((p) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      (p.name || "").toLowerCase().includes(s) ||
      (p.email || "").toLowerCase().includes(s) ||
      (p.company || "").toLowerCase().includes(s)
    );
  });

  const handleEdit = (prospect) => {
    setSelectedProspect(prospect);
    setShowDrawer(true);
  };

  const handleAddNew = () => {
    setSelectedProspect(null);
    setShowDrawer(true);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Page Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Mail className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Cold Email Prospects</h1>
                <p className="text-sm text-slate-600 mt-0.5">
                  {filtered.length} of {prospects.length} prospects
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => refetch()}
                disabled={isFetching}
                className="px-3 py-2 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2"
              >
                <RefreshCw size={16} className={isFetching ? "animate-spin" : ""} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <a
                href="/admin/prospects/new"
                className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Plus size={16} />
                Add Prospect
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { label: "Total", value: stats.total, color: "text-slate-900" },
            { label: "New", value: stats.new_count, color: "text-blue-600" },
            { label: "Emailed", value: stats.emailed_count, color: "text-yellow-600" },
            { label: "Replied", value: stats.replied_count, color: "text-green-600" },
            { label: "Converted", value: stats.converted_count, color: "text-purple-600" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-lg border border-slate-200 p-3">
              <p className="text-xs text-slate-500">{s.label}</p>
              <p className={`text-xl font-bold ${s.color}`}>{s.value ?? 0}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="lg:hidden mb-3">
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 text-sm"
            >
              <Filter size={14} />
              Filters
            </button>
          </div>
          <div className="flex flex-col lg:flex-row gap-3">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, or company..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
            </div>
            {/* Filters */}
            <div className={`flex flex-wrap gap-2 ${showMobileFilters ? "flex" : "hidden lg:flex"}`}>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="text-sm border border-slate-300 rounded-lg px-3 py-2"
              >
                <option value="">All Roles</option>
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-sm border border-slate-300 rounded-lg px-3 py-2"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
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
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-medium text-slate-900 mb-1">No prospects found</h3>
              <p className="text-slate-500 text-sm mb-4">
                {search || roleFilter || statusFilter !== "all"
                  ? "Try adjusting your filters."
                  : "Add prospects to get started."}
              </p>
              <a
                href="/admin/prospects/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium"
              >
                <Plus size={14} /> Add First Prospect
              </a>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700 hidden md:table-cell">Company</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700 hidden lg:table-cell">Role</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700 hidden sm:table-cell">City</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Step</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700 hidden lg:table-cell">Last Emailed</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900">{p.name || "—"}</div>
                        <div className="text-xs text-slate-500">{p.email || "—"}</div>
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell text-slate-700">{p.company || "—"}</td>
                      <td className="py-3 px-4 hidden lg:table-cell text-slate-700">{getRoleLabel(p.role)}</td>
                      <td className="py-3 px-4 hidden sm:table-cell text-slate-700">{p.city || "—"}</td>
                      <td className="py-3 px-4 text-slate-700">{p.sequence_step ?? 0}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(p.status)}`}>
                          {p.status || "new"}
                        </span>
                      </td>
                      <td className="py-3 px-4 hidden lg:table-cell text-slate-500 text-xs">
                        {p.last_emailed_at
                          ? new Date(p.last_emailed_at).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleEdit(p)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg"
                            title="Edit"
                          >
                            <Pencil size={14} />
                          </button>
                          {p.status !== "converted" && p.status !== "bounced" && p.status !== "unsubscribed" && (
                            <button
                              onClick={() => sendNextMutation.mutate(p.id)}
                              disabled={sendNextMutation.isLoading}
                              className="p-1.5 text-slate-500 hover:text-green-600 hover:bg-green-50 rounded-lg disabled:opacity-50"
                              title="Send Next Email"
                            >
                              <Send size={14} />
                            </button>
                          )}
                          <a
                            href={`/admin/prospects/${p.id}`}
                            className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
                            title="View Details"
                          >
                            <ChevronRight size={14} />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Edit Drawer */}
      {showDrawer && (
        <ProspectEditDrawer
          prospect={selectedProspect}
          onClose={() => setShowDrawer(false)}
        />
      )}
    </div>
  );
}
