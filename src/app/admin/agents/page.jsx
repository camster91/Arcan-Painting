"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bot,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Filter,
  RefreshCw,
  ArrowRight,
  Calendar,
  Play,
  ChevronDown,
} from "lucide-react";

const AGENTS = [
  { id: "lead-qualifier", name: "Lead Qualifier" },
  { id: "schedule-estimator", name: "Schedule Estimator" },
  { id: "proposal-generator", name: "Proposal Generator" },
  { id: "migrate", name: "Migration Agent" },
];

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "running", label: "Running" },
  { value: "success", label: "Success" },
  { value: "failure", label: "Failure" },
];

function formatDuration(ms) {
  if (!ms) return "-";
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.round(ms / 1000)}s`;
}

function formatTime(timestamp) {
  if (!timestamp) return "-";
  const date = new Date(timestamp);
  return date.toLocaleTimeString("en-CA", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatDate(timestamp) {
  if (!timestamp) return "-";
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
  });
}

function StatusBadge({ status }) {
  const config = {
    running: { bg: "bg-blue-100", text: "text-blue-800", icon: Loader2, spin: true },
    success: { bg: "bg-green-100", text: "text-green-800", icon: CheckCircle2, spin: false },
    failure: { bg: "bg-red-100", text: "text-red-800", icon: XCircle, spin: false },
  };
  const { bg, text, icon: Icon, spin } = config[status] || config.failure;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${bg} ${text}`}>
      <Icon size={12} className={spin ? "animate-spin" : ""} />
      {status}
    </span>
  );
}

export default function AgentsDashboard() {
  const [agentFilter, setAgentFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const params = new URLSearchParams();
  if (agentFilter) params.set("agent_id", agentFilter);
  if (statusFilter) params.set("status", statusFilter);
  if (dateFilter) {
    const since = new Date();
    since.setDate(since.getDate() - parseInt(dateFilter));
    params.set("since", since.getTime().toString());
  }
  params.set("limit", "50");

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["agent-runs", agentFilter, statusFilter, dateFilter],
    queryFn: async () => {
      const res = await fetch(`/api/agents/runs?${params}`);
      if (!res.ok) throw new Error("Failed to fetch agent runs");
      return res.json();
    },
  });

  const runs = data?.runs || [];
  const stats = data?.stats || {
    total_runs_today: 0,
    success_rate: 0,
    avg_duration_ms: 0,
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Page Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">AI Agents</h1>
              <p className="text-sm text-slate-600 mt-1">
                Monitor and manage AI agent executions
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => refetch()}
                disabled={isLoading}
                className="px-3 py-2 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2"
              >
                <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
                Refresh
              </button>
              <a
                href="/admin/agents/run"
                className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Play size={16} />
                Run Agent
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Runs Today</p>
                <p className="text-2xl font-bold text-slate-900">{stats.total_runs_today}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Bot className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Success Rate</p>
                <p className="text-2xl font-bold text-green-600">{stats.success_rate}%</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Avg Duration</p>
                <p className="text-2xl font-bold text-slate-900">
                  {formatDuration(stats.avg_duration_ms)}
                </p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          {/* Mobile filter toggle */}
          <div className="lg:hidden">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
            >
              <Filter size={16} />
              Filters
              <ChevronDown size={16} className={showFilters ? "rotate-180" : ""} />
            </button>
          </div>

          <div className={`flex flex-col lg:flex-row gap-4 ${showFilters ? "mt-4" : "hidden lg:flex"}`}>
            {/* Agent filter */}
            <div className="flex-1">
              <select
                value={agentFilter}
                onChange={(e) => setAgentFilter(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
              >
                <option value="">All Agents</option>
                {AGENTS.map((agent) => (
                  <option key={agent.id} value={agent.id}>{agent.name}</option>
                ))}
              </select>
            </div>

            {/* Status filter */}
            <div className="flex-1">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Date range filter */}
            <div className="flex-1">
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
              >
                <option value="">All Time</option>
                <option value="1">Last 24 hours</option>
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Error: {error.message}</p>
            <button
              onClick={() => refetch()}
              className="mt-2 text-red-600 hover:text-red-800 underline text-sm"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Runs List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {isLoading ? (
          <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500 mx-auto mb-4" />
            <p className="text-slate-600">Loading agent runs...</p>
          </div>
        ) : runs.length === 0 ? (
          <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
            <Bot className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No agent runs yet</h3>
            <p className="text-slate-600 mb-6">
              Agent executions will appear here once they run.
            </p>
            <a
              href="/admin/agents/run"
              className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
            >
              Run an Agent
              <ArrowRight size={16} />
            </a>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Agent</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Reference</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Duration</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Started</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {runs.map((run) => (
                    <tr key={run.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Bot size={16} className="text-slate-400" />
                          <span className="font-medium text-slate-900">{run.agent_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {run.reference_type && run.reference_id ? (
                          <span className="text-sm text-slate-600">
                            {run.reference_type}/{run.reference_id}
                          </span>
                        ) : (
                          <span className="text-sm text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={run.status} />
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-slate-600">{formatDuration(run.duration_ms)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-sm text-slate-600">
                          <Calendar size={14} />
                          {formatDate(run.started_at)} {formatTime(run.started_at)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <a
                          href={`/admin/agents/${run.id}`}
                          className="text-amber-600 hover:text-amber-800 text-sm font-medium inline-flex items-center gap-1"
                        >
                          View
                          <ArrowRight size={14} />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden divide-y divide-slate-200">
              {runs.map((run) => (
                <div key={run.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Bot size={16} className="text-slate-400" />
                      <span className="font-medium text-slate-900">{run.agent_name}</span>
                    </div>
                    <StatusBadge status={run.status} />
                  </div>
                  <div className="text-sm text-slate-600 space-y-1">
                    {run.reference_type && run.reference_id && (
                      <p>{run.reference_type}/{run.reference_id}</p>
                    )}
                    <p>{formatDuration(run.duration_ms)} · {formatDate(run.started_at)} {formatTime(run.started_at)}</p>
                  </div>
                  <a
                    href={`/admin/agents/${run.id}`}
                    className="text-amber-600 hover:text-amber-800 text-sm font-medium mt-2 inline-flex items-center gap-1"
                  >
                    View Details
                    <ArrowRight size={14} />
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}