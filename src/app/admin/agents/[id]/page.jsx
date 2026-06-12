"use client";

import { useParams, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Bot,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Calendar,
  AlertTriangle,
} from "lucide-react";

function formatDuration(ms) {
  if (!ms) return "-";
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.round(ms / 1000)}s`;
}

function formatTime(timestamp) {
  if (!timestamp) return "-";
  const date = new Date(timestamp);
  return date.toLocaleString("en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
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
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${bg} ${text}`}>
      <Icon size={16} className={spin ? "animate-spin" : ""} />
      {status}
    </span>
  );
}

function JsonBlock({ data, title }) {
  const json = JSON.stringify(data, null, 2);
  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <div className="bg-slate-50 px-4 py-2 border-b border-slate-200">
        <h4 className="text-sm font-semibold text-slate-700">{title}</h4>
      </div>
      <pre className="p-4 text-sm text-slate-800 overflow-x-auto bg-white font-mono whitespace-pre-wrap break-all">
        {json}
      </pre>
    </div>
  );
}

export default function AgentRunDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Fetch single run
  const { data, isLoading, error } = useQuery({
    queryKey: ["agent-run", id],
    queryFn: async () => {
      const res = await fetch(`/api/agents/runs/${id}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      if (!json.run) throw new Error("Run not found");
      return json;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500 mx-auto mb-4" />
          <p className="text-slate-600">Loading run details...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Run not found</h2>
          <p className="text-slate-600 mb-6">
            This agent run may have expired or does not exist.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const run = data?.run;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-900">{run.agent_name}</h1>
                <StatusBadge status={run.status} />
              </div>
              <p className="text-sm text-slate-600 mt-1">Run #{run.id}</p>
            </div>
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <Bot size={18} className="text-slate-500" />
              <div>
                <p className="text-xs text-slate-500">Agent</p>
                <p className="text-sm font-medium text-slate-900">{run.agent_id}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <Clock size={18} className="text-slate-500" />
              <div>
                <p className="text-xs text-slate-500">Duration</p>
                <p className="text-sm font-medium text-slate-900">{formatDuration(run.duration_ms)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <Calendar size={18} className="text-slate-500" />
              <div>
                <p className="text-xs text-slate-500">Started</p>
                <p className="text-sm font-medium text-slate-900">{formatTime(run.started_at)}</p>
              </div>
            </div>
            {run.reference_type && (
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-xs text-slate-500">Reference</p>
                  <p className="text-sm font-medium text-slate-900">
                    {run.reference_type}/{run.reference_id}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Error state */}
        {run.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <XCircle className="text-red-500 mt-0.5" size={20} />
              <div>
                <h3 className="font-semibold text-red-900 mb-1">Agent Error</h3>
                <p className="text-sm text-red-800">{run.error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Input JSON */}
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-3">Input</h3>
          <JsonBlock data={run.input || {}} title="Request Payload" />
        </div>

        {/* Output JSON */}
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-3">Output</h3>
          {run.output ? (
            <JsonBlock data={run.output} title="Response Data" />
          ) : (
            <div className="bg-slate-100 border border-slate-200 rounded-lg p-6 text-center">
              <p className="text-slate-500">No output yet — run may still be in progress.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}