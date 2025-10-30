import { useState, useEffect } from "react";
import { ArrowLeft, Home, ChevronRight } from "lucide-react";

export default function MobileBreadcrumb({
  title,
  subtitle,
  showBackButton = true,
  customBackUrl = null,
  breadcrumbs = [],
}) {
  const [currentPath, setCurrentPath] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentPath(window.location.pathname);
    }
  }, []);

  // Auto-generate breadcrumbs if not provided
  const getAutoBreadcrumbs = () => {
    if (breadcrumbs.length > 0) return breadcrumbs;

    const pathSegments = currentPath.split("/").filter(Boolean);
    const autoBreadcrumbs = [
      { label: "Dashboard", href: "/admin", icon: Home },
    ];

    if (pathSegments.length > 1) {
      const pageMap = {
        leads: { label: "Leads", href: "/admin/leads" },
        clients: { label: "Clients", href: "/admin/clients" },
        calendar: { label: "Calendar", href: "/admin/calendar" },
        contracts: { label: "Contracts", href: "/admin/contracts" },
        invoices: { label: "Invoices", href: "/admin/invoices" },
        payments: { label: "Payments", href: "/admin/payments" },
        availability: { label: "Availability", href: "/admin/availability" },
        estimates: { label: "Estimates", href: "/admin/estimates" },
        projects: { label: "Projects", href: "/admin/projects" },
        "follow-ups": { label: "Follow-ups", href: "/admin/follow-ups" },
        tasks: { label: "Tasks", href: "/admin/tasks" },
        team: { label: "Team", href: "/admin/team" },
      };

      pathSegments.slice(1).forEach((segment, index) => {
        const page = pageMap[segment];
        if (page) {
          autoBreadcrumbs.push(page);
        }
      });
    }

    return autoBreadcrumbs;
  };

  const finalBreadcrumbs = getAutoBreadcrumbs();

  const handleBack = () => {
    if (customBackUrl) {
      window.location.href = customBackUrl;
    } else if (typeof window !== "undefined") {
      window.history.back();
    }
  };

  return (
    <div className="bg-white border-b border-slate-200 sticky top-16 z-30 lg:hidden">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            {showBackButton && (
              <button
                onClick={handleBack}
                className="mr-3 p-2 -ml-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
            )}

            <div>
              <h1 className="text-lg font-semibold text-slate-900">
                {title ||
                  finalBreadcrumbs[finalBreadcrumbs.length - 1]?.label ||
                  "Page"}
              </h1>
              {subtitle && <p className="text-sm text-slate-600">{subtitle}</p>}
            </div>
          </div>
        </div>

        {/* Breadcrumb trail */}
        {finalBreadcrumbs.length > 1 && (
          <div className="flex items-center text-xs text-slate-500 overflow-x-auto">
            {finalBreadcrumbs.map((crumb, index) => {
              const isLast = index === finalBreadcrumbs.length - 1;
              const Icon = crumb.icon;

              return (
                <div key={index} className="flex items-center flex-shrink-0">
                  {index > 0 && <ChevronRight size={12} className="mx-1" />}
                  <a
                    href={isLast ? "#" : crumb.href}
                    onClick={(e) => {
                      if (isLast) e.preventDefault();
                    }}
                    className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
                      isLast
                        ? "text-amber-600 bg-amber-50 font-medium"
                        : "hover:text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {Icon && <Icon size={12} />}
                    <span className="whitespace-nowrap">{crumb.label}</span>
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
