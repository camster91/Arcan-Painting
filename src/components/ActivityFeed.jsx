import { useState, useEffect } from "react";
import {
  UserPlus,
  Calendar,
  FileText,
  CheckCircle,
  Clock,
  Phone,
  Mail,
  RefreshCw,
} from "lucide-react";

export default function ActivityFeed() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchActivities = async () => {
    try {
      // This would be a real API call in practice
      // For now, simulating with sample data
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const sampleActivities = [
        {
          id: 1,
          type: "lead",
          title: "New lead received",
          description: "Sarah Johnson requested interior painting estimate",
          timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
          icon: UserPlus,
          color: "bg-blue-500",
          lightColor: "bg-blue-50",
          href: "/admin?lead=1",
        },
        {
          id: 2,
          type: "appointment",
          title: "Appointment scheduled",
          description: "Site visit with Mike Rodriguez tomorrow 2:00 PM",
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          icon: Calendar,
          color: "bg-green-500",
          lightColor: "bg-green-50",
          href: "/admin/availability",
        },
        {
          id: 3,
          type: "estimate",
          title: "Estimate sent",
          description: "Quote #EST-2024-015 delivered to Lisa Wong",
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
          icon: FileText,
          color: "bg-purple-500",
          lightColor: "bg-purple-50",
          href: "/admin/estimates?id=15",
        },
        {
          id: 4,
          type: "project",
          title: "Project completed",
          description: "Finished exterior painting at 123 Oak Street",
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
          icon: CheckCircle,
          color: "bg-green-600",
          lightColor: "bg-green-50",
          href: "/admin/projects?id=8",
        },
        {
          id: 5,
          type: "follow_up",
          title: "Follow-up due",
          description: "Contact Jennifer Lee about kitchen painting",
          timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
          icon: Clock,
          color: "bg-amber-500",
          lightColor: "bg-amber-50",
          href: "/admin/follow-ups?id=3",
        },
        {
          id: 6,
          type: "call",
          title: "Call completed",
          description: "Discussed timeline with David Kim",
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
          icon: Phone,
          color: "bg-rose-500",
          lightColor: "bg-rose-50",
          href: "/admin?lead=12",
        },
      ];

      setActivities(sampleActivities);
      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error("Failed to fetch activities:", error);
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchActivities();
  };

  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else {
      return `${days}d ago`;
    }
  };

  if (loading) {
    return (
      <div className="px-4 py-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900 mb-1">
            Recent Activity
          </h2>
          <p className="text-sm text-slate-600">
            Latest updates and notifications
          </p>
        </div>
        <div className="space-y-4">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="flex space-x-3">
              <div className="w-10 h-10 bg-slate-200 rounded-lg animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 rounded animate-pulse w-3/4" />
                <div className="h-3 bg-slate-200 rounded animate-pulse w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-1">
            Recent Activity
          </h2>
          <p className="text-sm text-slate-600">
            Latest updates and notifications
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="space-y-4">
        {activities.map((activity) => {
          const Icon = activity.icon;

          return (
            <a
              key={activity.id}
              href={activity.href}
              className="flex items-start space-x-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group"
            >
              <div
                className={`w-10 h-10 ${activity.lightColor} rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform`}
              >
                <Icon
                  size={18}
                  className={activity.color.replace("bg-", "text-")}
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <h3 className="text-sm font-medium text-slate-900 group-hover:text-amber-700">
                    {activity.title}
                  </h3>
                  <span className="text-xs text-slate-500 ml-2 flex-shrink-0">
                    {formatTimestamp(activity.timestamp)}
                  </span>
                </div>
                <p className="text-sm text-slate-600 mt-1">
                  {activity.description}
                </p>
              </div>
            </a>
          );
        })}
      </div>

      {/* View All Button */}
      <div className="mt-6 text-center">
        <a
          href="/admin/activities"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
        >
          View All Activities
        </a>
      </div>
    </div>
  );
}
