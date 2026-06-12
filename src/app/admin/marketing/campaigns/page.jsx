"use client";

import { useState, useEffect } from "react";
import {
  Megaphone,
  Plus,
  Pause,
  Play,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  RefreshCw,
  ExternalLink,
} from "lucide-react";

function CampaignSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
          <div className="flex justify-between">
            <div className="space-y-2">
              <div className="h-4 bg-slate-200 rounded w-40"></div>
              <div className="h-3 bg-slate-200 rounded w-24"></div>
            </div>
            <div className="h-6 bg-slate-200 rounded w-20"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ status }) {
  const normalized = (status || "").toLowerCase();
  if (normalized === "active" || normalized === "enabled") {
    return (
      <span className="flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-1 rounded-full">
        <CheckCircle2 className="w-3 h-3" />
        Active
      </span>
    );
  }
  if (normalized === "paused" || normalized === "paused") {
    return (
      <span className="flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded-full">
        <Pause className="w-3 h-3" />
        Paused
      </span>
    );
  }
  if (normalized === "completed" || normalized === "completed") {
    return (
      <span className="flex items-center gap-1 text-xs text-gray-700 bg-gray-100 px-2 py-1 rounded-full">
        Completed
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
      {status || "Unknown"}
    </span>
  );
}

export default function CampaignsPage() {
  const [marketingCampaigns, setMarketingCampaigns] = useState([]);
  const [liveCampaigns, setLiveCampaigns] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, paused: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    platform: "facebook",
    daily_budget: "",
    total_budget: "",
    start_date: "",
    end_date: "",
  });

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/marketing/campaigns");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setMarketingCampaigns(data.marketing_campaigns || []);
      setLiveCampaigns(data.live_campaigns || []);
      setStats(data.stats || { total: 0, active: 0, paused: 0, completed: 0 });
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast("Campaign name is required", "error");
      return;
    }
    try {
      setSubmitting(true);
      const res = await fetch("/api/marketing/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          daily_budget: formData.daily_budget ? parseFloat(formData.daily_budget) : null,
          total_budget: formData.total_budget ? parseFloat(formData.total_budget) : null,
        }),
      });
      if (res.ok) {
        showToast("Campaign created successfully", "success");
        setShowForm(false);
        setFormData({ name: "", platform: "facebook", daily_budget: "", total_budget: "", start_date: "", end_date: "" });
        fetchCampaigns();
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to create campaign", "error");
      }
    } catch {
      showToast("Failed to create campaign", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (id, currentStatus, platform) => {
    const newStatus = currentStatus === "active" || currentStatus === "ENABLED" ? "paused" : "active";
    try {
      const res = await fetch("/api/marketing/campaigns", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus, platform }),
      });
      if (res.ok) {
        showToast(`Campaign ${newStatus === "active" ? "activated" : "paused"}`, "success");
        fetchCampaigns();
      }
    } catch {
      showToast("Failed to update campaign", "error");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
            toast.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600" />
          )}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <a href="/admin/marketing" className="text-gray-400 hover:text-gray-600">
                <ArrowLeft className="w-5 h-5" />
              </a>
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <Megaphone className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Campaigns</h1>
                <p className="text-sm text-gray-500">
                  {stats.total > 0
                    ? `${stats.active} active · ${stats.paused} paused`
                    : "Manage your ad campaigns"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchCampaigns}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </button>
              <button
                onClick={() => setShowForm(!showForm)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Campaign
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Total", value: stats.total, color: "text-gray-900" },
            { label: "Active", value: stats.active, color: "text-green-600" },
            { label: "Paused", value: stats.paused, color: "text-amber-600" },
            { label: "Completed", value: stats.completed, color: "text-gray-500" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4">
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* New Campaign Form */}
        {showForm && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Create New Campaign</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Campaign Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Spring Paint Specials 2025"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Platform</label>
                  <select
                    value={formData.platform}
                    onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="facebook">Facebook / Meta</option>
                    <option value="google">Google Ads</option>
                    <option value="linkedin">LinkedIn</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Daily Budget ($)</label>
                  <input
                    type="number"
                    value={formData.daily_budget}
                    onChange={(e) => setFormData({ ...formData, daily_budget: e.target.value })}
                    placeholder="25.00"
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Total Budget ($)</label>
                  <input
                    type="number"
                    value={formData.total_budget}
                    onChange={(e) => setFormData({ ...formData, total_budget: e.target.value })}
                    placeholder="500.00"
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg disabled:opacity-50 transition-colors"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {submitting ? "Creating..." : "Create Campaign"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-white rounded-xl border border-red-200 p-6 text-center">
            <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <p className="text-gray-600 mb-4">Failed to load campaigns</p>
            <button
              onClick={fetchCampaigns}
              className="px-4 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && !error && <CampaignSkeleton />}

        {/* Empty State */}
        {!loading && !error && stats.total === 0 && (
          <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
            <Megaphone className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No campaigns yet</h3>
            <p className="text-sm text-gray-500 mb-6">
              Create your first campaign to start running ads on Facebook, Google, or LinkedIn.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Campaign
            </button>
          </div>
        )}

        {/* Live Campaigns */}
        {!loading && !error && liveCampaigns.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">
                Live Campaigns {liveCampaigns.length > 0 && <span className="text-gray-400 font-normal">({liveCampaigns.length})</span>}
              </h2>
            </div>
            <div className="divide-y divide-gray-100">
              {liveCampaigns.map((campaign) => (
                <div key={campaign.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{campaign.campaign_name}</p>
                    <p className="text-xs text-gray-500">
                      {campaign.platform?.replace("_", " ") || "Unknown"} ·{" "}
                      {campaign.daily_budget ? `$${parseFloat(campaign.daily_budget).toFixed(2)}/day` : "No budget set"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={campaign.status} />
                    <button
                      onClick={() => toggleStatus(campaign.id, campaign.status, campaign.platform)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        campaign.status === "active" || campaign.status === "ENABLED"
                          ? "text-amber-600 hover:bg-amber-50"
                          : "text-green-600 hover:bg-green-50"
                      }`}
                    >
                      {campaign.status === "active" || campaign.status === "ENABLED" ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Marketing Campaigns */}
        {!loading && !error && marketingCampaigns.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">
                Marketing Campaigns {marketingCampaigns.length > 0 && <span className="text-gray-400 font-normal">({marketingCampaigns.length})</span>}
              </h2>
            </div>
            <div className="divide-y divide-gray-100">
              {marketingCampaigns.map((campaign) => (
                <div key={campaign.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{campaign.name}</p>
                    <p className="text-xs text-gray-500">
                      {campaign.platform} ·{" "}
                      {campaign.daily_budget ? `$${parseFloat(campaign.daily_budget).toFixed(2)}/day` : "No budget"}
                      {campaign.start_date && ` · Started ${campaign.start_date}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={campaign.status} />
                    <button
                      onClick={() => toggleStatus(campaign.id, campaign.status, campaign.platform)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        campaign.status === "active" || campaign.status === "ENABLED"
                          ? "text-amber-600 hover:bg-amber-50"
                          : "text-green-600 hover:bg-green-50"
                      }`}
                    >
                      {campaign.status === "active" || campaign.status === "ENABLED" ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}