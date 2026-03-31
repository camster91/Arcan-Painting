"use client";

/**
 * AIProposalModal
 * 
 * Shows when admin clicks "Generate Proposal" on an estimate.
 * Calls the AI proposal-generator agent and displays:
 * - Proposal summary
 * - Generated proposal HTML (preview)
 * - Client email draft
 * - Copy/Download/Send actions
 */

import { useState } from "react";
import { X, FileText, Mail, Copy, CheckCircle, Bot, Loader2, AlertCircle, Download } from "lucide-react";

export default function AIProposalModal({ estimate, onClose, onProposalGenerated }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [proposal, setProposal] = useState(null);
  const [copied, setCopied] = useState(null);
  const [activeTab, setActiveTab] = useState("summary");

  const runAgent = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/agents/proposal-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estimateId: estimate.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Proposal agent failed");
      }

      if (data.proposal) {
        setProposal(data.proposal);
        if (onProposalGenerated) onProposalGenerated(data.proposal);
      } else {
        setError("Agent ran but returned no proposal. Check OpenClaw status.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text, key) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // Fallback
    }
  };

  const downloadHTML = () => {
    if (!proposal?.html) return;
    const blob = new Blob([proposal.html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `proposal-${estimate.estimate_number || estimate.id}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tabs = [
    { id: "summary", label: "Summary" },
    { id: "email", label: "Client Email" },
    { id: "preview", label: "Proposal Preview" },
    { id: "notes", label: "Internal Notes" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Bot className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">AI Proposal Generator</h2>
              <p className="text-sm text-slate-500">
                Estimate #{estimate.estimate_number || estimate.id}
                {estimate.client_name && ` — ${estimate.client_name}`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Estimate Summary */}
            <div className="bg-slate-50 rounded-lg p-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-slate-500">Service:</span>
                <span className="ml-2 text-slate-800 font-medium">{estimate.service_type || "—"}</span>
              </div>
              <div>
                <span className="text-slate-500">Total:</span>
                <span className="ml-2 text-slate-800 font-medium">
                  ${(estimate.total || estimate.total_amount || 0).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Status:</span>
                <span className="ml-2 text-slate-800 font-medium capitalize">{estimate.status}</span>
              </div>
              <div>
                <span className="text-slate-500">Client:</span>
                <span className="ml-2 text-slate-800 font-medium">{estimate.client_name || "—"}</span>
              </div>
            </div>

            {/* Initial state */}
            {!proposal && !loading && (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 mb-2">Generate a professional proposal document for this estimate.</p>
                <p className="text-slate-400 text-sm mb-6">
                  The AI will create a full HTML proposal, client email, and internal notes based on the estimate data.
                </p>
                <button
                  onClick={runAgent}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg flex items-center gap-2 mx-auto transition-colors"
                >
                  <Bot className="w-4 h-4" />
                  Generate Proposal
                </button>
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-3" />
                <p className="text-slate-600">AI is generating your proposal...</p>
                <p className="text-slate-400 text-sm mt-1">This may take up to 90 seconds</p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-700 font-medium">Generation Failed</p>
                  <p className="text-red-600 text-sm mt-1">{error}</p>
                  <button onClick={runAgent} className="text-red-600 underline text-sm mt-2">Try again</button>
                </div>
              </div>
            )}

            {/* Proposal Results */}
            {proposal && (
              <div className="space-y-4">
                {/* Tabs */}
                <div className="flex gap-1 border-b border-slate-200">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-4 py-2 text-sm font-medium transition-colors ${
                        activeTab === tab.id
                          ? "text-blue-600 border-b-2 border-blue-600"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                {activeTab === "summary" && (
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="font-medium text-green-800">Proposal Generated!</span>
                      </div>
                      <p className="text-green-700 text-sm">{proposal.text_summary}</p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => copyToClipboard(proposal.text_summary || "", "summary")}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm text-slate-700 transition-colors"
                      >
                        {copied === "summary" ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        {copied === "summary" ? "Copied!" : "Copy Summary"}
                      </button>
                      {proposal.html && (
                        <button
                          onClick={downloadHTML}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 rounded-lg text-sm text-blue-700 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          Download HTML
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === "email" && proposal.client_email && (
                  <div className="space-y-3">
                    <div className="bg-slate-50 rounded-lg p-3">
                      <span className="text-xs font-semibold text-slate-500 uppercase">Subject:</span>
                      <p className="text-slate-800 mt-1">{proposal.client_email.subject}</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3">
                      <span className="text-xs font-semibold text-slate-500 uppercase">Body:</span>
                      <pre className="text-slate-700 text-sm mt-2 whitespace-pre-wrap font-sans leading-relaxed">
                        {proposal.client_email.body}
                      </pre>
                    </div>
                    <button
                      onClick={() => copyToClipboard(proposal.client_email.body, "email")}
                      className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm text-slate-700 transition-colors"
                    >
                      {copied === "email" ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      {copied === "email" ? "Copied!" : "Copy Email Body"}
                    </button>
                  </div>
                )}

                {activeTab === "preview" && (
                  <div>
                    {proposal.html ? (
                      <div className="border border-slate-200 rounded-lg overflow-hidden">
                        <iframe
                          srcDoc={proposal.html}
                          title="Proposal Preview"
                          className="w-full h-96 bg-white"
                          sandbox="allow-same-origin"
                        />
                      </div>
                    ) : (
                      <p className="text-slate-400 text-sm text-center py-8">No HTML preview available</p>
                    )}
                  </div>
                )}

                {activeTab === "notes" && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-amber-800 text-sm">{proposal.internal_notes || "No internal notes."}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700 text-sm">
            Close
          </button>
          {proposal?.client_email && (
            <button
              onClick={() => {
                const mailto = `mailto:${estimate.client_email || ""}?subject=${encodeURIComponent(proposal.client_email.subject)}&body=${encodeURIComponent(proposal.client_email.body)}`;
                window.open(mailto, "_blank");
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Mail className="w-4 h-4" />
              Open in Email Client
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
