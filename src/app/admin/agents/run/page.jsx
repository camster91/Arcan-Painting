"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Play,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  Bot,
  ArrowLeft,
  Info,
} from "lucide-react";

const AGENTS = [
  {
    id: "lead-qualifier",
    name: "Lead Qualifier",
    description: "Qualifies a lead by scoring and analyzing",
    endpoint: "/api/agents/lead-qualifier",
    inputHint: `{ "name": "John Doe", "email": "john@example.com", "phone": "4165551234", "serviceType": "Interior Painting", "projectDescription": "Whole house interior", "address": "123 Main St, Toronto", "preferredContact": "email" }`,
    fields: ["name", "email", "phone", "serviceType", "projectDescription", "address", "preferredContact"],
  },
  {
    id: "schedule-estimator",
    name: "Schedule Estimator",
    description: "Prepares a scheduling package for a lead",
    endpoint: "/api/agents/schedule-estimator",
    inputHint: `{ "leadId": 123 }`,
    fields: ["leadId"],
  },
  {
    id: "proposal-generator",
    name: "Proposal Generator",
    description: "Generates a proposal document for an estimate",
    endpoint: "/api/agents/proposal-generator",
    inputHint: `{ "estimateId": 456 }`,
    fields: ["estimateId"],
  },
  {
    id: "migrate",
    name: "Migration Agent",
    description: "Runs database migrations for agent fields",
    endpoint: "/api/agents/migrate",
    inputHint: `{}`,
    fields: [],
  },
];

function OpenClawWarning() {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <AlertTriangle className="text-amber-600 mt-0.5" size={20} />
        <div>
          <h3 className="font-semibold text-amber-900 mb-1">OpenClaw Not Configured</h3>
          <p className="text-sm text-amber-800">
            The <code className="bg-amber-100 px-1 rounded">OPENCLAW_URL</code> environment variable is not set.
            Agent runs will fail because there is no AI agent service to connect to.
          </p>
          <p className="text-sm text-amber-800 mt-2">
            Set <code className="bg-amber-100 px-1 rounded">OPENCLAW_URL</code> in your environment (e.g.,{" "}
            <code className="bg-amber-100 px-1 rounded">http://localhost:18789</code> for local development) and
            restart the server to enable agent execution.
          </p>
        </div>
      </div>
    </div>
  );
}

function ResultPanel({ result, isError }) {
  if (!result && !isError) return null;

  return (
    <div className={`rounded-lg border overflow-hidden ${isError ? "border-red-200 bg-red-50" : "border-slate-200 bg-white"}`}>
      <div className={`px-4 py-2 border-b ${isError ? "border-red-200 bg-red-100" : "border-slate-200 bg-slate-50"}`}>
        <div className="flex items-center gap-2">
          {isError ? (
            <XCircle className="text-red-600" size={16} />
          ) : result?.agent_ran === false ? (
            <AlertTriangle className="text-amber-600" size={16} />
          ) : (
            <CheckCircle2 className="text-green-600" size={16} />
          )}
          <span className={`text-sm font-semibold ${isError ? "text-red-900" : "text-slate-700"}`}>
            {isError ? "Error" : result?.agent_ran === false ? "Agent Failed" : "Success"}
          </span>
        </div>
      </div>
      <pre className="p-4 text-sm font-mono whitespace-pre-wrap break-all overflow-x-auto max-h-96 overflow-y-auto">
        {JSON.stringify(result, null, 2)}
      </pre>
    </div>
  );
}

export default function AgentRunPage() {
  const [selectedAgent, setSelectedAgent] = useState("");
  const [inputJson, setInputJson] = useState("");
  const [jsonError, setJsonError] = useState("");
  const [openClawConfigured, setOpenClawConfigured] = useState(true);

  // Check OpenClaw status on mount
  const { data: agentsStatus } = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/agents");
      if (res.ok) return res.json();
      return null;
    },
    onSuccess: (data) => {
      if (data?.openclaw) {
        setOpenClawConfigured(data.openclaw.configured !== false);
      }
    },
  });

  const runMutation = useMutation({
    mutationFn: async ({ agentId, input }) => {
      const agent = AGENTS.find((a) => a.id === agentId);
      if (!agent) throw new Error("Unknown agent");

      const res = await fetch(agent.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.details || "Request failed");
      }
      return data;
    },
  });

  const handleAgentChange = (agentId) => {
    setSelectedAgent(agentId);
    setJsonError("");
    const agent = AGENTS.find((a) => a.id === agentId);
    if (agent) {
      setInputJson(agent.inputHint);
    } else {
      setInputJson("");
    }
  };

  const handleInputChange = (value) => {
    setInputJson(value);
    setJsonError("");
  };

  const handleRun = () => {
    if (!selectedAgent) return;

    let parsed;
    try {
      parsed = JSON.parse(inputJson);
    } catch {
      setJsonError("Invalid JSON. Please check your input.");
      return;
    }

    runMutation.mutate({ agentId: selectedAgent, input: parsed });
  };

  const selectedAgentData = AGENTS.find((a) => a.id === selectedAgent);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <a
              href="/admin/agents"
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </a>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Run Agent Manually</h1>
              <p className="text-sm text-slate-600 mt-1">Execute an AI agent with custom input</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* OpenClaw warning */}
        {!openClawConfigured && <OpenClawWarning />}

        {/* Agent selector */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Bot size={20} className="text-slate-600" />
            Select Agent
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {AGENTS.map((agent) => (
              <button
                key={agent.id}
                onClick={() => handleAgentChange(agent.id)}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  selectedAgent === agent.id
                    ? "border-amber-500 bg-amber-50"
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <div className="font-medium text-slate-900">{agent.name}</div>
                <div className="text-sm text-slate-600 mt-1">{agent.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Input editor */}
        {selectedAgent && (
          <div className="bg-white rounded-lg border border-slate-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Info size={20} className="text-slate-600" />
              Input JSON
            </h2>
            <textarea
              value={inputJson}
              onChange={(e) => handleInputChange(e.target.value)}
              rows={12}
              className={`w-full px-4 py-3 font-mono text-sm border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${
                jsonError ? "border-red-300 bg-red-50" : "border-slate-300"
              }`}
              placeholder='{ "key": "value" }'
            />
            {jsonError && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <AlertTriangle size={14} />
                {jsonError}
              </p>
            )}
          </div>
        )}

        {/* Run button */}
        {selectedAgent && (
          <div className="flex justify-end mb-6">
            <button
              onClick={handleRun}
              disabled={runMutation.isPending || !inputJson.trim()}
              className="bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              {runMutation.isPending ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play size={18} />
                  Run Agent
                </>
              )}
            </button>
          </div>
        )}

        {/* Result */}
        {(runMutation.isSuccess || runMutation.isError) && (
          <div className="mb-6">
            {runMutation.isError && (
              <ResultPanel result={runMutation.error.message} isError={true} />
            )}
            {runMutation.isSuccess && (
              <ResultPanel result={runMutation.data} isError={false} />
            )}
          </div>
        )}

        {/* Agent info */}
        {selectedAgentData && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm">
            <p className="text-slate-700">
              <span className="font-semibold">Endpoint:</span>{" "}
              <code className="bg-white px-1 rounded">{selectedAgentData.endpoint}</code>
            </p>
            {selectedAgentData.fields.length > 0 && (
              <p className="text-slate-700 mt-2">
                <span className="font-semibold">Expected fields:</span>{" "}
                {selectedAgentData.fields.join(", ")}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}