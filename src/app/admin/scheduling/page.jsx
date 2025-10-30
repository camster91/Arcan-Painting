"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  Plus,
  Clock,
  Users,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  User,
  MapPin,
  Play,
  Square,
  Edit3,
  Trash2,
  CheckCircle,
} from "lucide-react";

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

// Time Tracking View Component
function TimeTrackingView({
  timeEntries,
  teamMembers,
  projects,
  onEdit,
  updateMutation,
}) {
  const [filterTeamMember, setFilterTeamMember] = useState("");
  const [filterProject, setFilterProject] = useState("");

  const filteredEntries = timeEntries.filter((entry) => {
    if (filterTeamMember && entry.team_member_id !== parseInt(filterTeamMember))
      return false;
    if (filterProject && entry.project_id !== parseInt(filterProject))
      return false;
    return true;
  });

  const clockOut = async (entryId) => {
    const now = new Date().toISOString();
    updateMutation.mutate({ id: entryId, clock_out_time: now });
  };

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const stats = {
      totalHours: 0,
      totalCost: 0,
      activeEntries: 0,
      completedEntries: 0,
    };

    filteredEntries.forEach((entry) => {
      if (entry.total_hours) stats.totalHours += parseFloat(entry.total_hours);
      if (entry.total_cost) stats.totalCost += parseFloat(entry.total_cost);
      if (entry.status === "active") stats.activeEntries++;
      if (entry.status === "completed") stats.completedEntries++;
    });

    return stats;
  }, [filteredEntries]);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={16} className="text-blue-600" />
            <span className="text-sm font-medium text-slate-600">
              Total Hours
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {summaryStats.totalHours.toFixed(1)}h
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-4 h-4 rounded bg-green-600" />
            <span className="text-sm font-medium text-slate-600">
              Total Cost
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            ${summaryStats.totalCost.toFixed(2)}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="flex items-center gap-2 mb-2">
            <Play size={16} className="text-amber-600" />
            <span className="text-sm font-medium text-slate-600">Active</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {summaryStats.activeEntries}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={16} className="text-green-600" />
            <span className="text-sm font-medium text-slate-600">
              Completed
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {summaryStats.completedEntries}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <div className="flex gap-4">
          <select
            value={filterTeamMember}
            onChange={(e) => setFilterTeamMember(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-amber-500"
          >
            <option value="">All team members</option>
            {teamMembers.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
          <select
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-amber-500"
          >
            <option value="">All projects</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.project_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Time Entries */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        {filteredEntries.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No time entries found for this period.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-slate-900">
                    Team Member
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-slate-900">
                    Project/Task
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-slate-900">
                    Time
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-slate-900">
                    Hours
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-slate-900">
                    Rate
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-slate-900">
                    Cost
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-slate-900">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-slate-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-slate-400" />
                        <div>
                          <div className="font-medium">
                            {entry.team_member_name}
                          </div>
                          <div className="text-sm text-slate-500">
                            {entry.team_member_role}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium">
                          {entry.project_name ||
                            entry.task_title ||
                            "General Work"}
                        </div>
                        {entry.work_description && (
                          <div className="text-sm text-slate-500 line-clamp-2">
                            {entry.work_description}
                          </div>
                        )}
                        {entry.location && (
                          <div className="text-sm text-slate-500 flex items-center gap-1">
                            <MapPin size={12} />
                            {entry.location}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <div>
                        {new Date(entry.clock_in_time).toLocaleString()}
                      </div>
                      {entry.clock_out_time && (
                        <div className="text-slate-500">
                          to {new Date(entry.clock_out_time).toLocaleString()}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 font-medium">
                      {entry.total_hours
                        ? `${entry.total_hours.toFixed(2)}h`
                        : "—"}
                    </td>
                    <td className="py-3 px-4">
                      {entry.hourly_rate
                        ? `$${parseFloat(entry.hourly_rate).toFixed(2)}/h`
                        : "—"}
                    </td>
                    <td className="py-3 px-4 font-medium">
                      {entry.total_cost
                        ? `$${parseFloat(entry.total_cost).toFixed(2)}`
                        : "—"}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          entry.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-slate-100 text-slate-800"
                        }`}
                      >
                        {entry.status === "active" ? "Active" : "Completed"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        {entry.status === "active" && (
                          <button
                            onClick={() => clockOut(entry.id)}
                            className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center gap-1"
                          >
                            <Square size={14} /> Clock Out
                          </button>
                        )}
                        <button
                          onClick={() => onEdit(entry)}
                          className="text-amber-600 hover:text-amber-700 text-sm font-medium flex items-center gap-1"
                        >
                          <Edit3 size={14} /> Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// Team Schedule View Component
function TeamScheduleView({
  weekDates,
  availability,
  timeEntries,
  teamMembers,
}) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900">
          Team Schedule Overview
        </h3>
        <p className="text-sm text-slate-600">
          Track team member availability and work hours
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left py-3 px-4 font-medium text-slate-900 sticky left-0 bg-slate-50 z-10 border-r border-slate-200">
                Team Member
              </th>
              {weekDates.map((date, index) => (
                <th
                  key={index}
                  className="text-center py-3 px-4 font-medium text-slate-900 min-w-[140px]"
                >
                  <div>
                    {date.toLocaleDateString("en-US", { weekday: "short" })}
                  </div>
                  <div className="text-sm text-slate-500">{date.getDate()}</div>
                </th>
              ))}
              <th className="text-center py-3 px-4 font-medium text-slate-900 min-w-[100px]">
                Weekly Total
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {teamMembers.map((member) => {
              let weeklyTotal = 0;

              return (
                <tr key={member.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 sticky left-0 bg-white border-r border-slate-200 z-10">
                    <div>
                      <div className="font-medium">{member.name}</div>
                      <div className="text-sm text-slate-500 capitalize">
                        {member.role}
                      </div>
                      {member.hourly_rate && (
                        <div className="text-xs text-slate-400">
                          ${member.hourly_rate}/hr
                        </div>
                      )}
                    </div>
                  </td>
                  {weekDates.map((date, dateIndex) => {
                    const dateStr = date.toISOString().split("T")[0];
                    const memberAvailability = availability.filter(
                      (a) =>
                        a.team_member_id === member.id && a.date === dateStr,
                    );
                    const memberTimeEntries = timeEntries.filter(
                      (t) =>
                        t.team_member_id === member.id &&
                        t.clock_in_time.split("T")[0] === dateStr,
                    );

                    // Calculate daily hours
                    const dailyHours = memberTimeEntries.reduce(
                      (sum, entry) => {
                        return sum + (parseFloat(entry.total_hours) || 0);
                      },
                      0,
                    );
                    weeklyTotal += dailyHours;

                    return (
                      <td
                        key={dateIndex}
                        className="py-3 px-4 text-center min-w-[140px]"
                      >
                        <div className="space-y-1">
                          {/* Availability */}
                          {memberAvailability.map((avail) => (
                            <div
                              key={avail.id}
                              className={`text-xs px-2 py-1 rounded ${
                                avail.availability_type === "available"
                                  ? "bg-green-100 text-green-700"
                                  : avail.availability_type === "vacation"
                                    ? "bg-blue-100 text-blue-700"
                                    : avail.availability_type === "sick"
                                      ? "bg-red-100 text-red-700"
                                      : "bg-orange-100 text-orange-700"
                              }`}
                            >
                              {avail.start_time?.slice(0, 5)} -{" "}
                              {avail.end_time?.slice(0, 5)}
                            </div>
                          ))}

                          {/* Time entries */}
                          {memberTimeEntries.map((entry) => (
                            <div
                              key={entry.id}
                              className={`text-xs px-2 py-1 rounded ${
                                entry.status === "active"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              {entry.total_hours
                                ? `${entry.total_hours.toFixed(1)}h`
                                : "Active"}
                              {entry.project_name && (
                                <div className="text-xs opacity-75">
                                  {entry.project_name}
                                </div>
                              )}
                            </div>
                          ))}

                          {/* Daily total */}
                          {dailyHours > 0 && (
                            <div className="text-xs font-medium text-slate-700 mt-1">
                              {dailyHours.toFixed(1)}h total
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                  <td className="py-3 px-4 text-center font-medium">
                    {weeklyTotal > 0 ? `${weeklyTotal.toFixed(1)}h` : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Time Entry Modal Component
function TimeEntryModal({
  entry,
  onClose,
  onSubmit,
  teamMembers,
  projects,
  isLoading,
}) {
  const [formData, setFormData] = useState({
    team_member_id: entry?.team_member_id || "",
    project_id: entry?.project_id || "",
    clock_in_time:
      entry?.clock_in_time || new Date().toISOString().slice(0, 16),
    clock_out_time: entry?.clock_out_time || "",
    work_description: entry?.work_description || "",
    location: entry?.location || "",
    notes: entry?.notes || "",
    hourly_rate: entry?.hourly_rate || "",
    break_duration_minutes: entry?.break_duration_minutes || 0,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      team_member_id: parseInt(formData.team_member_id),
      project_id: formData.project_id ? parseInt(formData.project_id) : null,
      hourly_rate: formData.hourly_rate
        ? parseFloat(formData.hourly_rate)
        : null,
      break_duration_minutes: parseInt(formData.break_duration_minutes) || 0,
    };
    onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900">
              {entry ? "Edit Time Entry" : "Log Time Entry"}
            </h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Team Member *
              </label>
              <select
                required
                value={formData.team_member_id}
                onChange={(e) =>
                  setFormData({ ...formData, team_member_id: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              >
                <option value="">Select team member</option>
                {teamMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name} - {member.role}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Project (optional)
              </label>
              <select
                value={formData.project_id}
                onChange={(e) =>
                  setFormData({ ...formData, project_id: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              >
                <option value="">Select project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.project_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Clock In *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.clock_in_time}
                  onChange={(e) =>
                    setFormData({ ...formData, clock_in_time: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Clock Out
                </label>
                <input
                  type="datetime-local"
                  value={formData.clock_out_time}
                  onChange={(e) =>
                    setFormData({ ...formData, clock_out_time: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Break (minutes)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.break_duration_minutes}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      break_duration_minutes: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Hourly Rate
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.hourly_rate}
                  onChange={(e) =>
                    setFormData({ ...formData, hourly_rate: e.target.value })
                  }
                  placeholder="25.00"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Work Description
              </label>
              <textarea
                rows={3}
                value={formData.work_description}
                onChange={(e) =>
                  setFormData({ ...formData, work_description: e.target.value })
                }
                placeholder="What work was performed..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                placeholder="Job site address or office"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Notes
              </label>
              <textarea
                rows={2}
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Additional notes..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 resize-none"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white rounded-lg transition-colors"
              >
                {isLoading ? "Saving..." : entry ? "Update Entry" : "Log Time"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
