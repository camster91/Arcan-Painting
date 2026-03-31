"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Mail,
  Users,
  FileText,
  Send,
  Plus,
  RefreshCw,
  Search,
  Filter,
  History,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  Loader2,
  ArrowLeft,
  Settings,
  MoreVertical,
  Download,
  Upload,
  AlertCircle,
  X,
  Eye,
  Edit2,
  Trash2,
} from "lucide-react";

export default function EmailOutreachPage() {
  const [activeTab, setActiveTab] = useState("prospects"); // prospects, templates, history, automation
  const [loading, setLoading] = useState(true);
  const [prospects, setProspects] = useState([]);
  const [stats, setStats] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [history, setHistory] = useState([]);
  const [dailyStats, setDailyStats] = useState([]);
  const [toast, setToast] = useState(null);

  // Filters & Search
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("new");

  // Modals
  const [showFindModal, setShowFindModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(null); // template object
  const [showPreviewModal, setShowPreviewModal] = useState(null); // prospect object

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === "prospects") {
        const res = await fetch(
          `/api/marketing/cold-email/prospects?status=${statusFilter}${
            roleFilter !== "all" ? `&role=${roleFilter}` : ""
          }`
        );
        const data = await res.json();
        setProspects(data.prospects || []);
        setStats(data.stats);
      } else if (activeTab === "templates") {
        const res = await fetch("/api/marketing/cold-email/templates");
        const data = await res.json();
        setTemplates(data.templates || []);
      } else if (activeTab === "history") {
        const res = await fetch("/api/marketing/cold-email/send");
        const data = await res.json();
        setHistory(data.sends || []);
        setDailyStats(data.dailyStats || []);
      }
    } catch (err) {
      showToast("Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  }, [activeTab, statusFilter, roleFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSendBatch = async () => {
    if (!confirm("Send today's batch of cold emails? (Max 20/day)")) return;
    try {
      const res = await fetch("/api/marketing/cold-email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: 20 }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Successfully sent ${data.sent} emails!`);
        fetchData();
      } else {
        showToast(data.error || "Failed to send emails", "error");
      }
    } catch {
      showToast("Failed to send emails", "error");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-2">
          <div
            className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
              toast.type === "error"
                ? "bg-red-50 text-red-800 border border-red-200"
                : "bg-green-50 text-green-800 border border-green-200"
            }`}
          >
            {toast.type === "error" ? (
              <AlertCircle className="w-4 h-4" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            {toast.message}
            <button onClick={() => setToast(null)} className="ml-2 opacity-60 hover:opacity-100">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <a href="/admin/marketing" className="text-gray-400 hover:text-gray-600">
                <ArrowLeft className="w-5 h-5" />
              </a>
              <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center shadow-sm">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">Cold Email Outreach</h1>
                <p className="text-sm text-gray-500">Automated sequence manager</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSendBatch}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-all shadow-sm active:scale-95"
              >
                <Send className="w-4 h-4" />
                Run Today's Batch
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-6 mt-6 border-b border-gray-100 -mb-4">
            {[
              { id: "prospects", label: "Prospects", icon: Users },
              { id: "templates", label: "Templates", icon: FileText },
              { id: "history", label: "Send History", icon: History },
              { id: "automation", label: "Automation", icon: Settings },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 pb-3 text-sm font-medium transition-colors relative ${
                  activeTab === tab.id ? "text-purple-600" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {activeTab === "prospects" && (
          <div className="space-y-6">
            {/* Stats Overview */}
            {stats && (
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                  { label: "Total", value: stats.total, color: "bg-gray-50 text-gray-700" },
                  { label: "New", value: stats.new_count, color: "bg-blue-50 text-blue-700" },
                  { label: "Emailed", value: stats.emailed_count, color: "bg-purple-50 text-purple-700" },
                  { label: "Replied", value: stats.replied_count, color: "bg-green-50 text-green-700" },
                  { label: "Converted", value: stats.converted_count, color: "bg-amber-50 text-amber-700" },
                ].map((s) => (
                  <div key={s.label} className={`rounded-xl p-4 border border-transparent hover:border-gray-200 transition-all ${s.color}`}>
                    <p className="text-xs font-medium opacity-70 uppercase tracking-wider mb-1">{s.label}</p>
                    <p className="text-2xl font-bold">{s.value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Filters & Search */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search prospects..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 pr-4 py-2 bg-gray-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-purple-500 w-full md:w-64"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-gray-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">All Status</option>
                  <option value="new">New</option>
                  <option value="emailed">Emailed</option>
                  <option value="replied">Replied</option>
                  <option value="converted">Converted</option>
                  <option value="bounced">Bounced</option>
                  <option value="unsubscribed">Unsubscribed</option>
                </select>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="bg-gray-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">All Roles</option>
                  <option value="real_estate_agent">RE Agents</option>
                  <option value="property_manager">Property Mgrs</option>
                  <option value="hoa_manager">HOA Managers</option>
                  <option value="facilities_manager">Facilities Mgrs</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowManualModal(true)}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Manual
                </button>
                <button
                  onClick={() => setShowFindModal(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
                >
                  <Search className="w-4 h-4" />
                  Find Local Prospects
                </button>
              </div>
            </div>

            {/* Prospects Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100">
                      <th className="px-6 py-4 font-semibold text-gray-900">Name / Company</th>
                      <th className="px-6 py-4 font-semibold text-gray-900">Contact</th>
                      <th className="px-6 py-4 font-semibold text-gray-900">Role & City</th>
                      <th className="px-6 py-4 font-semibold text-gray-900">Status</th>
                      <th className="px-6 py-4 font-semibold text-gray-900">Last Action</th>
                      <th className="px-6 py-4 font-semibold text-gray-900 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {loading ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-12 text-center">
                          <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto" />
                          <p className="text-gray-500 mt-2">Loading prospects...</p>
                        </td>
                      </tr>
                    ) : prospects.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-12 text-center">
                          <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                          <p className="text-gray-500">No prospects found matching filters.</p>
                          <button
                            onClick={() => setShowFindModal(true)}
                            className="text-purple-600 font-medium mt-1 hover:underline"
                          >
                            Find some new prospects
                          </button>
                        </td>
                      </tr>
                    ) : (
                      prospects
                        .filter((p) =>
                          `${p.name} ${p.company} ${p.email}`
                            .toLowerCase()
                            .includes(search.toLowerCase())
                        )
                        .map((p) => (
                          <tr key={p.id} className="hover:bg-gray-50/50 transition-colors group">
                            <td className="px-6 py-4">
                              <p className="font-semibold text-gray-900">{p.name || "Unknown"}</p>
                              <p className="text-xs text-gray-500">{p.company || "No company"}</p>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-gray-700">{p.email || "No email"}</p>
                              <p className="text-xs text-gray-400 capitalize">{p.source?.replace(/_/g, " ")}</p>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-gray-700 capitalize">{p.role?.replace(/_/g, " ")}</p>
                              <p className="text-xs text-gray-500">{p.city}</p>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                                  p.status === "emailed"
                                    ? "bg-purple-50 text-purple-700"
                                    : p.status === "replied"
                                    ? "bg-green-50 text-green-700"
                                    : p.status === "converted"
                                    ? "bg-amber-50 text-amber-700"
                                    : p.status === "bounced"
                                    ? "bg-red-50 text-red-700"
                                    : "bg-gray-100 text-gray-600"
                                }`}
                              >
                                <div
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    p.status === "emailed"
                                      ? "bg-purple-500"
                                      : p.status === "replied"
                                      ? "bg-green-500"
                                      : p.status === "converted"
                                      ? "bg-amber-500"
                                      : "bg-gray-400"
                                  }`}
                                />
                                {p.status}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              {p.last_emailed_at ? (
                                <div className="flex flex-col">
                                  <span className="text-gray-700">Step {p.sequence_step}</span>
                                  <span className="text-xs text-gray-400">
                                    {new Date(p.last_emailed_at).toLocaleDateString()}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-gray-400">Never contacted</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => setShowPreviewModal(p)}
                                  className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                                  title="Preview & Send"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                                  title="Edit"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                  title="Archive"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  Showing {prospects.length} prospects
                </p>
                <div className="flex items-center gap-2">
                  <button className="px-3 py-1 text-xs font-medium text-gray-500 bg-white border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50">
                    Previous
                  </button>
                  <button className="px-3 py-1 text-xs font-medium text-gray-500 bg-white border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50">
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "templates" && (
          <div className="space-y-6">
             <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Email Sequence Templates</h2>
              <button 
                onClick={() => setShowTemplateModal({ name: "", target_role: "real_estate_agent", sequence_step: 1, subject_template: "", body_template: "", is_active: true })}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Template
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((t) => (
                <div key={t.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col hover:border-purple-300 transition-all group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="bg-purple-50 text-purple-700 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
                      Step {t.sequence_step}
                    </div>
                    <button 
                      onClick={() => setShowTemplateModal(t)}
                      className="text-gray-400 hover:text-purple-600 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">{t.name}</h3>
                  <p className="text-xs text-gray-500 mb-4 capitalize">Target: {t.target_role?.replace(/_/g, " ")}</p>
                  
                  <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 mb-4 line-clamp-4 flex-grow">
                    <p className="font-semibold mb-1">Subject: {t.subject_template}</p>
                    <p className="whitespace-pre-wrap">{t.body_template}</p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${t.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {t.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <button className="text-[10px] text-gray-400 hover:text-red-600 font-medium">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <div className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {dailyStats.slice(0, 4).map((stat) => (
                <div key={stat.date} className="bg-white rounded-xl border border-gray-200 p-4">
                  <p className="text-xs text-gray-500 mb-1">{new Date(stat.date).toLocaleDateString()}</p>
                  <div className="flex items-end justify-between">
                    <p className="text-2xl font-bold text-gray-900">{stat.sent}</p>
                    <div className="flex items-center text-[10px] gap-2">
                      <span className="text-green-600 font-medium">100% Success</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
               <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100">
                      <th className="px-6 py-4 font-semibold text-gray-900">Prospect</th>
                      <th className="px-6 py-4 font-semibold text-gray-900">Subject</th>
                      <th className="px-6 py-4 font-semibold text-gray-900">Step</th>
                      <th className="px-6 py-4 font-semibold text-gray-900">Time</th>
                      <th className="px-6 py-4 font-semibold text-gray-900">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {history.map((h) => (
                      <tr key={h.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-gray-900">{h.prospect_name}</p>
                          <p className="text-xs text-gray-500">{h.prospect_email}</p>
                        </td>
                        <td className="px-6 py-4 max-w-md truncate">
                          {h.subject}
                        </td>
                        <td className="px-6 py-4">Step {h.sequence_step}</td>
                        <td className="px-6 py-4 text-gray-500">
                          {new Date(h.sent_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 text-green-600 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Sent
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "automation" && (
          <div className="max-w-2xl bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center mx-auto my-12">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Settings className="w-8 h-8 text-purple-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Outreach Automation</h2>
            <p className="text-gray-500 mb-8">
              Configure automated triggers to find and email prospects weekly. 
              Currently, automation is handled via the system cron job.
            </p>
            <div className="space-y-4 text-left border-t border-gray-100 pt-8">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-bold text-gray-900">Daily Sending Window</p>
                  <p className="text-xs text-gray-500">08:00 AM - 05:00 PM (EST)</p>
                </div>
                <div className="w-10 h-5 bg-purple-600 rounded-full relative cursor-pointer">
                  <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full shadow-sm" />
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-bold text-gray-900">Auto-Follow-Up</p>
                  <p className="text-xs text-gray-500">Wait 4 days between emails</p>
                </div>
                <div className="w-10 h-5 bg-purple-600 rounded-full relative cursor-pointer">
                  <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full shadow-sm" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Find Prospects Modal */}
      {showFindModal && (
        <FindProspectsModal 
          onClose={() => setShowFindModal(false)} 
          onSuccess={(msg) => {
            showToast(msg);
            fetchData();
          }}
        />
      )}

      {/* Manual Prospect Modal */}
      {showManualModal && (
        <ManualProspectModal
          onClose={() => setShowManualModal(false)}
          onSuccess={() => {
            showToast("Prospect added");
            fetchData();
          }}
        />
      )}

      {/* Template Modal */}
      {showTemplateModal && (
        <TemplateModal
          template={showTemplateModal}
          onClose={() => setShowTemplateModal(null)}
          onSuccess={() => {
            showToast("Template saved");
            fetchData();
          }}
        />
      )}
    </div>
  );
}

function FindProspectsModal({ onClose, onSuccess }) {
  const [role, setRole] = useState("real_estate_agent");
  const [city, setCity] = useState("Ottawa");
  const [loading, setLoading] = useState(false);

  const handleFind = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/marketing/cold-email/prospects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "find", role, city, count: 20 }),
      });
      const data = await res.json();
      if (res.ok) {
        onSuccess(data.message);
        onClose();
      } else {
        alert(data.error || "Search failed");
      }
    } catch {
      alert("Search failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900">Find Local Prospects</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleFind} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Target Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 transition-all outline-none"
            >
              <option value="real_estate_agent">Real Estate Agents</option>
              <option value="property_manager">Property Managers</option>
              <option value="hoa_manager">HOA / Condo Managers</option>
              <option value="facilities_manager">Facilities Managers</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">City / Region</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 transition-all outline-none"
              placeholder="e.g. Ottawa, ON"
              required
            />
          </div>
          <p className="text-xs text-gray-400 bg-gray-50 p-3 rounded-lg border border-gray-100 leading-relaxed">
            AI will scan Google Maps and business directories for matching companies in {city}. Note: Emails may require manual research if not publicly listed.
          </p>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 disabled:opacity-50 transition-all shadow-md active:scale-[0.98]"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Start Search"}
          </button>
        </form>
      </div>
    </div>
  );
}

function ManualProspectModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({ name: "", email: "", company: "", role: "other", city: "Ottawa" });
  const [loading, setLoading] = useState(false);

  const handleAdd = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/marketing/cold-email/prospects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add_manual", ...form }),
      });
      if (res.ok) {
        onSuccess();
        onClose();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900">Add Prospect Manually</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleAdd} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Full Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                required
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Email Address</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Company</label>
              <input
                type="text"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">City</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 disabled:opacity-50 transition-all shadow-md active:scale-[0.98]"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Save Prospect"}
          </button>
        </form>
      </div>
    </div>
  );
}

function TemplateModal({ template, onClose, onSuccess }) {
  const [form, setForm] = useState(template);
  const [loading, setLoading] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/marketing/cold-email/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        onSuccess();
        onClose();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900">{form.id ? 'Edit Template' : 'Create Template'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Template Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Target Role</label>
              <select
                value={form.target_role}
                onChange={(e) => setForm({ ...form, target_role: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="real_estate_agent">Real Estate Agent</option>
                <option value="property_manager">Property Manager</option>
                <option value="hoa_manager">HOA Manager</option>
                <option value="facilities_manager">Facilities Manager</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Sequence Step</label>
              <input
                type="number"
                min="1"
                value={form.sequence_step}
                onChange={(e) => setForm({ ...form, sequence_step: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Subject Line</label>
            <input
              type="text"
              value={form.subject_template}
              onChange={(e) => setForm({ ...form, subject_template: e.target.value })}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Use {{name}}, {{city}}, {{company}} as variables"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Email Body</label>
            <textarea
              value={form.body_template}
              onChange={(e) => setForm({ ...form, body_template: e.target.value })}
              rows={8}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500 font-sans"
              placeholder="Use {{name}}, {{city}}, {{company}} as variables"
              required
            />
          </div>
          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              id="is_active"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className="rounded text-purple-600 focus:ring-purple-500" 
            />
            <label htmlFor="is_active" className="text-sm text-gray-700">Template is active and ready to send</label>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 disabled:opacity-50 transition-all shadow-md active:scale-[0.98]"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Save Template"}
          </button>
        </form>
      </div>
    </div>
  );
}
