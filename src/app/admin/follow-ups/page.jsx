"use client";

import { useState } from "react";
import { useFollowUps } from "@/hooks/useFollowUps";
import { useFollowUpFilters } from "@/hooks/useFollowUpFilters";
import { calculateStats } from "@/utils/followUpUtils";
import { FollowUpsHeader } from "@/components/admin/follow-ups/FollowUpsHeader";
import { PriorityAlerts } from "@/components/admin/follow-ups/PriorityAlerts";
import { FollowUpsStats } from "@/components/admin/follow-ups/FollowUpsStats";
import { FollowUpsFilters } from "@/components/admin/follow-ups/FollowUpsFilters";
import { FollowUpsTable } from "@/components/admin/follow-ups/FollowUpsTable";
import { NoFollowUpsFound } from "@/components/admin/follow-ups/NoFollowUpsFound";
import { CreateFollowUpModal } from "@/components/admin/follow-ups/CreateFollowUpModal";
import { FollowUpDetailModal } from "@/components/admin/follow-ups/FollowUpDetailModal";
import { LoadingSpinner } from "@/components/admin/follow-ups/LoadingSpinner";
import { ErrorMessage } from "@/components/admin/follow-ups/ErrorMessage";

export default function FollowUpsPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFollowUp, setSelectedFollowUp] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const { followUps, leads, loading, error, refetch } = useFollowUps(
    statusFilter,
    typeFilter,
  );

  const {
    filteredFollowUps,
    overdueFollowUps,
    todayFollowUps,
    upcomingFollowUps,
  } = useFollowUpFilters(followUps, searchTerm);

  const stats = calculateStats(
    followUps,
    overdueFollowUps,
    todayFollowUps,
    upcomingFollowUps,
  );

  const hasFilters =
    searchTerm || statusFilter !== "all" || typeFilter !== "all";

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div
      className="min-h-screen bg-slate-50"
      style={{
        fontFamily:
          'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <FollowUpsHeader
        onRefresh={refetch}
        onScheduleNew={() => setShowCreateForm(true)}
      />

      <div className="max-w-7xl mx-auto px-6 py-6">
        <PriorityAlerts
          overdueFollowUps={overdueFollowUps}
          todayFollowUps={todayFollowUps}
          onSelectFollowUp={setSelectedFollowUp}
        />

        <FollowUpsStats stats={stats} />

        <FollowUpsFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          typeFilter={typeFilter}
          onTypeChange={setTypeFilter}
        />

        {error && <ErrorMessage error={error} />}

        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          {filteredFollowUps.length === 0 ? (
            <NoFollowUpsFound
              hasFilters={hasFilters}
              onScheduleNew={() => setShowCreateForm(true)}
            />
          ) : (
            <FollowUpsTable
              followUps={filteredFollowUps}
              onSelectFollowUp={setSelectedFollowUp}
            />
          )}
        </div>
      </div>

      {showCreateForm && (
        <CreateFollowUpModal
          leads={leads}
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            setShowCreateForm(false);
            refetch();
          }}
        />
      )}

      {selectedFollowUp && (
        <FollowUpDetailModal
          followUp={selectedFollowUp}
          onClose={() => setSelectedFollowUp(null)}
          onUpdate={refetch}
        />
      )}
    </div>
  );
}
