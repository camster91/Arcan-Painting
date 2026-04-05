"use client";

import { useState, useEffect } from "react";
import {
  Settings,
  Server,
  Database,
  Cpu,
  Mail,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
  ShieldCheck,
  Zap,
  Terminal,
  ChevronRight,
  Loader2,
} from "lucide-react";

export default function SystemHealthPage() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [restarting, setRestarting] = useState(false);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/system");
      const data = await res.json();
      setHealth(data.health);
    } catch {
      alert("Failed to fetch system health");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const handleRestart = async () => {
    if (!confirm("Are you sure you want to trigger a service restart?")) return;
    setRestarting(true);
    try {
      const res = await fetch("/api/admin/system", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restart_services" }),
      });
      const data = await res.json();
      alert(data.message || "Restart initiated");
    } finally {
      setRestarting(false);
    }
  };

  if (loading && !health) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/admin/marketing" className="text-gray-400 hover:text-gray-600">
              <ArrowLeft className="w-5 h-5" />
            </a>
            <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">System Control Panel</h1>
              <p className="text-sm text-gray-500">Infrastructure health & configuration</p>
            </div>
          </div>
          <button
            onClick={fetchHealth}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh Status
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Main Health Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Database */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                  <Database className="w-6 h-6 text-blue-600" />
                </div>
                <StatusBadge status={health?.database?.status} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">PostgreSQL DB</h3>
              <p className="text-sm text-gray-500 mt-1">Neon Cloud Database</p>
              {health?.database?.message && (
                <p className="text-xs text-red-600 mt-2 bg-red-50 p-2 rounded">{health.database.message}</p>
              )}
            </div>
            <div className="bg-gray-50 px-6 py-3 border-t border-gray-100">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Latency: ~12ms</span>
            </div>
          </div>

          {/* AI Worker */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center">
                  <Cpu className="w-6 h-6 text-purple-600" />
                </div>
                <StatusBadge status={health?.ollama?.status} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Ollama AI</h3>
              <p className="text-sm text-gray-500 mt-1">Running on Coolify VPS</p>
              <p className="text-[10px] text-gray-400 mt-2 truncate font-mono">{health?.ollama?.url}</p>
            </div>
            <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Models: {health?.ollama?.models?.length || 0}
              </span>
              {health?.ollama?.models?.length > 0 && (
                 <span className="text-[10px] font-bold text-purple-600">{health.ollama.models[0].name}</span>
              )}
            </div>
          </div>

          {/* Email Service */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center">
                  <Mail className="w-6 h-6 text-amber-600" />
                </div>
                <StatusBadge status={health?.email?.status} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Maton → Gmail</h3>
              <p className="text-sm text-gray-500 mt-1">Outbound Email & Sequences</p>
              <p className="text-[10px] text-gray-400 mt-2 font-mono">{health?.env?.GOOGLE_EMAIL || "info@arcanpainting.ca"}</p>
            </div>
            <div className="bg-gray-50 px-6 py-3 border-t border-gray-100">
               <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Daily Limit: 500</span>
            </div>
          </div>
        </div>

        {/* Configuration Status */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-green-600" />
              Environment Configuration
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-gray-100">
            {health?.env && Object.entries(health.env).map(([key, configured]) => (
              <div key={key} className="bg-white px-6 py-4 flex items-center justify-between">
                <span className="text-sm font-mono text-gray-600">{key}</span>
                {configured ? (
                  <span className="flex items-center gap-1.5 text-[10px] font-bold text-green-600 uppercase tracking-wider">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Configured
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-[10px] font-bold text-red-500 uppercase tracking-wider">
                    <XCircle className="w-3.5 h-3.5" />
                    Missing
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="bg-slate-900 rounded-2xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="flex items-center gap-5 text-center md:text-left">
            <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center flex-shrink-0 border border-slate-700">
              <Zap className="w-8 h-8 text-amber-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Maintenance Actions</h3>
              <p className="text-slate-400 text-sm mt-1 max-w-md">
                Trigger a manual refresh of all container services. This will temporarily disrupt 
                active sessions but clears stuck background processes.
              </p>
            </div>
          </div>
          <button 
            onClick={handleRestart}
            disabled={restarting}
            className="px-8 py-4 bg-white text-slate-900 rounded-xl font-bold hover:bg-slate-100 transition-all flex items-center gap-2 disabled:opacity-50 active:scale-95 whitespace-nowrap shadow-lg shadow-white/5"
          >
            {restarting ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
            Full System Restart
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  if (status === "healthy") {
    return (
      <span className="flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-bold border border-green-100">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Healthy
      </span>
    );
  }
  if (status === "error" || status === "unreachable" || status === "auth_error") {
    return (
      <span className="flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-700 rounded-full text-xs font-bold border border-red-100">
        <AlertTriangle className="w-3.5 h-3.5" />
        Down
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-xs font-bold">
      <Clock className="w-3.5 h-3.5" />
      Checking
    </span>
  );
}
