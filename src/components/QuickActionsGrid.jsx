import {
  UserPlus,
  Calendar,
  FileText,
  Users,
  Clock,
  Phone,
} from "lucide-react";

export default function QuickActionsGrid() {
  const quickActions = [
    {
      title: "Add Lead",
      subtitle: "New customer inquiry",
      icon: UserPlus,
      href: "/admin?action=add-lead",
      color: "bg-blue-500",
      lightColor: "bg-blue-50",
      textColor: "text-blue-600",
      hoverColor: "hover:bg-blue-100",
    },
    {
      title: "Schedule Meeting",
      subtitle: "Book appointment",
      icon: Calendar,
      href: "/admin/availability",
      color: "bg-green-500",
      lightColor: "bg-green-50",
      textColor: "text-green-600",
      hoverColor: "hover:bg-green-100",
    },
    {
      title: "Create Estimate",
      subtitle: "New project quote",
      icon: FileText,
      href: "/admin/estimates?action=new",
      color: "bg-purple-500",
      lightColor: "bg-purple-50",
      textColor: "text-purple-600",
      hoverColor: "hover:bg-purple-100",
    },
    {
      title: "View Team",
      subtitle: "Manage painters",
      icon: Users,
      href: "/admin/team",
      color: "bg-orange-500",
      lightColor: "bg-orange-50",
      textColor: "text-orange-600",
      hoverColor: "hover:bg-orange-100",
    },
    {
      title: "Follow-ups",
      subtitle: "Pending tasks",
      icon: Clock,
      href: "/admin/follow-ups",
      color: "bg-amber-500",
      lightColor: "bg-amber-50",
      textColor: "text-amber-600",
      hoverColor: "hover:bg-amber-100",
    },
    {
      title: "Call List",
      subtitle: "Contacts to reach",
      icon: Phone,
      href: "/admin?filter=need-contact",
      color: "bg-rose-500",
      lightColor: "bg-rose-50",
      textColor: "text-rose-600",
      hoverColor: "hover:bg-rose-100",
    },
  ];

  return (
    <div className="px-4 py-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-900 mb-1">
          Quick Actions
        </h2>
        <p className="text-sm text-slate-600">Common tasks and shortcuts</p>
      </div>

      {/* Mobile: 2 columns */}
      <div className="grid grid-cols-2 gap-4 lg:hidden">
        {quickActions.map((action, index) => {
          const Icon = action.icon;

          return (
            <a
              key={index}
              href={action.href}
              className={`${action.lightColor} ${action.hoverColor} rounded-xl p-4 border border-slate-200 transition-colors group`}
            >
              <div className="flex flex-col items-center text-center space-y-3">
                <div
                  className={`w-12 h-12 ${action.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}
                >
                  <Icon size={24} className="text-white" />
                </div>

                <div>
                  <h3
                    className={`font-semibold ${action.textColor} text-sm mb-1`}
                  >
                    {action.title}
                  </h3>
                  <p className="text-xs text-slate-500">{action.subtitle}</p>
                </div>
              </div>
            </a>
          );
        })}
      </div>

      {/* Desktop: 3 columns */}
      <div className="hidden lg:grid lg:grid-cols-3 lg:gap-6">
        {quickActions.map((action, index) => {
          const Icon = action.icon;

          return (
            <a
              key={index}
              href={action.href}
              className={`${action.lightColor} ${action.hoverColor} rounded-xl p-6 border border-slate-200 transition-all group hover:shadow-lg`}
            >
              <div className="flex items-start space-x-4">
                <div
                  className={`w-12 h-12 ${action.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}
                >
                  <Icon size={24} className="text-white" />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className={`font-semibold ${action.textColor} mb-1`}>
                    {action.title}
                  </h3>
                  <p className="text-sm text-slate-500">{action.subtitle}</p>
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
