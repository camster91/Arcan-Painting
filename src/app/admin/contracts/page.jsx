"use client";

import { useState } from "react";
import {
  Plus,
  RefreshCw,
  FileSignature,
  Search,
  Filter,
  Grid,
  List,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { useContracts } from "@/hooks/useContracts";
import {
  filterContracts,
  calculateContractStats,
} from "@/utils/contractsUtils";
import { ContractsTable } from "@/components/admin/contracts/ContractsTable";
import { ContractDetailModal } from "@/components/admin/contracts/ContractDetailModal";
import CreateContractModal from "@/components/admin/contracts/CreateContractModal";

export default function ContractsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [viewMode, setViewMode] = useState("table");
  const [refreshing, setRefreshing] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const { contracts, loading, error, refetch } = useContracts(statusFilter);

  const filteredContracts = filterContracts(contracts, searchTerm);
  const stats = calculateContractStats(contracts);

  const statusOptions = [
    { label: "All Contracts", value: "all" },
    { label: "Draft", value: "draft" },
    { label: "Sent", value: "sent" },
    { label: "Signed", value: "signed" },
    { label: "Completed", value: "completed" },
    { label: "Cancelled", value: "cancelled" },
  ];

  const statusCounts = {
    all: contracts.length,
    draft: contracts.filter((c) => c.status === "draft").length,
    sent: contracts.filter((c) => c.status === "sent").length,
    signed: contracts.filter((c) => c.status === "signed").length,
    completed: contracts.filter((c) => c.status === "completed").length,
    cancelled: contracts.filter((c) => c.status === "cancelled").length,
  };

  const handleViewContract = (contract) => {
    setSelectedContract(contract);
    setShowDetailModal(true);
  };

  const handleCreateContract = () => {
    setShowCreateModal(true);
  };

  const handleContractCreated = (newContract) => {
    refetch();
    setShowCreateModal(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading contracts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Page Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Contracts</h1>
              <p className="text-sm text-slate-600 mt-1">
                {filteredContracts.length} of {contracts.length} project
                contracts
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="px-3 py-2 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2"
              >
                <RefreshCw
                  size={16}
                  className={refreshing ? "animate-spin" : ""}
                />
                <span className="hidden sm:inline">Refresh</span>
              </button>

              {/* View Mode Toggle - Desktop Only */}
              <div className="hidden lg:flex bg-slate-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("cards")}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                    viewMode === "cards"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Grid size={16} />
                  Cards
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                    viewMode === "table"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <List size={16} />
                  Table
                </button>
              </div>

              <button
                onClick={handleCreateContract}
                className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Plus size={16} />
                New Contract
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">
                  Total Contracts
                </p>
                <p className="text-2xl font-bold text-slate-900">
                  {stats.total || 0}
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <FileSignature className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Pending</p>
                <p className="text-2xl font-bold text-amber-600">
                  {stats.pending || 0}
                </p>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Signed</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.signed || 0}
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
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          {/* Mobile Filter Toggle */}
          <div className="lg:hidden mb-4">
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
            >
              <Filter size={16} />
              Filters
            </button>
          </div>

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
                  placeholder="Search contracts by number, title, or client..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div
              className={`lg:flex gap-2 ${showMobileFilters ? "flex flex-wrap" : "hidden"}`}
            >
              {statusOptions.map((status) => (
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
                  {statusCounts[status.value] > 0 && (
                    <span className="ml-1.5 text-xs opacity-75">
                      ({statusCounts[status.value]})
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <p className="text-red-800">Error: {error}</p>
            </div>
            <button
              onClick={handleRefresh}
              className="mt-2 text-red-600 hover:text-red-800 underline text-sm"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Contracts Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {filteredContracts.length === 0 ? (
          <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
            <FileSignature className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              No contracts found
            </h3>
            <p className="text-slate-600 mb-6">
              {searchTerm || statusFilter !== "all"
                ? "Try adjusting your search or filter criteria."
                : "Contracts will appear here when you create project agreements."}
            </p>
            <button
              onClick={handleCreateContract}
              className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Create First Contract
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-slate-200">
            <ContractsTable
              contracts={filteredContracts}
              onViewContract={handleViewContract}
              onActionDone={() => refetch()}
            />
          </div>
        )}
      </div>

      {/* Modals */}
      <ContractDetailModal
        contract={selectedContract}
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        onUpdated={() => refetch()}
      />

      <CreateContractModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleContractCreated}
      />
    </div>
  );
}
