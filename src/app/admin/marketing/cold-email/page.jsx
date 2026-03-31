"use client";

import { useState, useEffect } from "react";
import {
  Mail,
  Search,
  Plus,
  Send,
  Users,
  Filter,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";

const ROLE_OPTIONS = [
  { value: "real_estate_agent", label: "Real Estate Agent" },
  { value: "property_manager", label: "Property Manager" },
  { value: "hoa_manager", label: "HOA Manager" },
  { value: "facilities_manager", label: "Facilities Manager" },
];

export default function ColdEmailPage() {
  const [prospects, setProspects] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [finding, setFinding] = useState(false);
  const [toast, setToast] = useState(null);

  // Filters
  const [filterRole, setFilterRole] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Find prospects form
  const [findRole, setFindRole] = useState("real_estate_agent");
  const [findCity, setFindCity] = useState("Toronto");
  const [findCount, setFindCount] = useState(20);
  const [showFindForm, setShowFindForm] = useState(false);

  // Manual add form
  const [showAddForm, setShowAddForm] = useState(false);
  const [manualForm, setManualForm] = useState({
    name: "",
    email: "",
    company: "",
    role: "real_estate_agent",
    city: "Toronto",
  });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const fetchProspects = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStatus) params.set("status", filterStatus);
      if (filterRole) params.set("role", filterRole);
      const res = await fetch(`/api/marketing/cold-email/prospects?${params}`);
      if (res.ok) {
        const data = await res.json();
        setProspects(data.prospects || []);
        setStats(data.stats || null);
      }
    } catch (e) {
      console.error("Error fetching prospects:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProspects();
  }, [filterRole, filterStatus]);

  const handleFindProspects = async () => {
    try {
      setFinding(true);
      const res = await fetch("/api/marketing/cold-email/prospects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "find",
          role: findRole,
          city: findCity,
          count: findCount,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || `Found ${data.added} prospects`);
        fetchProspects();
        setShowFindForm(false);
      } else {
        showToast(data.error || "Failed to find prospects", "error");
      }
    } catch (e) {
      showToast("Network error", "error");
    } finally {
      setFinding(false);
    }
  };

  const handleAddManual = async () => {
    if (!manualForm.email) {
      showToast("Email is required", "error");
      return;
    }
    try {
      const res = await fetch("/api/marketing/cold-email/prospects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add_manual", ...manualForm }),
      });
      if (res.ok) {
        showToast("Prospect added");
        fetchProspects();
        setShowAddForm(false);
        setManualForm({ name: "", email: "", company: "", role: "real_estate_agent", city: "Toronto" });
      } else {
        const data = await res.json();
        showToast(data.error || "Failed to add prospect", "error");
      }
    } catch {
      showToast("Network error", "error");
    }
  };

  const handleSendEmails = async (preview = false) => {
    try {
      setSending(true);
      const res = await fetch("/api/marketing/cold-email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preview }),
      });
      const data = await res.json();
      if (res.ok) {
        if (preview) {
          showToast(`Preview: ${data.would_send} emails would be sent (${data.already_sent_today} sent today)`);
        } else {
          showToast(`Sent ${data.sent} emails (${data.failed} failed)`);
          fetchProspects();
        }
      } else {
        showToast(data.error || "Failed to send", "error");
      }
    } catch {
      showToast("Network error", "error");
    } finally {
      setSending(false);
    }
  };

  const getRoleLabel = (role) => ROLE_OPTIONS.find((r) => r.value === role)?.label || role;

  const getStatusColor = (status) => {
    const colors = {
      new: "bg-blue-100 text-blue-700",
      emailed: "bg-yellow-100 text-yellow-700",
      replied: "bg-green-100 text-green-700",
      converted: "bg-purple-100 text-purple-700",
      bounced: "bg-red-100 text-red-700",
      unsubscribed: "bg-gray-100 text-gray-500",
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
          toast.type === "success"
            ? "bg-green-50 text-green-800 border border-green-200"
            : "bg-red-50 text-red-800 border border-red-200"
        }`}>
          {toast.type === "success" ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
          {toast.message}
          <button onClick={() => setToast(null)} className="ml-2 text-gray-400 hover:text-gray-600">&times;</button>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/admin/marketing" className="text-gray-400 hover:text-gray-600">
              <ArrowLeft className="w-5 h-5" />
            </a>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Mail className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Cold Email Outreach</h1>
              <p className="text-sm text-gray-500">Find prospects, manage sequences, send emails</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSendEmails(true)}
              disabled={sending}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Preview Send
            </button>
            <button
              onClick={() => handleSendEmails(false)}
              disabled={sending}
              className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors disabled:opacity-50"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Send Emails
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: "Total", value: stats.total, color: "text-gray-900" },
              { label: "New", value: stats.new_count, color: "text-blue-600" },
              { label: "Emailed", value: stats.emailed_count, color: "text-yellow-600" },
              { label: "Replied", value: stats.replied_count, color: "text-green-600" },
              { label: "Converted", value: stats.converted_count, color: "text-purple-600" },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Actions + Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => { setShowFindForm(!showFindForm); setShowAddForm(false); }}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Search className="w-4 h-4" /> Find Prospects
          </button>
          <button
            onClick={() => { setShowAddForm(!showAddForm); setShowFindForm(false); }}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Plus className="w-4 h-4" /> Add Manually
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-2 py-1.5"
            >
              <option value="">All Roles</option>
              {ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-2 py-1.5"
            >
              <option value="all">All Statuses</option>
              <option value="new">New</option>
              <option value="emailed">Emailed</option>
              <option value="replied">Replied</option>
              <option value="converted">Converted</option>
              <option value="bounced">Bounced</option>
            </select>
            <button onClick={fetchProspects} className="p-1.5 text-gray-400 hover:text-gray-600">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Find Prospects Form */}
        {showFindForm && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Find Prospects via Google Places</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Role</label>
                <select
                  value={findRole}
                  onChange={(e) => setFindRole(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">City</label>
                <input
                  type="text"
                  value={findCity}
                  onChange={(e) => setFindCity(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Max Results</label>
                <input
                  type="number"
                  value={findCount}
                  onChange={(e) => setFindCount(parseInt(e.target.value) || 20)}
                  min={1}
                  max={50}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
            </div>
            <button
              onClick={handleFindProspects}
              disabled={finding}
              className="mt-4 flex items-center gap-2 px-4 py-2 text-sm text-white bg-orange-500 hover:bg-orange-600 rounded-lg disabled:opacity-50"
            >
              {finding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Find Prospects
            </button>
          </div>
        )}

        {/* Manual Add Form */}
        {showAddForm && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Add Prospect Manually</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Name</label>
                <input
                  type="text"
                  value={manualForm.name}
                  onChange={(e) => setManualForm({ ...manualForm, name: e.target.value })}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Email *</label>
                <input
                  type="email"
                  value={manualForm.email}
                  onChange={(e) => setManualForm({ ...manualForm, email: e.target.value })}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Company</label>
                <input
                  type="text"
                  value={manualForm.company}
                  onChange={(e) => setManualForm({ ...manualForm, company: e.target.value })}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Role</label>
                <select
                  value={manualForm.role}
                  onChange={(e) => setManualForm({ ...manualForm, role: e.target.value })}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">City</label>
                <input
                  type="text"
                  value={manualForm.city}
                  onChange={(e) => setManualForm({ ...manualForm, city: e.target.value })}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
            </div>
            <button
              onClick={handleAddManual}
              className="mt-4 flex items-center gap-2 px-4 py-2 text-sm text-white bg-orange-500 hover:bg-orange-600 rounded-lg"
            >
              <Plus className="w-4 h-4" /> Add Prospect
            </button>
          </div>
        )}

        {/* Prospects Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : prospects.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No prospects found. Use Find Prospects or Add Manually to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Name</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Email</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Company</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Role</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">City</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Step</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {prospects.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{p.name || "—"}</td>
                      <td className="px-4 py-3 text-gray-600">{p.email || "—"}</td>
                      <td className="px-4 py-3 text-gray-600">{p.company || "—"}</td>
                      <td className="px-4 py-3 text-gray-600">{getRoleLabel(p.role)}</td>
                      <td className="px-4 py-3 text-gray-600">{p.city || "—"}</td>
                      <td className="px-4 py-3 text-gray-600">{p.sequence_step}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(p.status)}`}>
                          {p.status}
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
