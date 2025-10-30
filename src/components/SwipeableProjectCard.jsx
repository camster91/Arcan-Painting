import { useState, useRef, useEffect } from "react";
import {
  Calendar,
  Clock,
  User,
  DollarSign,
  MoreVertical,
  CheckCircle2,
  Pause,
  Play,
  X,
  BarChart3,
} from "lucide-react";

export default function SwipeableProjectCard({
  project,
  onStatusUpdate,
  onViewDetails,
  onViewProgress,
  onViewWorkflows,
}) {
  const [isSwipeRevealed, setIsSwipeRevealed] = useState(false);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const cardRef = useRef(null);

  const swipeThreshold = 80; // Minimum swipe distance to reveal actions

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (cardRef.current && !cardRef.current.contains(event.target)) {
        setIsSwipeRevealed(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousemove", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const handleTouchStart = (e) => {
    setStartX(e.touches[0].clientX);
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const currentPosition = e.touches[0].clientX;
    setCurrentX(currentPosition - startX);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (Math.abs(currentX) > swipeThreshold) {
      setIsSwipeRevealed(currentX < 0); // Swipe left reveals actions
    } else {
      setIsSwipeRevealed(false);
    }
    setCurrentX(0);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "in_progress":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "paused":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not set";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const getDaysRemaining = (endDate) => {
    if (!endDate) return null;
    const end = new Date(endDate);
    const today = new Date();
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
    if (diffDays === 0) return "Due today";
    return `${diffDays}d left`;
  };

  const getQuickActions = () => {
    const actions = [];

    // Always show Progress and Workflows as they're core features
    actions.push({
      icon: BarChart3,
      label: "Progress",
      color: "bg-blue-500",
      action: () => onViewProgress?.(project),
    });

    actions.push({
      icon: CheckCircle2,
      label: "Checklist",
      color: "bg-amber-500",
      action: () => onViewWorkflows?.(project),
    });

    // Add status-specific actions if there's room
    if (project.status === "scheduled") {
      actions.push({
        icon: Play,
        label: "Start",
        color: "bg-green-500",
        action: () => onStatusUpdate?.(project.id, "in_progress"),
      });
    } else if (project.status === "in_progress") {
      actions.push({
        icon: Pause,
        label: "Pause",
        color: "bg-slate-500",
        action: () => onStatusUpdate?.(project.id, "paused"),
      });
    } else if (project.status === "paused") {
      actions.push({
        icon: Play,
        label: "Resume",
        color: "bg-green-500",
        action: () => onStatusUpdate?.(project.id, "in_progress"),
      });
    } else {
      // For completed/cancelled, show details
      actions.push({
        icon: MoreVertical,
        label: "Details",
        color: "bg-slate-500",
        action: () => onViewDetails?.(project.id),
      });
    }

    return actions.slice(0, 3); // Max 3 actions to fit
  };

  const daysRemaining = getDaysRemaining(project.end_date);
  const isOverdue = daysRemaining && daysRemaining.includes("overdue");
  const isDueToday = daysRemaining === "Due today";
  const quickActions = getQuickActions();

  return (
    <div
      ref={cardRef}
      className="relative overflow-hidden bg-white border border-slate-200 rounded-lg mb-3"
    >
      {/* Swipe Actions Background */}
      {isSwipeRevealed && (
        <div className="absolute right-0 top-0 bottom-0 flex items-center bg-slate-50 px-2">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={() => {
                action.action();
                setIsSwipeRevealed(false);
              }}
              className={`${action.color} text-white p-3 rounded-lg mx-1 flex flex-col items-center justify-center min-w-[60px] h-[60px]`}
            >
              <action.icon size={20} />
              <span className="text-xs mt-1">{action.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Main Card Content */}
      <div
        className={`p-4 transition-transform duration-200 ease-out ${
          isSwipeRevealed ? "-translate-x-48" : ""
        }`}
        style={{
          transform: isDragging
            ? `translateX(${Math.min(0, currentX)}px)`
            : undefined,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Project Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 truncate">
              {project.project_name}
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              {project.lead_name || "No client assigned"}
            </p>
          </div>
          <div className="flex items-center gap-2 ml-3">
            <span
              className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(project.status)}`}
            >
              {project.status.replace("_", " ").toUpperCase()}
            </span>
            {(isOverdue || isDueToday) && (
              <div
                className={`w-2 h-2 rounded-full ${isOverdue ? "bg-red-500" : "bg-amber-500"}`}
              />
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-slate-600 mb-2">
            <span>Progress</span>
            <span>{project.completion_percentage || 0}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                project.status === "completed"
                  ? "bg-green-500"
                  : project.status === "in_progress"
                    ? "bg-amber-500"
                    : "bg-slate-300"
              }`}
              style={{ width: `${project.completion_percentage || 0}%` }}
            />
          </div>
        </div>

        {/* Project Details Grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-slate-400 flex-shrink-0" />
            <div>
              <div className="text-slate-600">
                {formatDate(project.start_date)} -{" "}
                {formatDate(project.end_date)}
              </div>
              {daysRemaining && (
                <div
                  className={`text-xs font-medium ${
                    isOverdue
                      ? "text-red-600"
                      : isDueToday
                        ? "text-amber-600"
                        : "text-slate-500"
                  }`}
                >
                  {daysRemaining}
                </div>
              )}
            </div>
          </div>

          {project.assigned_painter_name && (
            <div className="flex items-center gap-2">
              <User size={14} className="text-slate-400 flex-shrink-0" />
              <span className="text-slate-600 truncate">
                {project.assigned_painter_name}
              </span>
            </div>
          )}

          {project.final_cost && (
            <div className="flex items-center gap-2">
              <DollarSign size={14} className="text-slate-400 flex-shrink-0" />
              <span className="text-slate-900 font-semibold">
                ${parseFloat(project.final_cost).toLocaleString()}
              </span>
            </div>
          )}

          {project.estimated_duration_days && (
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-slate-400 flex-shrink-0" />
              <span className="text-slate-600">
                {project.estimated_duration_days} days
              </span>
            </div>
          )}
        </div>

        {/* Mobile hint for swipe */}
        <div className="flex items-center justify-center mt-3 pt-3 border-t border-slate-100 lg:hidden">
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <span>← Swipe for quick actions</span>
          </div>
        </div>
      </div>
    </div>
  );
}
