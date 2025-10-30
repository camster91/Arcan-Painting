import { useState, useRef, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  MapPin,
  User,
} from "lucide-react";

export default function TimelineCarousel({ projects = [] }) {
  const scrollRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const checkScrollButtons = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScrollButtons();
    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener("scroll", checkScrollButtons);
      return () =>
        scrollElement.removeEventListener("scroll", checkScrollButtons);
    }
  }, [projects]);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 280; // width of card + gap
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
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
      year: "numeric",
    });
  };

  const getDaysRemaining = (endDate) => {
    if (!endDate) return null;
    const end = new Date(endDate);
    const today = new Date();
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
    if (diffDays === 0) return "Due today";
    if (diffDays === 1) return "1 day left";
    return `${diffDays} days left`;
  };

  if (projects.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
        <Calendar size={48} className="text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500">No projects scheduled</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900">
          Project Timeline
        </h3>
        <div className="flex items-center gap-2">
          {showLeftArrow && (
            <button
              onClick={() => scroll("left")}
              className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
            >
              <ChevronLeft size={18} className="text-slate-600" />
            </button>
          )}
          {showRightArrow && (
            <button
              onClick={() => scroll("right")}
              className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
            >
              <ChevronRight size={18} className="text-slate-600" />
            </button>
          )}
        </div>
      </div>

      {/* Scrollable Timeline */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {projects.map((project) => {
          const daysRemaining = getDaysRemaining(project.end_date);
          const isOverdue = daysRemaining && daysRemaining.includes("overdue");
          const isDueToday = daysRemaining === "Due today";

          return (
            <div
              key={project.id}
              className="flex-none w-72 bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              {/* Project Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-slate-900 truncate">
                    {project.project_name}
                  </h4>
                  <p className="text-sm text-slate-500 mt-1">
                    {project.lead_name || "No client assigned"}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(project.status)}`}
                >
                  {project.status.replace("_", " ").toUpperCase()}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs text-slate-600 mb-2">
                  <span>Progress</span>
                  <span>{project.completion_percentage || 0}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-amber-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${project.completion_percentage || 0}%` }}
                  />
                </div>
              </div>

              {/* Project Details */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar
                    size={14}
                    className="text-slate-400 flex-shrink-0"
                  />
                  <span className="text-slate-600">
                    {formatDate(project.start_date)} -{" "}
                    {formatDate(project.end_date)}
                  </span>
                </div>

                {project.assigned_painter_name && (
                  <div className="flex items-center gap-2 text-sm">
                    <User size={14} className="text-slate-400 flex-shrink-0" />
                    <span className="text-slate-600">
                      {project.assigned_painter_name}
                    </span>
                  </div>
                )}

                {daysRemaining && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock size={14} className="text-slate-400 flex-shrink-0" />
                    <span
                      className={`font-medium ${
                        isOverdue
                          ? "text-red-600"
                          : isDueToday
                            ? "text-amber-600"
                            : "text-slate-600"
                      }`}
                    >
                      {daysRemaining}
                    </span>
                  </div>
                )}

                {project.final_cost && (
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-sm text-slate-500">Final Cost</span>
                    <span className="text-sm font-semibold text-slate-900">
                      ${parseFloat(project.final_cost).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100">
                <button className="flex-1 px-3 py-2 text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg transition-colors">
                  View Details
                </button>
                {project.status === "in_progress" && (
                  <button className="flex-1 px-3 py-2 text-xs bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg transition-colors">
                    Update Progress
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Custom scrollbar hide styles */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
