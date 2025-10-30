"use client";

import { useState, useMemo } from "react";
import {
  Plus,
  Calculator,
  Search,
  Filter,
  Grid,
  List,
  Send,
  FileText,
  Edit,
  Trash2,
  Copy,
  Download,
  Eye,
  RefreshCw,
  X,
  CheckCircle2,
} from "lucide-react";
import { useEstimates } from "@/hooks/useEstimates";
import { useMutation } from "@tanstack/react-query";
import { EstimateBuilder } from "@/components/admin/estimates/EstimateBuilder";
import { EstimatesTable } from "@/components/admin/estimates/EstimatesTable";
import { EstimateDetailModal } from "@/components/admin/estimates/EstimateDetailModal";

export default function EstimatesPage() {
  const [activeTab, setActiveTab] = useState("builder"); // builder, list
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEstimate, setSelectedEstimate] = useState(null);
  const [viewMode, setViewMode] = useState("table");
  const [notification, setNotification] = useState(null);
  const [editingEstimate, setEditingEstimate] = useState(null);

  const { estimates, leads, loading, error, fetchData } = useEstimates();

  const filteredEstimates = useMemo(() => {
    let filtered = estimates;

    if (statusFilter !== "all") {
      filtered = filtered.filter((e) => e.status === statusFilter);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.estimate_number?.toLowerCase().includes(term) ||
          e.project_title?.toLowerCase().includes(term) ||
          e.lead_name?.toLowerCase().includes(term) ||
          e.lead_email?.toLowerCase().includes(term),
      );
    }

    return filtered;
  }, [estimates, statusFilter, searchTerm]);

  const stats = useMemo(() => {
    const total = estimates.length;
    const pending = estimates.filter((e) =>
      ["draft", "sent"].includes(e.status),
    ).length;
    const approved = estimates.filter((e) => e.status === "approved").length;
    const totalValue = estimates.reduce(
      (sum, e) => sum + (parseFloat(e.total_cost) || 0),
      0,
    );

    return { total, pending, approved, totalValue };
  }, [estimates]);

  const statusOptions = [
    { label: "All Estimates", value: "all" },
    { label: "Draft", value: "draft" },
    { label: "Sent", value: "sent" },
    { label: "Approved", value: "approved" },
    { label: "Rejected", value: "rejected" },
    { label: "Expired", value: "expired" },
  ];

  // Mutations for estimate actions
  const sendMutation = useMutation({
    mutationFn: async (id) => {
      const res = await fetch(`/api/estimates/${id}/send`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `Failed to send estimate ${id}`);
      }
      return data;
    },
    onSuccess: () => {
      fetchData();
      setNotification("Estimate sent successfully to client!");
      setTimeout(() => setNotification(null), 5000);
    },
    onError: (error) => {
      console.error(error);
      setNotification(`Error: ${error.message}`);
      setTimeout(() => setNotification(null), 5000);
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (id) => {
      const res = await fetch(`/api/estimates/${id}/duplicate`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `Failed to duplicate estimate ${id}`);
      }
      return data;
    },
    onSuccess: (data) => {
      fetchData();
      setNotification(
        `Estimate duplicated! New estimate: ${data.estimate_number}`,
      );
      setTimeout(() => setNotification(null), 5000);
    },
    onError: (error) => {
      console.error(error);
      setNotification(`Error: ${error.message}`);
      setTimeout(() => setNotification(null), 5000);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await fetch(`/api/estimates`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `Failed to delete estimate ${id}`);
      }
      return data;
    },
    onSuccess: () => {
      fetchData();
      setNotification("Estimate deleted successfully!");
      setTimeout(() => setNotification(null), 5000);
    },
    onError: (error) => {
      console.error(error);
      setNotification(`Error: ${error.message}`);
      setTimeout(() => setNotification(null), 5000);
    },
  });

  const handleEstimateAction = async (action, estimate) => {
    switch (action) {
      case "edit":
        setEditingEstimate(estimate);
        setActiveTab("builder");
        break;
      case "view":
        setSelectedEstimate(estimate);
        break;
      case "send": {
        if (!estimate.lead_email) {
          setNotification("Cannot send estimate - lead has no email address");
          setTimeout(() => setNotification(null), 5000);
          return;
        }
        try {
          await sendMutation.mutateAsync(estimate.id);
        } catch (e) {
          // Error handled in mutation
        }
        break;
      }
      case "download": {
        window.open(`/api/estimates/${estimate.id}/pdf`, "_blank");
        break;
      }
      case "duplicate": {
        try {
          await duplicateMutation.mutateAsync(estimate.id);
        } catch (e) {
          // Error handled in mutation
        }
        break;
      }
      case "delete": {
        const ok = window.confirm(
          `Delete estimate ${estimate.estimate_number}? This cannot be undone.`,
        );
        if (!ok) return;
        try {
          await deleteMutation.mutateAsync(estimate.id);
        } catch (e) {
          // Error handled in mutation
        }
        break;
      }
      default:
        console.log("Unknown action:", action);
    }
  };

  const handleEstimateCreated = () => {
    fetchData();
    setActiveTab("list");
    setNotification("Estimate created successfully!");
    setTimeout(() => setNotification(null), 5000);
  };

  const handleEstimateUpdated = () => {
    fetchData();
    setEditingEstimate(null);
    setActiveTab("list");
    setNotification("Estimate updated successfully!");
    setTimeout(() => setNotification(null), 5000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading estimates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Success/Error Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <p className="text-green-800 font-medium">{notification}</p>
            <button
              onClick={() => setNotification(null)}
              className="text-green-600 hover:text-green-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Professional Estimates
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                Build detailed estimates and manage your quotes
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => fetchData()}
                className="px-3 py-2 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2"
              >
                <RefreshCw size={16} />
                <span className="hidden sm:inline">Refresh</span>
              </button>

              {/* Tab Switcher */}
              <div className="bg-slate-100 rounded-lg p-1 flex">
                <button
                  onClick={() => {
                    setActiveTab("builder");
                    setEditingEstimate(null);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === "builder"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Calculator size={16} />
                  Builder
                </button>
                <button
                  onClick={() => setActiveTab("list")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === "list"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <FileText size={16} />
                  All Estimates ({estimates.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      {activeTab === "builder" ? (
        <EstimateBuilder
          editingEstimate={editingEstimate}
          onEstimateCreated={handleEstimateCreated}
          onEstimateUpdated={handleEstimateUpdated}
          onCancel={() => {
            setEditingEstimate(null);
            setActiveTab("list");
          }}
        />
      ) : (
        <>
          {/* Stats Cards */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">
                      Total Estimates
                    </p>
                    <p className="text-2xl font-bold text-slate-900">
                      {stats.total}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">
                      Pending
                    </p>
                    <p className="text-2xl font-bold text-amber-600">
                      {stats.pending}
                    </p>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-lg">
                    <Send className="w-6 h-6 text-amber-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">
                      Approved
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      {stats.approved}
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">
                      Total Value
                    </p>
                    <p className="text-2xl font-bold text-purple-600">
                      ${stats.totalValue?.toLocaleString() || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <Calculator className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search */}
                <div className="flex-1">
                  <div className="relative">
                    <Search
                      size={18}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="text"
                      placeholder="Search estimates by number, project, or client..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
                    />
                  </div>
                </div>

                {/* Status Filter */}
                <div className="flex gap-2 flex-wrap">
                  {statusOptions.map((status) => {
                    const count =
                      statusFilter === "all"
                        ? estimates.length
                        : estimates.filter((e) => e.status === status.value)
                            .length;

                    return (
                      <button
                        key={status.value}
                        onClick={() => setStatusFilter(status.value)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                          statusFilter === status.value
                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-transparent"
                        }`}
                      >
                        {status.label}
                        {status.value === statusFilter && count > 0 && (
                          <span className="ml-1.5 text-xs opacity-75">
                            ({count})
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Estimates List */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
            {filteredEstimates.length === 0 ? (
              <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
                <Calculator className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">
                  No estimates found
                </h3>
                <p className="text-slate-600 mb-6">
                  {searchTerm || statusFilter !== "all"
                    ? "Try adjusting your search or filter criteria."
                    : "Create your first professional estimate using our builder."}
                </p>
                <button
                  onClick={() => setActiveTab("builder")}
                  className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 mx-auto"
                >
                  <Calculator size={16} />
                  Create First Estimate
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-slate-200">
                <EstimatesTable
                  estimates={filteredEstimates}
                  onViewEstimate={setSelectedEstimate}
                  onAction={handleEstimateAction}
                />
              </div>
            )}
          </div>
        </>
      )}

      {/* Estimate Detail Modal */}
      {selectedEstimate && (
        <EstimateDetailModal
          estimate={selectedEstimate}
          onClose={() => setSelectedEstimate(null)}
          onUpdated={() => {
            fetchData();
          }}
          onNotification={(message) => {
            setNotification(message);
            setTimeout(() => setNotification(null), 5000);
          }}
        />
      )}
    </div>
  );
}
