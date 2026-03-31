"use client";

import { useState, useEffect } from "react";
import {
  RefreshCw,
  Loader2,
  Play,
  Pause,
  Trash2,
  Plus,
  ArrowLeft,
  Eye,
  DollarSign,
  BarChart3,
  MousePointerClick,
  AlertCircle,
  CheckCircle2,
  X,
  Search,
} from "lucide-react";

export default function GoogleAdsPage() {
  const [connected, setConnected] = useState(null); // null = loading
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [actionLoading, setActionLoading] = useState(null); // campaign id
  const [showNewForm, setShowNewForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState(null);

  // New campaign form
  const [form, setForm] = useState({
    campaign_name: "",
    daily_budget: "20",
    headline: "Professional Painting Services",
    primary_text: "Transform your home with Arcan Painting. Free estimates!",
    description: "Licensed & insured painters in Ottawa",
    target_url: "https://arcanpainting.ca",
  });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Check connection + load campaigns
  useEffect(() => {
    (async () => {
      try {
        const connRes = await fetch("/api/marketing/connections");
        if (connRes.ok) {
          const data = await connRes.json();
          const ga = (data.connections || []).find((c) => c.platform === "google");
          if (ga) {
            setConnected(true);
            await loadCampaigns();
          } else {
            setConnected(false);
          }
        } else {
          setConnected(false);
        }
      } catch {
        setConnected(false);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const loadCampaigns = async (sync = false) => {
    try {
      if (sync) setSyncing(true);
      const url = sync ? "/api/marketing/google-ads/campaigns?sync=true" : "/api/marketing/google-ads/campaigns";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.campaigns || []);
        if (sync && data.synced) showToast("Synced stats from Google Ads");
      } else {
        const data = await res.json();
        if (data.code === "NO_CUSTOMER") {
          setConnected("setup_required");
        } else {
          showToast(data.error || "Failed to load campaigns", "error");
        }
      }
    } catch (err) {
      showToast("Failed to load campaigns", "error");
    } finally {
      setSyncing(false);
    }
  };

  const handleAction = async (id, action) => {
    setActionLoading(id);
    try {
      const res = await fetch("/api/marketing/google-ads/campaigns", {
        method: action === "delete" ? "DELETE" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action === "delete" ? { id } : { id, action }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(
          action === "delete"
            ? "Campaign deleted"
            : `Campaign ${action === "pause" ? "paused" : "activated"}`
        );
        await loadCampaigns();
      } else {
        showToast(data.error || "Action failed", "error");
      }
    } catch {
      showToast("Action failed", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.campaign_name.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/marketing/google-ads/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaign_name: form.campaign_name,
          daily_budget: parseFloat(form.daily_budget) || 20,
          headline: form.headline,
          primary_text: form.primary_text,
          description: form.description,
          target_url: form.target_url,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast("Campaign created (paused). Activate it when ready.");
        setShowNewForm(false);
        setForm({
          campaign_name: "",
          daily_budget: "20",
          headline: "Professional Painting Services",
          primary_text: "Transform your home with Arcan Painting. Free estimates!",
          description: "Licensed & insured painters in Ottawa",
          target_url: "https://arcanpainting.ca",
        });
        await loadCampaigns();
      } else {
        showToast(data.error || "Failed to create campaign", "error");
      }
    } catch {
      showToast("Failed to create campaign", "error");
    } finally {
      setCreating(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // STATE 1.5: Connected but setup required
  if (connected === "setup_required") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Search className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Account Setup</h1>
          <p className="text-gray-500 mb-8">
            Your Google account is connected, but we need your Google Ads Customer ID to continue.
          </p>
          <div className="space-y-4">
            <div className="text-left">
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer ID (XXX-XXX-XXXX)</label>
              <input
                type="text"
                id="customer_id"
                placeholder="123-456-7890"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <button
              onClick={async () => {
                const id = document.getElementById("customer_id").value.trim();
                if (!id) return;
                try {
                  const res = await fetch("/api/marketing/connections", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      platform: "google",
                      metadata: { ads_customer_id: id }
                    })
                  });
                  if (res.ok) {
                    setConnected(true);
                    await loadCampaigns();
                  }
                } catch {}
              }}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
            >
              Save & Continue
            </button>
          </div>
          <a
            href="/admin/marketing"
            className="block mt-4 text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 inline mr-1" />
            Back to Marketing
          </a>
        </div>
      </div>
    );
  }

  // STATE 2: Connected — campaign management
  const totalSpend = campaigns.reduce((sum, c) => sum + (parseFloat(c.spent || 0)), 0);
  const totalBudget = campaigns.reduce((sum, c) => sum + (parseFloat(c.daily_budget || 0)), 0);
  const totalImpressions = campaigns.reduce((sum, c) => sum + (parseInt(c.impressions) || 0), 0);
  const totalClicks = campaigns.reduce((sum, c) => sum + (parseInt(c.clicks) || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
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
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <a href="/admin/marketing" className="text-gray-400 hover:text-gray-600">
                <ArrowLeft className="w-5 h-5" />
              </a>
              <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                <Search className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Google Ads</h1>
                <p className="text-sm text-gray-500">Search & display campaign management</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => loadCampaigns(true)}
                disabled={syncing}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
                {syncing ? "Syncing..." : "Sync from Google"}
              </button>
              <button
                onClick={() => setShowNewForm(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600"
              >
                <Plus className="w-4 h-4" />
                New Campaign
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: "Active Campaigns", value: activeCampaigns, icon: Play, color: "text-green-600 bg-green-50" },
            { label: "Daily Budget", value: `$${totalBudget.toFixed(0)}`, icon: DollarSign, color: "text-blue-600 bg-blue-50" },
            { label: "Total Spent", value: `$${totalSpend.toFixed(2)}`, icon: DollarSign, color: "text-red-600 bg-red-50" },
            { label: "Impressions", value: totalImpressions.toLocaleString(), icon: Eye, color: "text-purple-600 bg-purple-50" },
            { label: "Clicks", value: totalClicks.toLocaleString(), icon: MousePointerClick, color: "text-orange-600 bg-orange-50" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="w-4 h-4" />
                </div>
                <span className="text-xs text-gray-500">{stat.label}</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* New Campaign Form */}
        {showNewForm && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">New Campaign</h2>
              <button onClick={() => setShowNewForm(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name *</label>
                  <input
                    type="text"
                    value={form.campaign_name}
                    onChange={(e) => setForm({ ...form, campaign_name: e.target.value })}
                    placeholder="e.g. Spring Interior Painting"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Daily Budget ($)</label>
                  <input
                    type="number"
                    value={form.daily_budget}
                    onChange={(e) => setForm({ ...form, daily_budget: e.target.value })}
                    min="1"
                    step="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Headline</label>
                  <input
                    type="text"
                    value={form.headline}
                    onChange={(e) => setForm({ ...form, headline: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target URL</label>
                  <input
                    type="url"
                    value={form.target_url}
                    onChange={(e) => setForm({ ...form, target_url: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Primary Text</label>
                <textarea
                  value={form.primary_text}
                  onChange={(e) => setForm({ ...form, primary_text: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={creating}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 disabled:opacity-50"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {creating ? "Creating..." : "Create Campaign"}
                </button>
                <p className="text-xs text-gray-400">Campaign will be created in PAUSED state</p>
              </div>
            </form>
          </div>
        )}

        {/* Campaigns Table */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">
              Campaigns {campaigns.length > 0 && <span className="text-gray-400 font-normal">({campaigns.length})</span>}
            </h2>
          </div>

          {campaigns.length === 0 ? (
            <div className="py-16 text-center">
              <BarChart3 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No campaigns yet</p>
              <button
                onClick={() => setShowNewForm(true)}
                className="mt-3 text-sm text-blue-500 hover:text-blue-600 font-medium"
              >
                Create your first campaign
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-5 py-3 font-medium text-gray-500">Campaign</th>
                    <th className="px-5 py-3 font-medium text-gray-500">Status</th>
                    <th className="px-5 py-3 font-medium text-gray-500 text-right">Budget/day</th>
                    <th className="px-5 py-3 font-medium text-gray-500 text-right">Spent</th>
                    <th className="px-5 py-3 font-medium text-gray-500 text-right">Impressions</th>
                    <th className="px-5 py-3 font-medium text-gray-500 text-right">Clicks</th>
                    <th className="px-5 py-3 font-medium text-gray-500 text-right">Conversions</th>
                    <th className="px-5 py-3 font-medium text-gray-500 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {campaigns.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3">
                        <p className="font-medium text-gray-900">{c.campaign_name}</p>
                        {c.headline && <p className="text-xs text-gray-400 mt-0.5">{c.headline}</p>}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            c.status === "active"
                              ? "bg-green-50 text-green-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {c.status === "active" ? (
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                          ) : (
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                          )}
                          {c.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right text-gray-700">
                        ${parseFloat(c.daily_budget || 0).toFixed(0)}
                      </td>
                      <td className="px-5 py-3 text-right text-gray-700">
                        ${parseFloat(c.spent || 0).toFixed(2)}
                      </td>
                      <td className="px-5 py-3 text-right text-gray-700">
                        {(parseInt(c.impressions) || 0).toLocaleString()}
                      </td>
                      <td className="px-5 py-3 text-right text-gray-700">
                        {(parseInt(c.clicks) || 0).toLocaleString()}
                      </td>
                      <td className="px-5 py-3 text-right text-gray-700">
                        {parseInt(c.conversions) || 0}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-center gap-1">
                          {c.status === "active" ? (
                            <button
                              onClick={() => handleAction(c.id, "pause")}
                              disabled={actionLoading === c.id}
                              title="Pause"
                              className="p-1.5 rounded-lg text-gray-400 hover:text-orange-600 hover:bg-orange-50 disabled:opacity-50"
                            >
                              {actionLoading === c.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Pause className="w-4 h-4" />
                              )}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleAction(c.id, "activate")}
                              disabled={actionLoading === c.id}
                              title="Activate"
                              className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 disabled:opacity-50"
                            >
                              {actionLoading === c.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Play className="w-4 h-4" />
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => {
                              if (confirm("Delete this campaign? This will also remove it from Google Ads.")) {
                                handleAction(c.id, "delete");
                              }
                            }}
                            disabled={actionLoading === c.id}
                            title="Delete"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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
    </div>
  );
}
