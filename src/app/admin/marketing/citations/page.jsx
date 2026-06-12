"use client";

import { useState, useEffect } from "react";
import {
  MapPin,
  ArrowLeft,
  Plus,
  RefreshCw,
  Loader2,
  CheckCircle,
  AlertCircle,
  Globe,
  Info,
  Check,
} from "lucide-react";

const STATUS_COLORS = {
  listed: "bg-green-50 text-green-700",
  claimed: "bg-green-50 text-green-700",
  needs_update: "bg-amber-50 text-amber-700",
  not_listed: "bg-red-50 text-red-700",
  pending: "bg-gray-50 text-gray-700",
  submitted: "bg-blue-50 text-blue-700",
  approved: "bg-green-50 text-green-700",
  live: "bg-green-50 text-green-700",
};

function StatusBadge({ status }) {
  const normalized = (status || "pending").toLowerCase().replace(/\s+/g, "_");
  const colorClass = STATUS_COLORS[normalized] || "bg-gray-50 text-gray-700";
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
      {["listed", "claimed", "approved", "live"].includes(normalized) ? (
        <CheckCircle className="w-3 h-3" />
      ) : ["needs_update", "not_listed"].includes(normalized) ? (
        <AlertCircle className="w-3 h-3" />
      ) : null}
      {status || "pending"}
    </span>
  );
}

export default function CitationsPage() {
  const [directories, setDirectories] = useState([]);
  const [stats, setStats] = useState({ total: 0, listed: 0, needsUpdate: 0, notListed: 0, completionRate: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    fetchCitations();
  }, []);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchCitations = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/marketing/citations");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setDirectories(data.directories || []);
      setStats(data.stats || { total: 0, listed: 0, needsUpdate: 0, notListed: 0, completionRate: 0 });
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (directoryId, status) => {
    try {
      setUpdatingId(directoryId);
      const res = await fetch("/api/marketing/citations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_status",
          directoryId,
          status,
        }),
      });
      if (res.ok) {
        showToast(`Status updated to ${status}`, "success");
        fetchCitations();
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to update", "error");
      }
    } catch {
      showToast("Failed to update status", "error");
    } finally {
      setUpdatingId(null);
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
            <CheckCircle className="w-4 h-4 text-green-600" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600" />
          )}
          {toast.message}
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
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                <MapPin className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Local Citations</h1>
                <p className="text-sm text-gray-500">
                  {stats.total > 0
                    ? `${stats.completionRate}% complete · ${stats.listed} of ${stats.total} listed`
                    : "Business directory listings & NAP consistency"}
                </p>
              </div>
            </div>
            <button
              onClick={fetchCitations}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Stats */}
        {stats.total > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Globe className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-xs text-gray-500">Total Directories</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-xs text-gray-500">Listed / Claimed</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{stats.listed}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                </div>
                <span className="text-xs text-gray-500">Needs Update</span>
              </div>
              <p className="text-2xl font-bold text-amber-600">{stats.needsUpdate}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-red-600" />
                </div>
                <span className="text-xs text-gray-500">Not Listed</span>
              </div>
              <p className="text-2xl font-bold text-red-600">{stats.notListed}</p>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-red-500 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900">Local SEO Citations</h3>
              <p className="text-sm text-red-700 mt-1">
                Track and manage your business listings across Google Business Profile, Yelp, HomeStars,
                and other directories. Consistent NAP (Name, Address, Phone) across all listings improves
                your local search ranking.
              </p>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && !loading && (
          <div className="bg-white rounded-xl border border-red-200 p-8 text-center">
            <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={fetchCitations}
              className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && !error && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-red-500 mx-auto" />
            <p className="text-sm text-gray-500 mt-3">Loading citations...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && stats.total === 0 && (
          <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No citations tracked yet</h3>
            <p className="text-sm text-gray-500 mb-6">
              Add your business directory listings to monitor NAP consistency and track submission status.
            </p>
            <button
              onClick={fetchCitations}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh to load directories
            </button>
          </div>
        )}

        {/* Listings Table */}
        {!loading && !error && directories.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">
                Directory Listings
                <span className="text-gray-400 font-normal ml-2">({directories.length})</span>
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">Directory</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">Category</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">Domain Authority</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">Status</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">Listing URL</th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {directories.map((dir) => (
                    <tr key={dir.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3">
                        <p className="font-medium text-gray-900">{dir.name}</p>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-xs text-gray-500 capitalize">{dir.category || "General"}</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-xs text-gray-500">{dir.domain_authority || "—"}</span>
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={dir.listing_status} />
                      </td>
                      <td className="px-5 py-3 max-w-xs">
                        {dir.listing_url ? (
                          <a
                            href={dir.listing_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:text-blue-700 truncate block max-w-xs"
                          >
                            {dir.listing_url.length > 40 ? dir.listing_url.substring(0, 40) + "..." : dir.listing_url}
                          </a>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => updateStatus(dir.id, "submitted")}
                            disabled={updatingId === dir.id || ["submitted", "approved", "live", "listed", "claimed"].includes(dir.listing_status)}
                            className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-50 transition-colors"
                          >
                            {updatingId === dir.id ? "..." : "Mark Submitted"}
                          </button>
                          <button
                            onClick={() => updateStatus(dir.id, "approved")}
                            disabled={updatingId === dir.id || ["approved", "live", "listed", "claimed"].includes(dir.listing_status)}
                            className="px-2 py-1 text-xs text-green-600 hover:bg-green-50 rounded-lg disabled:opacity-50 transition-colors"
                          >
                            {updatingId === dir.id ? "..." : "Mark Approved"}
                          </button>
                          <button
                            onClick={() => updateStatus(dir.id, "needs_update")}
                            disabled={updatingId === dir.id}
                            className="px-2 py-1 text-xs text-amber-600 hover:bg-amber-50 rounded-lg disabled:opacity-50 transition-colors"
                          >
                            Needs Update
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}