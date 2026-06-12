"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Mail,
  Loader2,
  Pencil,
} from "lucide-react";
import ProspectEditDrawer from "@/components/admin/prospects/ProspectEditDrawer";

const ROLE_OPTIONS = [
  { value: "real_estate_agent", label: "Real Estate Agent" },
  { value: "property_manager", label: "Property Manager" },
  { value: "hoa_manager", label: "HOA Manager" },
  { value: "condo_board", label: "Condo Board" },
  { value: "facilities_manager", label: "Facilities Manager" },
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

export default function ProspectDetailPage({ params }) {
  const id = params?.id;
  const [showEdit, setShowEdit] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["cold-email-prospect", id],
    queryFn: async () => {
      const [prospectRes, sendsRes] = await Promise.all([
        fetch(`/api/marketing/cold-email/prospects?prospect_id=${id}`),
        fetch(`/api/marketing/cold-email/send?prospect_id=${id}`),
      ]);
      const prospectData = await prospectRes.json().catch(() => ({}));
      const sendsData = await sendsRes.json().catch(() => ({}));
      if (!prospectRes.ok) throw new Error(prospectData.error || "Failed to load prospect");
      return {
        prospect: prospectData.prospects?.[0] || null,
        sends: sendsData.sends || [],
      };
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error || !data?.prospect) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 mb-4">{error?.message || "Prospect not found"}</p>
          <a href="/admin/prospects" className="text-amber-600 hover:underline">← Back to prospects</a>
        </div>
      </div>
    );
  }

  const { prospect, sends } = data;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <a
                href="/admin/prospects"
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={18} />
              </a>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{prospect.name || "Unnamed Prospect"}</h1>
                <p className="text-sm text-slate-600 mt-0.5">{prospect.company || prospect.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(prospect.status)}`}>
                {prospect.status || "new"}
              </span>
              <button
                onClick={() => setShowEdit(true)}
                className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm flex items-center gap-2"
              >
                <Pencil size={14} /> Edit
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg border border-slate-200 p-5">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Contact</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Email</span>
                <span className="text-slate-900 font-medium">{prospect.email || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Company</span>
                <span className="text-slate-900 font-medium">{prospect.company || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">City</span>
                <span className="text-slate-900 font-medium">{prospect.city || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Source</span>
                <span className="text-slate-900 font-medium">{prospect.source || "—"}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-5">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Pipeline</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Role</span>
                <span className="text-slate-900 font-medium">{getRoleLabel(prospect.role)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Sequence Step</span>
                <span className="text-slate-900 font-medium">{prospect.sequence_step ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Last Emailed</span>
                <span className="text-slate-900 font-medium">
                  {prospect.last_emailed_at
                    ? new Date(prospect.last_emailed_at).toLocaleDateString()
                    : "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Created</span>
                <span className="text-slate-900 font-medium">
                  {prospect.created_at
                    ? new Date(prospect.created_at).toLocaleDateString()
                    : "—"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        {prospect.notes && (
          <div className="bg-white rounded-lg border border-slate-200 p-5">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Notes</h3>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{prospect.notes}</p>
          </div>
        )}

        {/* Send History */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Send History</h3>
            <span className="text-xs text-slate-500">{sends.length} email{sends.length !== 1 ? "s" : ""}</span>
          </div>
          {sends.length === 0 ? (
            <div className="p-8 text-center">
              <Mail className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No emails sent yet.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left py-3 px-5 font-semibold text-slate-700">Date</th>
                  <th className="text-left py-3 px-5 font-semibold text-slate-700">Step</th>
                  <th className="text-left py-3 px-5 font-semibold text-slate-700 hidden md:table-cell">Subject</th>
                  <th className="text-left py-3 px-5 font-semibold text-slate-700">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sends.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="py-3 px-5 text-slate-500 text-xs whitespace-nowrap">
                      {new Date(s.sent_at).toLocaleDateString()} {new Date(s.sent_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="py-3 px-5 text-slate-700">{s.sequence_step}</td>
                    <td className="py-3 px-5 hidden md:table-cell text-slate-700 max-w-xs truncate">
                      {s.subject || "—"}
                    </td>
                    <td className="py-3 px-5">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(s.status)}`}>
                        {s.status || "sent"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showEdit && (
        <ProspectEditDrawer
          prospect={prospect}
          onClose={() => setShowEdit(false)}
        />
      )}
    </div>
  );
}