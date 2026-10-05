import { useState } from "react";
import MobileModal from "@/components/MobileModal";
import CustomerTimeline from "@/components/admin/leads/CustomerTimeline";
import {
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  Clock,
  User,
  Edit,
  FileText,
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
    { id: "timeline", label: "Timeline", icon: Clock },
  ];

  return (
    <MobileModal isOpen={isOpen} onClose={onClose} title={lead.name} footer={
        <div className="bg-white">
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
    }>
      <p className={`inline-block rounded-full border px-3 py-1 text-sm ${getStatusColor(lead.status)}`}>{String(lead.status || "new").replaceAll("_", " ")}</p>
          {/* Tab Navigation */}
          <div className="flex flex-wrap mt-4 border-b border-slate-100">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  aria-pressed={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 min-h-11 py-2 text-sm font-medium border-b-2 transition-colors ${
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
        {/* Content */}
        <div className="min-w-0">
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
                        Job description
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

              {lead.notes && <section className="rounded-lg bg-slate-50 p-3"><h3 className="text-sm font-medium text-slate-800">Legacy notes</h3><p className="text-sm text-slate-600 whitespace-pre-wrap break-words">{lead.notes}</p><p className="text-xs text-slate-500 mt-2">Author and note timestamp were not recorded.</p></section>}

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

          {activeTab === "timeline" && (
            <div className="p-6">
              <CustomerTimeline key={lead.id} leadId={lead.id} />
            </div>
          )}
        </div>


    </MobileModal>
  );
}
