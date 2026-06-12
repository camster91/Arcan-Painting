"use client";

import { useState, useEffect } from "react";
import {
  Link2,
  Plus,
  Unplug,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Loader2,
  ExternalLink,
  ArrowLeft,
} from "lucide-react";

const PLATFORMS = [
  {
    id: "google",
    name: "Google",
    description: "Google Ads, Business Profile, Gmail",
    color: "bg-blue-500",
    icon: "G",
    connectUrl: "/api/marketing/google/connect",
  },
  {
    id: "facebook",
    name: "Facebook",
    description: "Facebook & Instagram Ads",
    color: "bg-indigo-500",
    icon: "F",
    connectUrl: "/api/marketing/facebook/connect",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    description: "LinkedIn outreach & ads",
    color: "bg-sky-700",
    icon: "in",
    connectUrl: null,
  },
];

function ConnectionSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-gray-200 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-slate-200 rounded-lg"></div>
            <div>
              <div className="h-4 bg-slate-200 rounded w-24 mb-2"></div>
              <div className="h-3 bg-slate-200 rounded w-40"></div>
            </div>
          </div>
          <div className="h-6 bg-slate-200 rounded w-20"></div>
        </div>
      ))}
    </div>
  );
}

export default function ConnectionsPage() {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    // Check URL params for connection feedback
    const params = new URLSearchParams(window.location.search);
    if (params.get("connected")) {
      showToast(`Successfully connected ${params.get("connected")}!`, "success");
      window.history.replaceState({}, "", "/admin/marketing/connections");
    }
    if (params.get("error")) {
      const errorMessages = {
        google_auth_failed: "Google authentication was cancelled or failed.",
        google_token_failed: "Failed to complete Google connection. Please try again.",
      };
      showToast(errorMessages[params.get("error")] || `Connection error`, "error");
      window.history.replaceState({}, "", "/admin/marketing/connections");
    }
    fetchConnections();
  }, []);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const fetchConnections = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/marketing/connections");
      if (res.ok) {
        const data = await res.json();
        setConnections(data.connections || []);
      }
    } catch (e) {
      showToast("Failed to load connections", "error");
    } finally {
      setLoading(false);
    }
  };

  const disconnectPlatform = async (platform) => {
    try {
      const res = await fetch("/api/marketing/connections", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform }),
      });
      if (res.ok) {
        showToast(`${platform.charAt(0).toUpperCase() + platform.slice(1)} disconnected`, "success");
        fetchConnections();
      } else {
        showToast("Failed to disconnect", "error");
      }
    } catch (e) {
      showToast("Failed to disconnect", "error");
    }
  };

  const getConnection = (platformId) =>
    connections.find((c) => c.platform === platformId && c.is_active);

  const activeCount = connections.filter((c) => c.is_active).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all ${
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
          <button onClick={() => setToast(null)} className="ml-2 text-gray-400 hover:text-gray-600">
            &times;
          </button>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <a
                href="/admin/marketing"
                className="text-gray-400 hover:text-gray-600"
              >
                <ArrowLeft className="w-5 h-5" />
              </a>
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Link2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Platform Connections</h1>
                <p className="text-sm text-gray-500">
                  {activeCount > 0
                    ? `${activeCount} of ${PLATFORMS.length} platforms connected`
                    : "Connect your marketing platforms"}
                </p>
              </div>
            </div>
            <button
              onClick={fetchConnections}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              </div>
              <span className="text-xs text-gray-500">Connected</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{activeCount}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <Link2 className="w-4 h-4 text-gray-600" />
              </div>
              <span className="text-xs text-gray-500">Available</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{PLATFORMS.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-4 h-4 text-orange-600" />
              </div>
              <span className="text-xs text-gray-500">Not Connected</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {PLATFORMS.length - activeCount}
            </p>
          </div>
        </div>

        {/* Connection Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            Marketing Platforms
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Connect your accounts to manage campaigns and track performance.
          </p>

          {loading ? (
            <ConnectionSkeleton />
          ) : (
            <div className="space-y-3">
              {PLATFORMS.map((platform) => {
                const conn = getConnection(platform.id);
                return (
                  <div
                    key={platform.id}
                    className="flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 ${platform.color} rounded-lg flex items-center justify-center text-white font-bold text-sm`}
                      >
                        {platform.icon}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {platform.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {conn
                            ? `Connected as ${conn.account_email || conn.account_name || "Unknown"}`
                            : platform.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {conn ? (
                        <>
                          <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                            <CheckCircle2 className="w-3 h-3" />
                            Connected
                          </span>
                          <button
                            onClick={() => disconnectPlatform(platform.id)}
                            className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded-full transition-colors"
                          >
                            <Unplug className="w-3 h-3" />
                            Disconnect
                          </button>
                        </>
                      ) : platform.connectUrl ? (
                        <a
                          href={platform.connectUrl}
                          className="flex items-center gap-1 text-xs text-white bg-orange-500 hover:bg-orange-600 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                          Connect
                        </a>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full">
                          <Loader2 className="w-3 h-3" />
                          Coming soon
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Help text */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-blue-800">
            <strong>Tip:</strong> Clicking "Connect" will redirect you to the platform's OAuth
            authorization page. After granting permissions, you'll be redirected back here
            automatically.
          </p>
        </div>
      </div>
    </div>
  );
}