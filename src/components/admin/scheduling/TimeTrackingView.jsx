import { useState, useMemo } from "react";
import {
  Clock,
  User,
  MapPin,
  Play,
  Square,
  Edit3,
  CheckCircle,
} from "lucide-react";

export default function TimeTrackingView({
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
