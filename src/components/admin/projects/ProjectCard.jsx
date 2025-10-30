import { useState } from "react";
import {
  Briefcase,
  DollarSign,
  Calendar,
  Clock,
  MoreVertical,
  Edit,
  Play,
  Pause,
  CheckCircle,
  Trash2,
  ArrowRight,
  User,
  Users,
  Target,
  BarChart3,
  CheckCircle2,
} from "lucide-react";
import {
  getStatusInfo,
  getProgressColor,
  formatDate,
  formatCurrency,
  calculateDuration,
} from "@/utils/projectsUtils";

export default function ProjectCard({
  project,
  onSelectProject,
  onAction,
  onStatusUpdate,
  onViewProgress,
  onViewWorkflows,
}) {
  const [showActions, setShowActions] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const statusInfo = getStatusInfo(project.status);
  const StatusIcon = statusInfo.icon;

  // Handle card click - open detailed view
  const handleCardClick = () => {
    onSelectProject(project);
  };

  // Get priority indicator based on status and timeline
  const getPriorityIndicator = (project) => {
    if (project.status === "cancelled") return "low";
    if (project.end_date && new Date(project.end_date) <= new Date())
      return "urgent";
    if (project.status === "in_progress") return "high";
    if (project.status === "paused") return "urgent";
    return "normal";
  };

  const priority = getPriorityIndicator(project);

  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 p-5 transition-all duration-200 cursor-pointer group relative overflow-hidden ${
        isHovered
          ? "shadow-xl scale-105 border-amber-300"
          : "shadow-md hover:shadow-lg"
      }`}
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Priority indicator */}
      {priority === "urgent" && (
        <div className="absolute top-4 right-4 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
      )}
      {priority === "high" && (
        <div className="absolute top-4 right-4 w-3 h-3 bg-amber-500 rounded-full" />
      )}

      {/* Hover overlay */}
      <div
        className={`absolute inset-0 bg-gradient-to-br from-amber-500/5 to-yellow-500/5 transition-opacity duration-200 ${
          isHovered ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Header */}
      <div className="flex items-start justify-between mb-4 relative z-10">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-slate-100 rounded-lg p-2">
              <Briefcase size={16} className="text-slate-600" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 truncate">
                {project.project_name}
              </h3>
              <p className="text-sm text-slate-500">
                {project.lead_name || "No customer assigned"}
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <span
            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${statusInfo.color}`}
          >
            <StatusIcon size={12} />
            {statusInfo.label}
          </span>
        </div>

        {/* Actions Menu Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowActions(!showActions);
          }}
          className={`p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-all duration-200 ${
            isHovered ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          }`}
        >
          <MoreVertical size={18} />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mb-4 relative z-10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700">Progress</span>
          <span className="text-sm font-bold text-slate-900">
            {project.completion_percentage || 0}%
          </span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${getProgressColor(project.completion_percentage)}`}
            style={{
              width: `${Math.min(project.completion_percentage || 0, 100)}%`,
            }}
          ></div>
        </div>
      </div>

      {/* Key Info Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4 relative z-10">
        <div className="bg-green-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign size={14} className="text-green-600" />
            <span className="text-sm font-medium text-green-700">Value</span>
          </div>
          <p className="text-lg font-bold text-green-900">
            {formatCurrency(project.final_cost)}
          </p>
        </div>

        <div className="bg-blue-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Users size={14} className="text-blue-600" />
            <span className="text-sm font-medium text-blue-700">Crew</span>
          </div>
          <p className="text-sm font-bold text-blue-900 truncate">
            {project.crew_assigned || "Unassigned"}
          </p>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-2 mb-4 relative z-10">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1 text-slate-600">
            <Calendar size={12} />
            <span>Start:</span>
          </div>
          <span className="font-medium text-slate-900">
            {formatDate(project.start_date)}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1 text-slate-600">
            <Target size={12} />
            <span>End:</span>
          </div>
          <span className="font-medium text-slate-900">
            {formatDate(project.end_date)}
          </span>
        </div>
        {project.start_date && project.end_date && (
          <div className="text-xs text-slate-500 text-center pt-1 border-t border-slate-100">
            Duration: {calculateDuration(project.start_date, project.end_date)}
          </div>
        )}
      </div>

      {/* Customer Info */}
      {project.lead_email && (
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-4 relative z-10">
          <User size={10} />
          <span className="truncate">{project.lead_email}</span>
        </div>
      )}

      {/* Quick Status Actions on Hover */}
      <div
        className={`flex items-center gap-2 mb-4 transition-all duration-200 relative z-10 ${
          isHovered ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"
        }`}
      >
        {project.status === "scheduled" && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onStatusUpdate?.(project.id, "in_progress");
            }}
            className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium hover:bg-green-200 transition-colors"
          >
            <Play size={10} />
            Start
          </button>
        )}
        {project.status === "in_progress" && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStatusUpdate?.(project.id, "paused");
              }}
              className="flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium hover:bg-amber-200 transition-colors"
            >
              <Pause size={10} />
              Pause
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStatusUpdate?.(project.id, "completed");
              }}
              className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium hover:bg-green-200 transition-colors"
            >
              <CheckCircle size={10} />
              Complete
            </button>
          </>
        )}
        {project.status === "paused" && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onStatusUpdate?.(project.id, "in_progress");
            }}
            className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium hover:bg-green-200 transition-colors"
          >
            <Play size={10} />
            Resume
          </button>
        )}
      </div>

      {/* Click indicator */}
      <div className="flex items-center justify-end pt-4 border-t border-slate-100 relative z-10">
        {/* Click to view indicator */}
        <div
          className={`flex items-center gap-2 text-amber-600 font-medium transition-all duration-200 ${
            isHovered ? "opacity-100 translate-x-0" : "opacity-60 translate-x-2"
          }`}
        >
          <span className="text-sm">View Details</span>
          <ArrowRight
            size={16}
            className={`transition-transform duration-200 ${
              isHovered ? "translate-x-1" : ""
            }`}
          />
        </div>
      </div>

      {/* Dropdown Actions Menu */}
      {showActions && (
        <div className="absolute top-16 right-4 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-30 min-w-[160px]">
          {/* Add new progress and workflow actions at the top */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewProgress?.(project);
              setShowActions(false);
            }}
            className="w-full text-left px-4 py-3 text-sm text-blue-700 hover:bg-blue-50 flex items-center gap-3"
          >
            <BarChart3 size={14} />
            Progress Reports
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewWorkflows?.(project);
              setShowActions(false);
            }}
            className="w-full text-left px-4 py-3 text-sm text-amber-700 hover:bg-amber-50 flex items-center gap-3"
          >
            <CheckCircle2 size={14} />
            Completion Checklist
          </button>
          <div className="border-t border-slate-100 my-1" />

          {/* Existing actions */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAction?.("edit", project);
              setShowActions(false);
            }}
            className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3"
          >
            <Edit size={14} />
            Edit Project
          </button>
          {project.status === "scheduled" && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStatusUpdate?.(project.id, "in_progress");
                setShowActions(false);
              }}
              className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3"
            >
              <Play size={14} />
              Start Project
            </button>
          )}
          {project.status === "in_progress" && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onStatusUpdate?.(project.id, "paused");
                  setShowActions(false);
                }}
                className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3"
              >
                <Pause size={14} />
                Pause Project
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onStatusUpdate?.(project.id, "completed");
                  setShowActions(false);
                }}
                className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3"
              >
                <CheckCircle size={14} />
                Mark Complete
              </button>
            </>
          )}
          {project.status === "paused" && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStatusUpdate?.(project.id, "in_progress");
                setShowActions(false);
              }}
              className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3"
            >
              <Play size={14} />
              Resume Project
            </button>
          )}
          <div className="border-t border-slate-100 my-1" />
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAction?.("delete", project);
              setShowActions(false);
            }}
            className="w-full text-left px-4 py-3 text-sm text-red-700 hover:bg-red-50 flex items-center gap-3"
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      )}

      {/* Backdrop to close actions menu */}
      {showActions && (
        <div
          className="fixed inset-0 z-20"
          onClick={() => setShowActions(false)}
        />
      )}
    </div>
  );
}
