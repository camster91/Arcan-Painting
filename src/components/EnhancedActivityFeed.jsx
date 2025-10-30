import { useState, useEffect } from "react";
import {
  UserPlus,
  Calendar,
  FileText,
  DollarSign,
  CheckCircle,
  Clock,
  Phone,
  Mail,
  RefreshCw,
  Activity,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

export default function EnhancedActivityFeed() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("all"); // all, leads, projects, appointments

  useEffect(() => {
    fetchActivities();
  }, [filter]);

  const fetchActivities = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Simulate API call - in real app this would fetch from /api/activities
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const mockActivities = [
        {
          id: 1,
          type: "lead",
          title: "New lead submitted",
          description: "John Smith - Interior Painting",
          timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          icon: UserPlus,
          color: "bg-blue-500",
          lightColor: "bg-blue-50",
          textColor: "text-blue-600",
          priority: "high",
          actionable: true,
          leadId: 123,
        },
        {
          id: 2,
          type: "appointment",
          title: "Appointment scheduled",
          description: "Site visit with Sarah Johnson",
          timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
          icon: Calendar,
          color: "bg-green-500",
          lightColor: "bg-green-50",
          textColor: "text-green-600",
          priority: "medium",
          actionable: false,
        },
        {
          id: 3,
          type: "estimate",
          title: "Estimate approved",
          description: "$4,500 - Kitchen Cabinet Painting",
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          icon: DollarSign,
          color: "bg-amber-500",
          lightColor: "bg-amber-50",
          textColor: "text-amber-600",
          priority: "high",
          actionable: true,
          value: 4500,
        },
        {
          id: 4,
          type: "project",
          title: "Project completed",
          description: "Exterior House Painting - Mike Davis",
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          icon: CheckCircle,
          color: "bg-purple-500",
          lightColor: "bg-purple-50",
          textColor: "text-purple-600",
          priority: "medium",
          actionable: false,
        },
        {
          id: 5,
          type: "lead",
          title: "Follow-up reminder",
          description: "Contact Lisa Brown about deck staining quote",
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          icon: Clock,
          color: "bg-orange-500",
          lightColor: "bg-orange-50",
          textColor: "text-orange-600",
          priority: "medium",
          actionable: true,
          phone: "+1234567890",
        },
      ];

      // Filter activities based on selected filter
      const filteredActivities =
        filter === "all"
          ? mockActivities
          : mockActivities.filter((activity) => {
              if (filter === "leads") return activity.type === "lead";
              if (filter === "projects") return activity.type === "project";
              if (filter === "appointments")
                return activity.type === "appointment";
              return true;
            });

      setActivities(filteredActivities);
      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error("Failed to fetch activities:", error);
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchActivities(true);
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "border-l-red-500";
      case "medium":
        return "border-l-amber-500";
      case "low":
        return "border-l-green-500";
      default:
        return "border-l-slate-300";
    }
  };

  const renderActionButton = (activity) => {
    if (!activity.actionable) return null;

    switch (activity.type) {
      case "lead":
        return (
          <div className="flex gap-2 mt-3">
            {activity.phone && (
              <a
                href={`tel:${activity.phone}`}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium hover:bg-blue-200 transition-colors flex items-center gap-1"
              >
                <Phone size={10} />
                Call
              </a>
            )}
            <a
              href={`/admin/leads`}
              className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium hover:bg-slate-200 transition-colors flex items-center gap-1"
            >
              View Lead
              <ArrowRight size={10} />
            </a>
          </div>
        );

      case "estimate":
        return (
          <div className="flex gap-2 mt-3">
            <a
              href={`/admin/projects?estimate_id=${activity.id}`}
              className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium hover:bg-green-200 transition-colors flex items-center gap-1"
            >
              Start Project
              <ArrowRight size={10} />
            </a>
          </div>
        );

      default:
        return null;
    }
  };

  const getFilterCount = (filterType) => {
    if (filterType === "all") return activities.length;
    return activities.filter((activity) => activity.type === filterType).length;
  };

  if (loading && !refreshing) {
    return (
      <div className="py-6">
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <div className="h-6 bg-slate-200 rounded w-48 mb-2 animate-pulse"></div>
            <div className="h-4 bg-slate-200 rounded w-32 animate-pulse"></div>
          </div>
          <div className="p-4">
            <div className="space-y-4">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="flex space-x-3 animate-pulse">
                  <div className="w-10 h-10 bg-slate-200 rounded-lg"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                    <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      {/* Header with filters and refresh */}
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-1 flex items-center gap-2">
              <Activity size={20} />
              Activity Feed
            </h2>
            <p className="text-sm text-slate-600">Recent business activities</p>
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className={`p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors ${
              refreshing ? "animate-spin" : ""
            }`}
          >
            <RefreshCw size={18} />
          </button>
        </div>

        {/* Activity Filters */}
        <div className="flex overflow-x-auto gap-2 pb-2">
          {[
            {
              key: "all",
              label: "All Activities",
              count: getFilterCount("all"),
            },
            { key: "leads", label: "Leads", count: getFilterCount("leads") },
            {
              key: "projects",
              label: "Projects",
              count: getFilterCount("projects"),
            },
            {
              key: "appointments",
              label: "Appointments",
              count: getFilterCount("appointments"),
            },
          ].map((filterOption) => (
            <button
              key={filterOption.key}
              onClick={() => setFilter(filterOption.key)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
                filter === filterOption.key
                  ? "bg-amber-100 text-amber-800 border border-amber-200"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {filterOption.label}
              <span className="ml-1 px-1.5 py-0.5 bg-white rounded-full text-xs">
                {filterOption.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Activities List */}
      <div className="max-h-96 overflow-y-auto">
        {activities.length === 0 ? (
          <div className="p-8 text-center">
            <Activity size={48} className="text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              No activities found
            </h3>
            <p className="text-slate-600 text-sm">
              Activity will appear here as things happen in your business.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {activities.map((activity) => {
              const Icon = activity.icon;

              return (
                <div
                  key={activity.id}
                  className={`p-4 hover:bg-slate-50 transition-colors border-l-4 ${getPriorityColor(activity.priority)}`}
                >
                  <div className="flex items-start space-x-3">
                    {/* Icon */}
                    <div
                      className={`w-10 h-10 ${activity.color} rounded-lg flex items-center justify-center flex-shrink-0`}
                    >
                      <Icon size={18} className="text-white" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-slate-900 truncate">
                            {activity.title}
                          </h3>
                          <p className="text-sm text-slate-600 mt-1">
                            {activity.description}
                          </p>

                          {/* Value indicator for estimates */}
                          {activity.value && (
                            <div className="flex items-center gap-1 mt-2">
                              <TrendingUp
                                size={12}
                                className="text-green-600"
                              />
                              <span className="text-sm font-medium text-green-600">
                                ${activity.value.toLocaleString()} opportunity
                              </span>
                            </div>
                          )}

                          {/* Action buttons */}
                          {renderActionButton(activity)}
                        </div>

                        {/* Timestamp and priority */}
                        <div className="text-right flex-shrink-0">
                          <div className="text-xs text-slate-500">
                            {formatTimeAgo(activity.timestamp)}
                          </div>
                          {activity.priority === "high" && (
                            <div className="mt-1">
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                High Priority
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer with view all link */}
      {activities.length > 0 && (
        <div className="p-4 border-t border-slate-200 bg-slate-50">
          <a
            href="/admin/activities"
            className="text-amber-600 hover:text-amber-700 text-sm font-medium flex items-center justify-center gap-1"
          >
            View All Activities
            <ArrowRight size={14} />
          </a>
        </div>
      )}
    </div>
  );
}
