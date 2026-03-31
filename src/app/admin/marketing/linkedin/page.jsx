"use client";

import { useState, useEffect } from "react";
import {
  Linkedin,
  ArrowLeft,
  Plus,
  Users,
  Building2,
  Send,
  Info,
  ExternalLink,
  MessageSquare,
  CheckCircle2,
  MoreVertical,
  X,
  Edit2,
  Trash2,
  Loader2,
  Filter,
} from "lucide-react";

export default function LinkedInOutreachPage() {
  const [prospects, setProspects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(null); // prospect object

  const fetchProspects = async () => {
    setLoading(true);
    try {
      const url = statusFilter === "all" ? "/api/marketing/linkedin" : `/api/marketing/linkedin?status=${statusFilter}`;
      const res = await fetch(url);
      const data = await res.json();
      setProspects(data.prospects || []);
    } catch {
      alert("Failed to load LinkedIn prospects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProspects();
  }, [statusFilter]);

  const handleUpdateStatus = async (id, status) => {
    try {
      const res = await fetch("/api/marketing/linkedin", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) fetchProspects();
    } catch {
      alert("Update failed");
    }
  };

  const handleAddProspect = async (form) => {
    try {
      const res = await fetch("/api/marketing/linkedin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setShowAddModal(false);
        fetchProspects();
      }
    } catch {
      alert("Failed to add prospect");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/admin/marketing" className="text-gray-400 hover:text-gray-600">
              <ArrowLeft className="w-5 h-5" />
            </a>
            <div className="w-10 h-10 bg-[#0077b5] rounded-xl flex items-center justify-center">
              <Linkedin className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">LinkedIn Outreach</h1>
              <p className="text-sm text-gray-500">B2B Networking & Leads</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#0077b5] text-white rounded-lg text-sm font-medium hover:bg-[#00669c] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Lead
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Info */}
        <div className="bg-white border border-blue-100 rounded-xl p-5 flex items-start gap-4 shadow-sm">
          <div className="bg-blue-50 p-2 rounded-lg">
            <Info className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">How to use LinkedIn Outreach</h3>
            <p className="text-sm text-gray-600 mt-1 leading-relaxed">
              LinkedIn doesn't allow direct API access for personal message automation without costly enterprise tiers. 
              Use this tracker to manage your target B2B leads, draft personalized messages, and track your outreach progress.
              Click the LinkedIn icon to open their profile directly.
            </p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {[
            { id: "all", label: "All Leads", count: prospects.length },
            { id: "draft", label: "Ready to Contact", count: prospects.filter(p => p.status === 'draft').length },
            { id: "sent", label: "Contacted", count: prospects.filter(p => p.status === 'sent').length },
            { id: "connected", label: "Connected", count: prospects.filter(p => p.status === 'connected').length },
            { id: "converted", label: "Converted", count: prospects.filter(p => p.status === 'converted').length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                statusFilter === tab.id
                  ? "bg-gray-900 text-white shadow-md shadow-gray-200"
                  : "bg-white text-gray-500 border border-gray-200 hover:border-gray-300"
              }`}
            >
              {tab.label}
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                statusFilter === tab.id ? "bg-gray-700 text-gray-200" : "bg-gray-100 text-gray-500"
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="py-20 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
            <p className="text-gray-500 mt-2">Loading B2B leads...</p>
          </div>
        ) : prospects.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-20 text-center shadow-sm">
            <Building2 className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900">No LinkedIn prospects yet</h3>
            <p className="text-gray-500 mt-1">Start by adding your first B2B target lead.</p>
            <button 
              onClick={() => setShowAddModal(true)}
              className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 bg-[#0077b5] text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all"
            >
              <Plus className="w-5 h-5" />
              Add First Lead
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {prospects.map((p) => (
              <div key={p.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col hover:border-blue-300 transition-all group relative overflow-hidden">
                {p.status === 'converted' && (
                  <div className="absolute top-0 right-0 p-1.5 bg-green-500 text-white rounded-bl-xl shadow-sm z-10">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                )}
                
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center border border-blue-100 group-hover:scale-110 transition-transform">
                      <Linkedin className="w-6 h-6 text-[#0077b5]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 group-hover:text-[#0077b5] transition-colors">{p.prospect_name}</h3>
                      <p className="text-xs text-gray-500 line-clamp-1">{p.prospect_title || "Lead"} at {p.prospect_company || "N/A"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <a 
                      href={p.prospect_linkedin_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 text-gray-400 hover:text-[#0077b5] hover:bg-blue-50 rounded-lg transition-all"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex-grow space-y-3">
                   <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Target Segment</p>
                    <p className="text-xs text-gray-700 font-medium capitalize">{p.target_role?.replace(/_/g, " ")}</p>
                  </div>
                  {p.notes && (
                    <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-100/50">
                      <p className="text-[10px] font-bold text-amber-500/70 uppercase tracking-widest mb-1">Notes</p>
                      <p className="text-xs text-gray-600 italic line-clamp-2">{p.notes}</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-6 pt-4 border-t border-gray-100">
                  {p.status === 'draft' ? (
                    <button 
                      onClick={() => handleUpdateStatus(p.id, 'sent')}
                      className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 shadow-sm transition-all active:scale-[0.98]"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Mark Contacted
                    </button>
                  ) : p.status === 'sent' ? (
                    <button 
                      onClick={() => handleUpdateStatus(p.id, 'connected')}
                      className="flex-1 flex items-center justify-center gap-2 py-2 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-700 shadow-sm transition-all active:scale-[0.98]"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Connected!
                    </button>
                  ) : (
                    <div className="flex-1 text-center py-2 bg-gray-50 text-gray-500 rounded-xl text-xs font-bold capitalize">
                      {p.status}
                    </div>
                  )}
                  <button 
                    onClick={() => setShowDraftModal(p)}
                    className="p-2 bg-white border border-gray-200 text-gray-500 rounded-xl hover:border-blue-500 hover:text-blue-600 transition-all shadow-sm active:scale-[0.98]"
                    title="View Message Drafts"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Lead Modal */}
      {showAddModal && (
        <AddLeadModal 
          onClose={() => setShowAddModal(false)} 
          onSave={handleAddProspect} 
        />
      )}

      {/* Drafts Modal */}
      {showDraftModal && (
        <DraftsModal 
          prospect={showDraftModal} 
          onClose={() => setShowDraftModal(null)} 
        />
      )}
    </div>
  );
}

function AddLeadModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    prospect_name: "",
    prospect_title: "",
    prospect_company: "",
    prospect_linkedin_url: "",
    target_role: "property_manager",
    notes: "",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-blue-50/50">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <Linkedin className="w-4 h-4 text-[#0077b5]" />
            Add LinkedIn B2B Lead
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form 
          onSubmit={(e) => { e.preventDefault(); onSave(form); }} 
          className="p-6 space-y-4"
        >
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Full Name</label>
            <input
              type="text"
              value={form.prospect_name}
              onChange={(e) => setForm({ ...form, prospect_name: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Title</label>
              <input
                type="text"
                value={form.prospect_title}
                onChange={(e) => setForm({ ...form, prospect_title: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                placeholder="e.g. Senior PM"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Company</label>
              <input
                type="text"
                value={form.prospect_company}
                onChange={(e) => setForm({ ...form, prospect_company: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                placeholder="e.g. Skyline Corp"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">LinkedIn Profile URL</label>
            <input
              type="url"
              value={form.prospect_linkedin_url}
              onChange={(e) => setForm({ ...form, prospect_linkedin_url: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none"
              placeholder="https://linkedin.com/in/..."
              required
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Target Segment</label>
            <select
              value={form.target_role}
              onChange={(e) => setForm({ ...form, target_role: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none"
            >
              <option value="property_manager">Property Manager</option>
              <option value="hoa_manager">HOA / Condo Board</option>
              <option value="facilities_manager">Facilities Manager</option>
              <option value="real_estate_agent">Real Estate Agent</option>
              <option value="commercial_landlord">Commercial Landlord</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full py-3.5 bg-[#0077b5] text-white rounded-xl font-bold hover:bg-[#00669c] transition-all shadow-md active:scale-[0.98]"
          >
            Save Lead
          </button>
        </form>
      </div>
    </div>
  );
}

function DraftsModal({ prospect, onClose }) {
  const [activeDraft, setActiveDraft] = useState("connection");

  const connectionDraft = `Hi ${prospect.prospect_name.split(' ')[0]}, I noticed you manage properties with ${prospect.prospect_company || 'your firm'} in the Ottawa area. I run Arcan Painting — we specialize in high-quality unit turnovers and commercial maintenance. Would love to connect and be a resource for any upcoming painting needs!`;

  const followUpDraft = `Hi ${prospect.prospect_name.split(' ')[0]}, thanks for connecting! Just wanted to share that we offer free 24-hour estimates for property managers and landlords. We're fully insured and focus on making turnovers as stress-free as possible. Let me know if I can provide a quote for any current projects!`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900">Message Drafts for {prospect.prospect_name}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-xl mb-6">
            <button 
              onClick={() => setActiveDraft("connection")}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                activeDraft === "connection" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Connection Request
            </button>
            <button 
              onClick={() => setActiveDraft("followup")}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                activeDraft === "followup" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Follow-up Note
            </button>
          </div>

          <div className="relative">
             <textarea 
              readOnly 
              value={activeDraft === "connection" ? connectionDraft : followUpDraft}
              className="w-full p-4 bg-blue-50/30 border border-blue-100 rounded-2xl text-sm text-gray-700 font-sans leading-relaxed h-48 focus:ring-0 outline-none resize-none"
            />
            <button 
              onClick={() => {
                navigator.clipboard.writeText(activeDraft === "connection" ? connectionDraft : followUpDraft);
                alert("Copied to clipboard!");
              }}
              className="absolute bottom-4 right-4 px-3 py-1.5 bg-white border border-blue-200 text-blue-600 rounded-lg text-[10px] font-bold hover:bg-blue-50 transition-all shadow-sm"
            >
              Copy Message
            </button>
          </div>

          <div className="mt-6 flex flex-col gap-2">
            <a 
              href={prospect.prospect_linkedin_url} 
              target="_blank" 
              className="flex items-center justify-center gap-2 py-3 bg-[#0077b5] text-white rounded-xl text-sm font-bold hover:bg-[#00669c] transition-all"
            >
              <Linkedin className="w-4 h-4" />
              Open LinkedIn Profile to Paste
            </a>
            <p className="text-[10px] text-center text-gray-400">
              Personalized for {prospect.target_role?.replace(/_/g, " ")} role
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
