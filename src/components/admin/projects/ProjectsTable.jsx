import { Eye, Users, BarChart3, CheckCircle2 } from "lucide-react";
import {
  getStatusInfo,
  getProgressColor,
  formatDate,
  formatCurrency,
  calculateDuration,
} from "@/utils/projectsUtils";

export default function ProjectsTable({
  projects,
  onSelectProject,
  onViewProgress,
  onViewWorkflows,
}) {
  return (
    <div className="hidden lg:block bg-white rounded-lg border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left py-3 px-4 font-medium text-slate-900">
                Project
              </th>
              <th className="text-left py-3 px-4 font-medium text-slate-900">
                Customer
              </th>
              <th className="text-left py-3 px-4 font-medium text-slate-900">
                Status
              </th>
              <th className="text-left py-3 px-4 font-medium text-slate-900">
                Progress
              </th>
              <th className="text-left py-3 px-4 font-medium text-slate-900">
                Crew
              </th>
              <th className="text-left py-3 px-4 font-medium text-slate-900">
                Timeline
              </th>
              <th className="text-left py-3 px-4 font-medium text-slate-900">
                Value
              </th>
              <th className="text-left py-3 px-4 font-medium text-slate-900">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {projects.map((project) => {
              const statusInfo = getStatusInfo(project.status);
              const StatusIcon = statusInfo.icon;

              return (
                <tr key={project.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium text-slate-900">
                        {project.project_name}
                      </p>
                      {project.actual_duration_days && (
                        <p className="text-sm text-slate-500">
                          {project.actual_duration_days} days actual
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium text-slate-900">
                        {project.lead_name || "N/A"}
                      </p>
                      {project.lead_email && (
                        <p className="text-sm text-slate-500">
                          {project.lead_email}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusInfo.color}`}
                    >
                      <StatusIcon size={12} />
                      {statusInfo.label}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(project.completion_percentage)}`}
                          style={{
                            width: `${Math.min(project.completion_percentage || 0, 100)}%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-slate-600 min-w-[40px]">
                        {project.completion_percentage || 0}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1">
                      <Users size={14} className="text-slate-400" />
                      <span className="text-sm text-slate-600">
                        {project.crew_assigned || "Unassigned"}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm text-slate-600">
                      <p>Start: {formatDate(project.start_date)}</p>
                      <p>End: {formatDate(project.end_date)}</p>
                      {project.start_date && project.end_date && (
                        <p className="text-xs text-slate-500">
                          {calculateDuration(
                            project.start_date,
                            project.end_date,
                          )}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-slate-900">
                      {formatCurrency(project.final_cost)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onViewProgress?.(project)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-1 rounded transition-colors"
                        title="Progress Reports"
                      >
                        <BarChart3 size={14} />
                      </button>
                      <button
                        onClick={() => onViewWorkflows?.(project)}
                        className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 p-1 rounded transition-colors"
                        title="Completion Checklist"
                      >
                        <CheckCircle2 size={14} />
                      </button>
                      <button
                        onClick={() => onSelectProject(project)}
                        className="text-slate-600 hover:text-slate-700 hover:bg-slate-100 p-1 rounded transition-colors"
                        title="View Details"
                      >
                        <Eye size={14} />
                      </button>
                    </div>
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
