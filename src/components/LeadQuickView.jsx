import { useState } from "react";
import {
  X,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  Clock,
  User,
  Edit,
  MessageSquare,
  FileText,
  Plus,
} from "lucide-react";

export default function LeadQuickView({ lead, isOpen, onClose, onAction }) {
  const [activeTab, setActiveTab] = useState("details");

  if (!isOpen || !lead) return null;

  const getStatusColor = (status) => {
    const colors = {
      new: "bg-blue-100 text-blue-800 border-blue-200",
      contacted: "bg-yellow-100 text-yellow-800 border-yellow-200",
      estimate_scheduled: "bg-purple-100 text-purple-800 border-purple-200",
      estimate_sent: "bg-orange-100 text-orange-800 border-orange-200",
      follow_up: "bg-amber-100 text-amber-800 border-amber-200",
      won: "bg-green-100 text-green-800 border-green-200",
      lost: "bg-red-100 text-red-800 border-red-200",
    };
    return colors[status] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const tabs = [
    { id: "details", label: "Details", icon: User },
    { id: "notes", label: "Notes", icon: FileText },
    { id: "timeline", label: "Timeline", icon: Clock },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end lg:items-center justify-center p-0 lg:p-4">
      {/* Mobile slide-up modal */}
      <div className="bg-white w-full max-h-[90vh] lg:max-w-2xl lg:rounded-2xl overflow-hidden animate-in slide-in-from-bottom duration-300 lg:animate-in lg:fade-in lg:zoom-in-95">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                <User size={20} className="text-slate-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {lead.name}
                </h2>
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(lead.status)}`}
                >
                  {lead.status.replace("_", " ")}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex mt-4 border-b border-slate-100">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? "border-amber-500 text-amber-600"
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)] lg:max-h-[60vh]">
          {/* Details Tab */}
          {activeTab === "details" && (
            <div className="p-6 space-y-6">
              {/* Contact Information */}
              <div>
                <h3 className="text-sm font-medium text-slate-700 mb-3">
                  Contact Information
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                      <Mail size={16} className="text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">
                        {lead.email}
                      </p>
                      <p className="text-xs text-slate-500">Email Address</p>
                    </div>
                    <button
                      onClick={() =>
                        (window.location.href = `mailto:${lead.email}`)
                      }
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Mail size={14} />
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                      <Phone size={16} className="text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">
                        {lead.phone}
                      </p>
                      <p className="text-xs text-slate-500">Phone Number</p>
                    </div>
                    <button
                      onClick={() =>
                        (window.location.href = `tel:${lead.phone}`)
                      }
                      className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    >
                      <Phone size={14} />
                    </button>
                  </div>

                  {lead.address && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center">
                        <MapPin size={16} className="text-slate-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900">
                          {lead.address}
                        </p>
                        <p className="text-xs text-slate-500">
                          Project Address
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Project Information */}
              <div>
                <h3 className="text-sm font-medium text-slate-700 mb-3">
                  Project Information
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        Service Type
                      </p>
                      <p className="text-xs text-slate-500">
                        {lead.service_type}
                      </p>
                    </div>
                    {lead.estimated_value && (
                      <div className="text-right">
                        <p className="text-sm font-semibold text-green-600 flex items-center gap-1">
                          <DollarSign size={12} />
                          {lead.estimated_value.toLocaleString()}
                        </p>
                        <p className="text-xs text-slate-500">
                          Estimated Value
                        </p>
                      </div>
                    )}
                  </div>

                  {lead.project_description && (
                    <div>
                      <p className="text-xs font-medium text-slate-700 mb-2">
                        Project Description
                      </p>
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-sm text-slate-700">
                          {lead.project_description}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Timeline */}
              <div>
                <h3 className="text-sm font-medium text-slate-700 mb-3">
                  Timeline
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                      <Calendar size={16} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        Lead Created
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatDate(lead.created_at)}
                      </p>
                    </div>
                  </div>

                  {lead.follow_up_date && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
                        <Clock size={16} className="text-amber-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          Follow-up Scheduled
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatDate(lead.follow_up_date)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Notes Tab */}
          {activeTab === "notes" && (
            <div className="p-6">
              <div className="space-y-4">
                {lead.notes ? (
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">
                      {lead.notes}
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText
                      size={32}
                      className="text-slate-300 mx-auto mb-2"
                    />
                    <p className="text-slate-500">No notes yet</p>
                    <button
                      onClick={() => onAction("add_note", lead)}
                      className="mt-2 text-sm text-amber-600 hover:text-amber-700 font-medium"
                    >
                      Add a note
                    </button>
                  </div>
                )}

                <button
                  onClick={() => onAction("edit_notes", lead)}
                  className="w-full p-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 hover:border-amber-300 hover:text-amber-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus size={16} />
                  Add Note
                </button>
              </div>
            </div>
          )}

          {/* Timeline Tab */}
          {activeTab === "timeline" && (
            <div className="p-6">
              <div className="space-y-4">
                {/* Timeline items would come from a real activity log */}
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <User size={14} className="text-green-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-900">
                        Lead created
                      </p>
                      <span className="text-xs text-slate-500">
                        {formatDate(lead.created_at)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Customer submitted inquiry via website
                    </p>
                  </div>
                </div>

                {/* Placeholder for more timeline items */}
                <div className="text-center py-8">
                  <Clock size={32} className="text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-500">
                    Timeline will show activity history
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="sticky bottom-0 bg-white border-t border-slate-200 p-6">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => onAction("call", lead)}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Phone size={16} />
              Call
            </button>

            <button
              onClick={() => onAction("email", lead)}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Mail size={16} />
              Email
            </button>

            <button
              onClick={() => onAction("estimate", lead)}
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-white px-4 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
            >
              <FileText size={16} />
              Estimate
            </button>
          </div>

          <button
            onClick={() => onAction("edit", lead)}
            className="w-full mt-3 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Edit size={16} />
            Edit Lead Details
          </button>
        </div>
      </div>
    </div>
  );
}
