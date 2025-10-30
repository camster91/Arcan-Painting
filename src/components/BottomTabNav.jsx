import { useState, useEffect, useCallback } from "react";
import {
  Home,
  Users,
  FolderOpen,
  Calendar,
  UserCheck,
  MoreHorizontal,
  FileText,
  Wallet,
  Briefcase,
  Settings,
  X,
  ChevronUp,
} from "lucide-react";

export default function BottomTabNav() {
  const [currentPath, setCurrentPath] = useState("");
  const [moreOpen, setMoreOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentPath(window.location.pathname);
    }
  }, []);

  // Load notification count for badges
  useEffect(() => {
    let mounted = true;
    const loadUnreadCount = async () => {
      try {
        const res = await fetch("/api/notifications?status=unread");
        if (!res.ok) return;
        const data = await res.json();
        if (!mounted) return;
        const count = Array.isArray(data?.notifications)
          ? data.notifications.length
          : 0;
        setUnreadCount(count);
      } catch (error) {
        // Silently fail - not critical
      }
    };

    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 60000); // Check every minute

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const closeMoreMenu = useCallback(() => setMoreOpen(false), []);

  const tabs = [
    {
      href: "/admin",
      icon: Home,
      label: "Dashboard",
      exact: true,
    },
    {
      href: "/admin/leads",
      icon: Users,
      label: "Leads",
      exact: false,
    },
    {
      href: "/admin/projects",
      icon: FolderOpen,
      label: "Projects",
      exact: false,
    },
    {
      href: "/admin/calendar",
      icon: Calendar,
      label: "Calendar",
      exact: false,
    },
    {
      href: "#",
      icon: MoreHorizontal,
      label: "More",
      exact: false,
      isMore: true,
    },
  ];

  const moreLinks = [
    {
      href: "/admin/clients",
      icon: UserCheck,
      label: "Clients",
      category: "Customer Management",
    },
    {
      href: "/admin/follow-ups",
      icon: UserCheck,
      label: "Follow-ups",
      category: "Customer Management",
    },
    {
      href: "/admin/estimates",
      icon: FileText,
      label: "Estimates",
      category: "Sales & Contracts",
    },
    {
      href: "/admin/estimates/calculator",
      icon: FileText,
      label: "Calculator",
      category: "Sales & Contracts",
    },
    {
      href: "/admin/contracts",
      icon: FileText,
      label: "Contracts",
      category: "Sales & Contracts",
    },
    {
      href: "/admin/invoices",
      icon: Wallet,
      label: "Invoices",
      category: "Financial",
    },
    {
      href: "/admin/payments",
      icon: Wallet,
      label: "Payments",
      category: "Financial",
    },
    {
      href: "/admin/tasks",
      icon: Briefcase,
      label: "Tasks",
      category: "Project Management",
    },
    {
      href: "/admin/availability",
      icon: Calendar,
      label: "Availability",
      category: "Scheduling",
    },
    {
      href: "/admin/scheduling",
      icon: Calendar,
      label: "Team Schedule",
      category: "Scheduling",
    },
    {
      href: "/admin/team",
      icon: Users,
      label: "Team",
      category: "Team & Settings",
    },
    {
      href: "/admin/messages",
      icon: UserCheck,
      label: "Messages",
      category: "Operations",
      badge: unreadCount > 0 ? unreadCount : null,
    },
    {
      href: "/admin/today",
      icon: Calendar,
      label: "Today",
      category: "Operations",
    },
    {
      href: "/account/change-password",
      icon: Settings,
      label: "Settings",
      category: "Team & Settings",
    },
  ];

  // Group more links by category
  const groupedMoreLinks = moreLinks.reduce((groups, link) => {
    const category = link.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(link);
    return groups;
  }, {});

  const isActiveTab = (href, exact = false) => {
    if (exact) {
      return currentPath === href;
    }
    return currentPath.startsWith(href) && href !== "#";
  };

  // Check if any more links are active to highlight the More tab
  const isMoreTabActive = moreLinks.some((link) => isActiveTab(link.href));

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 lg:hidden">
      {/* Backdrop & Enhanced Sheet for More menu */}
      {moreOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
            onClick={closeMoreMenu}
            style={{ animation: "fadeIn 0.3s ease-out" }}
          />
          <div
            className="fixed bottom-0 left-0 right-0 rounded-t-3xl bg-white shadow-2xl max-h-[75vh] overflow-hidden"
            style={{ animation: "slideUp 0.3s cubic-bezier(0.32, 0.72, 0, 1)" }}
          >
            {/* Header with drag handle */}
            <div className="px-4 pt-2 pb-4 border-b border-slate-200">
              <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mb-4"></div>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">
                  More Options
                </h3>
                <button
                  onClick={closeMoreMenu}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                  aria-label="Close menu"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Scrollable content */}
            <div
              className="overflow-y-auto"
              style={{ maxHeight: "calc(75vh - 120px)" }}
            >
              {Object.entries(groupedMoreLinks).map(([category, links]) => (
                <div
                  key={category}
                  className="p-4 border-b border-slate-100 last:border-b-0"
                >
                  <h4 className="text-sm font-medium text-slate-600 mb-3 uppercase tracking-wide">
                    {category}
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    {links.map(({ href, icon: Icon, label, badge }) => {
                      const isActive = isActiveTab(href);
                      return (
                        <a
                          key={href}
                          href={href}
                          onClick={closeMoreMenu}
                          className={`relative flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-200 ${
                            isActive
                              ? "bg-amber-50 border-amber-200 text-amber-700"
                              : "border-slate-200 hover:bg-slate-50 text-slate-700 hover:border-slate-300"
                          }`}
                        >
                          <Icon size={22} className="mb-2" />
                          <span className="text-xs font-medium text-center leading-tight">
                            {label}
                          </span>
                          {badge && (
                            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                              {badge > 99 ? "99+" : badge}
                            </div>
                          )}
                        </a>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Safe area bottom padding */}
            <div
              className="h-2"
              style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
            />
          </div>
        </>
      )}

      {/* Main tab bar with safe area support */}
      <div
        className="flex items-center justify-around py-2 px-1 bg-white"
        style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
      >
        {tabs.map((tab, index) => {
          const isActive = tab.isMore
            ? isMoreTabActive
            : isActiveTab(tab.href, tab.exact);
          const Icon = tab.icon;

          return (
            <button
              key={index}
              onClick={(e) => {
                if (tab.isMore) {
                  e.preventDefault();
                  setMoreOpen(true);
                } else {
                  window.location.href = tab.href;
                }
              }}
              className={`flex flex-col items-center justify-center py-2 px-3 min-w-0 flex-1 transition-all duration-200 rounded-lg ${
                isActive
                  ? "text-amber-600 bg-amber-50"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}
              aria-label={tab.label}
            >
              <div className="relative">
                <Icon size={20} className="mb-1" />
                {tab.isMore && moreOpen && (
                  <ChevronUp
                    size={12}
                    className="absolute -top-1 -right-1 text-amber-600"
                  />
                )}
              </div>
              <span className="text-xs font-medium truncate">{tab.label}</span>
              {isActive && (
                <div className="w-4 h-0.5 bg-amber-600 rounded-full mt-1 transition-all duration-200" />
              )}
            </button>
          );
        })}
      </div>

      {/* CSS animations */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from { 
            transform: translateY(100%); 
            opacity: 0;
          }
          to { 
            transform: translateY(0); 
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
