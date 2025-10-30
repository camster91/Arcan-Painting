import { useState } from "react";
import {
  User,
  Mail,
  Phone,
  DollarSign,
  Calendar,
  Award,
  MoreVertical,
  Edit,
  UserX,
  ArrowRight,
  MapPin,
  Clock,
} from "lucide-react";

export default function TeamMemberCard({
  member,
  onEdit,
  onDeactivate,
  onViewDetails,
}) {
  const [showActions, setShowActions] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Handle card click - could open detailed view in the future
  const handleCardClick = () => {
    if (onViewDetails) {
      onViewDetails(member);
    }
  };

  // Get role color
  const getRoleColor = (role) => {
    const colors = {
      painter: "bg-blue-100 text-blue-800 border-blue-200",
      lead_painter: "bg-purple-100 text-purple-800 border-purple-200",
      supervisor: "bg-amber-100 text-amber-800 border-amber-200",
      manager: "bg-green-100 text-green-800 border-green-200",
    };
    return colors[role] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  // Get status color
  const getStatusColor = (status) => {
    const colors = {
      active: "bg-green-100 text-green-800 border-green-200",
      inactive: "bg-red-100 text-red-800 border-red-200",
    };
    return colors[status] || "bg-green-100 text-green-800 border-green-200";
  };

  // Format hire date
  const formatHireDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffYears > 0)
      return `${diffYears} year${diffYears > 1 ? "s" : ""} ago`;
    if (diffMonths > 0)
      return `${diffMonths} month${diffMonths > 1 ? "s" : ""} ago`;
    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    return "Today";
  };

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
      {/* Status indicator */}
      <div
        className={`absolute top-4 right-4 w-3 h-3 rounded-full ${
          member.status === "inactive" ? "bg-red-500" : "bg-green-500"
        }`}
      />

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
              <User size={16} className="text-slate-600" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 truncate">
                {member.name}
              </h3>
              <p className="text-sm text-slate-500">Team Member</p>
            </div>
          </div>

          {/* Role & Status Badges */}
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getRoleColor(member.role)}`}
            >
              {member.role.replace("_", " ")}
            </span>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(member.status || "active")}`}
            >
              {member.status || "active"}
            </span>
          </div>
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

      {/* Contact Info */}
      <div className="space-y-3 mb-4 relative z-10">
        <div className="flex items-center gap-3 text-sm text-slate-600">
          <Mail size={14} className="text-slate-400" />
          <span className="truncate font-medium">{member.email}</span>
        </div>
        {member.phone && (
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <Phone size={14} className="text-slate-400" />
            <span className="font-medium">{member.phone}</span>
          </div>
        )}
      </div>

      {/* Rate & Hire Info */}
      <div className="grid grid-cols-2 gap-4 mb-4 relative z-10">
        {member.hourly_rate && (
          <div className="bg-green-50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign size={14} className="text-green-600" />
              <span className="text-sm font-medium text-green-700">Rate</span>
            </div>
            <p className="text-lg font-bold text-green-900">
              ${member.hourly_rate}/hr
            </p>
          </div>
        )}

        {member.hire_date && (
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Calendar size={14} className="text-blue-600" />
              <span className="text-sm font-medium text-blue-700">Hired</span>
            </div>
            <p className="text-sm font-bold text-blue-900">
              {formatHireDate(member.hire_date)}
            </p>
          </div>
        )}
      </div>

      {/* Specialties */}
      {member.specialties && (
        <div className="mb-4 relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Award size={14} className="text-slate-400" />
            <span className="text-sm font-medium text-slate-700">
              Specialties
            </span>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            {member.specialties}
          </p>
        </div>
      )}

      {/* Notes Preview */}
      {member.notes && (
        <div className="mb-4 relative z-10">
          <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
            {member.notes.length > 100
              ? `${member.notes.substring(0, 100)}...`
              : member.notes}
          </p>
        </div>
      )}

      {/* Quick Actions on Hover */}
      <div
        className={`flex items-center gap-2 mb-4 transition-all duration-200 relative z-10 ${
          isHovered ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"
        }`}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            window.location.href = `mailto:${member.email}`;
          }}
          className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          title="Send Email"
        >
          <Mail size={16} />
        </button>
        {member.phone && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              window.location.href = `tel:${member.phone}`;
            }}
            className="p-2 text-slate-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            title="Call"
          >
            <Phone size={16} />
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(member);
          }}
          className="p-2 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
          title="Edit"
        >
          <Edit size={16} />
        </button>
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
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(member);
              setShowActions(false);
            }}
            className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3"
          >
            <Edit size={14} />
            Edit Member
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              window.location.href = `mailto:${member.email}`;
              setShowActions(false);
            }}
            className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3"
          >
            <Mail size={14} />
            Send Email
          </button>
          {member.phone && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                window.location.href = `tel:${member.phone}`;
                setShowActions(false);
              }}
              className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3"
            >
              <Phone size={14} />
              Call
            </button>
          )}
          {member.status !== "inactive" && (
            <>
              <div className="border-t border-slate-100 my-1" />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeactivate(member.id);
                  setShowActions(false);
                }}
                className="w-full text-left px-4 py-3 text-sm text-red-700 hover:bg-red-50 flex items-center gap-3"
              >
                <UserX size={14} />
                Deactivate
              </button>
            </>
          )}
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
