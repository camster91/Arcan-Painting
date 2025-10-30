import { useState } from "react";
import {
  FileText,
  DollarSign,
  Calendar,
  Clock,
  MoreVertical,
  Edit,
  Send,
  Download,
  Trash2,
  ArrowRight,
  User,
  Building,
} from "lucide-react";
import {
  getStatusInfo,
  formatCurrency,
  formatDate,
} from "@/utils/estimatesUtils";

export function EstimateCard({ estimate, onViewEstimate, onAction }) {
  const [showActions, setShowActions] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const statusInfo = getStatusInfo(estimate.status);
  const StatusIcon = statusInfo.icon;

  // Handle card click - open detailed view
  const handleCardClick = () => {
    onViewEstimate(estimate);
  };

  // Get priority indicator based on status and dates
  const getPriorityIndicator = (estimate) => {
    if (estimate.status === "draft") return "normal";
    if (estimate.status === "expired") return "low";
    if (estimate.valid_until && new Date(estimate.valid_until) <= new Date())
      return "urgent";
    if (estimate.status === "sent") return "high";
    return "normal";
  };

  const priority = getPriorityIndicator(estimate);

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
              <FileText size={16} className="text-slate-600" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 truncate">
                {estimate.estimate_number}
              </h3>
              <p className="text-sm text-slate-500">{estimate.project_title}</p>
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

      {/* Value & Duration */}
      <div className="grid grid-cols-2 gap-4 mb-4 relative z-10">
        <div className="bg-green-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign size={14} className="text-green-600" />
            <span className="text-sm font-medium text-green-700">
              Total Value
            </span>
          </div>
          <p className="text-lg font-bold text-green-900">
            {formatCurrency(estimate.total_cost)}
          </p>
        </div>

        {estimate.estimated_duration_days && (
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Clock size={14} className="text-blue-600" />
              <span className="text-sm font-medium text-blue-700">
                Duration
              </span>
            </div>
            <p className="text-lg font-bold text-blue-900">
              {estimate.estimated_duration_days} days
            </p>
          </div>
        )}
      </div>

      {/* Cost Breakdown */}
      <div className="space-y-2 mb-4 relative z-10">
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-600">Labor Cost:</span>
          <span className="font-medium text-slate-900">
            {formatCurrency(estimate.labor_cost)}
          </span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-600">Material Cost:</span>
          <span className="font-medium text-slate-900">
            {formatCurrency(estimate.material_cost)}
          </span>
        </div>
      </div>

      {/* Dates */}
      <div className="flex items-center justify-between text-sm text-slate-500 mb-4 relative z-10">
        <div className="flex items-center gap-1">
          <Calendar size={12} />
          <span>Created {formatDate(estimate.created_at)}</span>
        </div>
        {estimate.valid_until && (
          <div className="flex items-center gap-1 text-amber-600 font-medium">
            <Clock size={12} />
            <span>Valid until {formatDate(estimate.valid_until)}</span>
          </div>
        )}
      </div>

      {/* Project Description Preview */}
      {estimate.project_description && (
        <div className="mb-4 relative z-10">
          <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
            {estimate.project_description.length > 120
              ? `${estimate.project_description.substring(0, 120)}...`
              : estimate.project_description}
          </p>
        </div>
      )}

      {/* Creator Info */}
      {estimate.created_by && (
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-4 relative z-10">
          <User size={10} />
          <span>Created by {estimate.created_by}</span>
        </div>
      )}

      {/* Click indicator */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-100 relative z-10">
        {/* Quick action buttons - appear on hover */}
        <div
          className={`flex items-center gap-1 transition-all duration-200 ${
            isHovered ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"
          }`}
        >
          {estimate.status === "draft" && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAction?.("send", estimate);
              }}
              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Send Estimate"
            >
              <Send size={16} />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAction?.("download", estimate);
            }}
            className="p-2 text-slate-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            title="Download PDF"
          >
            <Download size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAction?.("edit", estimate);
            }}
            className="p-2 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
            title="Edit"
          >
            <Edit size={16} />
          </button>
        </div>

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
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAction?.("edit", estimate);
              setShowActions(false);
            }}
            className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3"
          >
            <Edit size={14} />
            Edit Estimate
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAction?.("duplicate", estimate);
              setShowActions(false);
            }}
            className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3"
          >
            <FileText size={14} />
            Duplicate
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAction?.("download", estimate);
              setShowActions(false);
            }}
            className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3"
          >
            <Download size={14} />
            Download PDF
          </button>
          {estimate.status === "draft" && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAction?.("send", estimate);
                setShowActions(false);
              }}
              className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3"
            >
              <Send size={14} />
              Send to Client
            </button>
          )}
          <div className="border-t border-slate-100 my-1" />
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAction?.("delete", estimate);
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
