"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Clock,
  Users,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import TeamScheduleView from "@/components/admin/scheduling/TeamScheduleView";
import TimeTrackingView from "@/components/admin/scheduling/TimeTrackingView";
import TimeEntryModal from "@/components/admin/scheduling/TimeEntryModal";

export default function SchedulingPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState("calendar"); // 'calendar', 'time-tracking', 'team-schedule'
  const [showTimeEntryForm, setShowTimeEntryForm] = useState(false);
  const [selectedTeamMember, setSelectedTeamMember] = useState("");
  const [editingEntry, setEditingEntry] = useState(null);

  const queryClient = useQueryClient();

  // Get current week dates
  const weekDates = useMemo(() => {
    const start = new Date(currentDate);
    const day = start.getDay();
    const diff = start.getDate() - day; // First day is Sunday
    start.setDate(diff);

    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      return date;
    });
  }, [currentDate]);

  const formatDate = (date) => date.toISOString().split("T")[0];

  // Fetch team availability
  const { data: teamAvailability, isLoading: teamAvailLoading } = useQuery({
    queryKey: [
      "team-availability",
      formatDate(weekDates[0]),
      formatDate(weekDates[6]),
    ],
    queryFn: async () => {
      const response = await fetch(
        `/api/team-availability?start_date=${formatDate(weekDates[0])}&end_date=${formatDate(weekDates[6])}`,
      );
      if (!response.ok) throw new Error("Failed to fetch team availability");
      return response.json();
    },
  });

  // Fetch time tracking
  const { data: timeTracking, isLoading: timeTrackingLoading } = useQuery({
    queryKey: [
      "time-tracking",
      formatDate(weekDates[0]),
      formatDate(weekDates[6]),
    ],
    queryFn: async () => {
      const response = await fetch(
        `/api/time-tracking?start_date=${formatDate(weekDates[0])}&end_date=${formatDate(weekDates[6])}`,
      );
      if (!response.ok) throw new Error("Failed to fetch time tracking");
      return response.json();
    },
  });

  // Fetch team members
  const { data: teamMembers = [] } = useQuery({
    queryKey: ["team-members"],
    queryFn: async () => {
      const response = await fetch("/api/team-members");
      if (!response.ok) throw new Error("Failed to fetch team members");
      return response.json();
    },
  });

  // Fetch projects
  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const response = await fetch("/api/projects");
      if (!response.ok) throw new Error("Failed to fetch projects");
      return response.json();
    },
  });

  const availability = teamAvailability?.availability || [];
  const timeEntries = timeTracking?.timeEntries || [];

  // Mutations
  const createTimeEntryMutation = useMutation({
    mutationFn: async (data) => {
      const response = await fetch("/api/time-tracking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create time entry");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time-tracking"] });
      setShowTimeEntryForm(false);
    },
  });

  const updateTimeEntryMutation = useMutation({
    mutationFn: async (data) => {
      const response = await fetch("/api/time-tracking", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update time entry");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time-tracking"] });
      setEditingEntry(null);
    },
  });

  const navigateWeek = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + direction * 7);
    setCurrentDate(newDate);
  };

  if (teamAvailLoading || timeTrackingLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading scheduling data...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-slate-50"
      style={{
        fontFamily:
          'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Team Scheduling
              </h1>
              <p className="text-slate-600 text-sm">
                Manage team schedules and time tracking
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowTimeEntryForm(true)}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
              >
                <Clock size={16} /> Log Time
              </button>
            </div>
          </div>

          {/* View Mode Tabs */}
          <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode("team-schedule")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === "team-schedule"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Users size={16} className="inline mr-2" />
              Team Schedule
            </button>
            <button
              onClick={() => setViewMode("time-tracking")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === "time-tracking"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Clock size={16} className="inline mr-2" />
              Time Tracking
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Week Navigation */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 mb-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigateWeek(-1)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <h2 className="text-lg font-semibold text-slate-900">
              {weekDates[0].toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
              })}{" "}
              -{" "}
              {weekDates[6].toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </h2>
            <button
              onClick={() => navigateWeek(1)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Team Schedule View */}
        {viewMode === "team-schedule" && (
          <TeamScheduleView
            weekDates={weekDates}
            availability={availability}
            timeEntries={timeEntries}
            teamMembers={teamMembers}
          />
        )}

        {/* Time Tracking View */}
        {viewMode === "time-tracking" && (
          <TimeTrackingView
            timeEntries={timeEntries}
            teamMembers={teamMembers}
            projects={projects}
            onEdit={setEditingEntry}
            updateMutation={updateTimeEntryMutation}
          />
        )}
      </div>

      {/* Modals */}
      {showTimeEntryForm && (
        <TimeEntryModal
          onClose={() => setShowTimeEntryForm(false)}
          onSubmit={(data) => createTimeEntryMutation.mutate(data)}
          teamMembers={teamMembers}
          projects={projects}
          isLoading={createTimeEntryMutation.isLoading}
        />
      )}

      {editingEntry && (
        <TimeEntryModal
          entry={editingEntry}
          onClose={() => setEditingEntry(null)}
          onSubmit={(data) =>
            updateTimeEntryMutation.mutate({ id: editingEntry.id, ...data })
          }
          teamMembers={teamMembers}
          projects={projects}
          isLoading={updateTimeEntryMutation.isLoading}
        />
      )}
    </div>
  );
}
