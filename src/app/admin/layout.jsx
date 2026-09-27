"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Outlet } from "react-router";
import {
  Menu,
  X,
  LayoutGrid,
  Inbox,
  Users,
  FileText,
  Briefcase,
  Wallet,
  Settings,
} from "lucide-react";
import BottomTabNav from "@/components/BottomTabNav";
import MobileBreadcrumb from "@/components/MobileBreadcrumb";
import { AdminAuthProvider, useAdminAuth } from "@/contexts/AdminAuthContext";
import { ModalProvider, useModal } from "@/contexts/ModalContext";
import { initSmartPreloader } from "@/utils/pagePreloader";

function AdminLayoutContent({ children }) {
  const { user, loading, authChecked, authError, logout, refreshAuth } =
    useAdminAuth();
  const { isModalOpen } = useModal();
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState("");
  const [isOffline, setIsOffline] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentPath(window.location.pathname);
      // connectivity listeners
      const onOffline = () => setIsOffline(true);
      const onOnline = () => setIsOffline(false);
      setIsOffline(!navigator.onLine);
      window.addEventListener("offline", onOffline);
      window.addEventListener("online", onOnline);

      // Initialize smart preloader for performance
      initSmartPreloader();

      return () => {
        window.removeEventListener("offline", onOffline);
        window.removeEventListener("online", onOnline);
      };
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await fetch("/api/notifications?status=unread");
        const j = await res.json().catch(() => ({}));
        if (!mounted) return;
        if (res.ok) {
          const n = Array.isArray(j?.notifications)
            ? j.notifications.length
            : 0;
          setUnreadCount(n);
        }
      } catch {
        // Notification polling is best-effort; the next interval retries it.
      }
    };
    load();
    const id = setInterval(load, 60000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      setSigningOut(true);
      setError(null);
      await logout();
    } catch (e) {
      console.error(e);
      setError("Could not sign out. Please try again.");
      setSigningOut(false);
    }
  }, [logout]);

  // One menu item per step of the business: lead → customer → estimate →
  // job → invoice. Secondary screens are tabs inside the step they belong to.
  const groups = useMemo(
    () => [
      {
        key: "home",
        label: "Home",
        icon: LayoutGrid,
        entryHref: "/admin",
        tabs: [],
        matchers: ["/admin$"],
        description: "What needs attention",
        showNotificationBadge: false,
      },
      {
        key: "leads",
        label: "Leads",
        icon: Inbox,
        entryHref: "/admin/leads",
        tabs: [
          { label: "Leads", href: "/admin/leads", description: "New enquiries" },
          { label: "Follow-ups", href: "/admin/follow-ups", description: "Scheduled calls" },
          { label: "Notifications", href: "/admin/messages", description: "New activity", badge: unreadCount > 0 ? unreadCount : null },
        ],
        matchers: ["/admin/leads", "/admin/follow-ups", "/admin/messages"],
        description: "Enquiries and follow-ups",
        showNotificationBadge: unreadCount > 0,
      },
      {
        key: "customers",
        label: "Customers",
        icon: Users,
        entryHref: "/admin/clients",
        tabs: [],
        matchers: ["/admin/clients"],
        description: "Everyone you have sold to",
        showNotificationBadge: false,
      },
      {
        key: "estimates",
        label: "Estimates",
        icon: FileText,
        entryHref: "/admin/estimates",
        tabs: [
          { label: "Estimates", href: "/admin/estimates", description: "Quotes" },
          { label: "Contracts", href: "/admin/contracts", description: "Existing agreements" },
        ],
        matchers: ["/admin/estimates", "/admin/contracts"],
        description: "Quotes for customers",
        showNotificationBadge: false,
      },
      {
        key: "jobs",
        label: "Jobs",
        icon: Briefcase,
        entryHref: "/admin/projects",
        tabs: [
          { label: "Jobs", href: "/admin/projects", description: "Sold work" },
          { label: "Calendar", href: "/admin/calendar", description: "Visits and job dates" },
          { label: "Today", href: "/admin/today", description: "Jobs in progress" },
          { label: "Capture", href: "/admin/capture", description: "Progress photos" },
        ],
        matchers: ["/admin/projects", "/admin/calendar", "/admin/today", "/admin/capture"],
        description: "Scheduled and active work",
        showNotificationBadge: false,
      },
      {
        key: "invoices",
        label: "Invoices",
        icon: Wallet,
        entryHref: "/admin/invoices",
        tabs: [
          { label: "Invoices", href: "/admin/invoices", description: "Bills" },
          { label: "Payments", href: "/admin/payments", description: "Money received" },
        ],
        matchers: ["/admin/invoices", "/admin/payments"],
        description: "Billing and payments",
        showNotificationBadge: false,
      },
      {
        key: "settings",
        label: "Settings",
        icon: Settings,
        entryHref: "/admin/settings",
        tabs: [
          { label: "Company", href: "/admin/settings", description: "Business details" },
          { label: "Booking slots", href: "/admin/availability", description: "Estimate visit times" },
          { label: "Team", href: "/admin/team", description: "Staff accounts" },
          { label: "Password", href: "/account/change-password", description: "Your sign-in" },
        ],
        matchers: ["/admin/settings", "/admin/availability", "/admin/team", "/account/change-password"],
        description: "Business setup",
        showNotificationBadge: false,
      },
    ],
    [unreadCount],
  );

  const activeGroup = useMemo(() => {
    const path = currentPath || "";
    // Exact dashboard match
    if (path === "/admin") return groups[0];
    return (
      groups.find((g) => g.matchers.some((m) => new RegExp(m).test(path))) ||
      groups[0]
    );
  }, [currentPath, groups]);

  // During auth check: render children immediately so page-level redirects can fire
  // The auth check in AdminAuthContext will redirect to login if needed
  if (!authChecked || loading) {
    return <>{children}</>;
  }

  // Show error state if authentication failed
  if (authError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-6 h-6 text-red-600" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">
            Authentication Error
          </h2>
          <p className="text-slate-600 mb-6">{authError}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors"
            >
              Refresh Page
            </button>
            <button
              onClick={() => (window.location.href = "/account/signin")}
              className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors"
            >
              Sign In Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-slate-50 pb-20 lg:pb-0"
      style={{
        fontFamily:
          'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      {/* Header w/ brand and actions (desktop & mobile) */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
          <div className="h-18 lg:h-20 flex items-center justify-between">
            {/* Logo/Brand */}
            <div className="flex items-center">
              <a
                href="/admin"
                className="block hover:opacity-75 transition-opacity"
              >
                <img
                  src="/logo.png"
                  alt="Arcan Painting Admin"
                  className="w-[160px] h-[74px] lg:w-[180px] lg:h-[84px] object-contain"
                />
              </a>
            </div>

            {/* Desktop actions */}
            <div className="hidden lg:flex items-center space-x-2">
              <a
                href="/account/change-password"
                className="px-3 py-2 text-sm text-slate-700 hover:text-amber-700 hover:bg-slate-50 rounded-lg"
              >
                Change Password
              </a>
              <button
                onClick={handleLogout}
                disabled={signingOut}
                className="px-4 py-2 text-sm bg-slate-800 hover:bg-slate-900 disabled:bg-slate-400 text-white rounded-lg transition-colors"
              >
                {signingOut ? "Signing out..." : "Logout"}
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="lg:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>

          {/* Mobile Settings Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden border-t border-slate-200 py-4">
              <div className="space-y-1">
                <a
                  href="/account/change-password"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3 text-sm text-slate-700 hover:text-amber-700 hover:bg-slate-50 rounded-lg"
                >
                  Change Password
                </a>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  disabled={signingOut}
                  className="w-full text-left px-4 py-3 text-sm bg-slate-800 hover:bg-slate-900 disabled:bg-slate-400 text-white rounded-lg transition-colors"
                >
                  {signingOut ? "Signing out..." : "Logout"}
                </button>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border-t border-red-200">
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-2 text-sm text-red-700">
              {error}
            </div>
          </div>
        )}

        {/* Offline indicator */}
        {isOffline && (
          <div className="bg-amber-50 border-t border-amber-200">
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-2 text-sm text-amber-800 flex items-center justify-between">
              <span>You are offline. Some actions may not work.</span>
              <button
                onClick={() => setIsOffline(!navigator.onLine)}
                className="text-amber-700 underline"
              >
                Recheck
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Mobile Breadcrumb */}
      <MobileBreadcrumb />

      {/* Desktop layout with left sidebar */}
      <div className="max-w-[1600px] mx-auto w-full px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-[300px_1fr] xl:grid-cols-[320px_1fr] lg:gap-10 xl:gap-12">
          {/* Sidebar */}
          <aside className="hidden lg:block sticky top-24 self-start">
            <nav className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              {groups.map((g, index) => {
                const Icon = g.icon;
                const active = g.key === activeGroup.key;
                return (
                  <div key={g.key} className="relative">
                    <a
                      href={g.entryHref}
                      className={`group flex items-start gap-4 px-5 py-4 text-sm border-b last:border-b-0 transition-all duration-200 hover:bg-slate-50 ${
                        active
                          ? "bg-amber-50 text-amber-900 border-amber-100 shadow-sm"
                          : "text-slate-700 border-slate-200"
                      }`}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        <Icon
                          size={18}
                          className={`transition-colors ${
                            active
                              ? "text-amber-600"
                              : "text-slate-500 group-hover:text-slate-700"
                          }`}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span
                            className={`font-semibold ${active ? "text-amber-900" : "text-slate-900"}`}
                          >
                            {g.label}
                          </span>
                          {g.showNotificationBadge && (
                            <span className="ml-2 inline-flex items-center justify-center text-[10px] px-2 py-1 rounded-full bg-red-500 text-white font-bold">
                              {unreadCount > 99 ? "99+" : unreadCount}
                            </span>
                          )}
                        </div>
                        <p
                          className={`text-xs mt-1 ${
                            active
                              ? "text-amber-700"
                              : "text-slate-500 group-hover:text-slate-600"
                          }`}
                        >
                          {g.description}
                        </p>
                      </div>

                      {/* Active indicator */}
                      {active && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500 rounded-r-full" />
                      )}
                    </a>

                    {/* Expandable section for active group with tabs */}
                    {active && g.tabs?.length > 0 && (
                      <div className="bg-amber-25 border-b border-amber-100">
                        <div className="px-5 py-3">
                          <div className="space-y-1">
                            {g.tabs.map((tab) => {
                              const isTabActive = (
                                currentPath || ""
                              ).startsWith(tab.href);
                              return (
                                <a
                                  key={tab.href}
                                  href={tab.href}
                                  className={`flex items-center justify-between py-2 px-3 rounded-lg text-sm transition-colors ${
                                    isTabActive
                                      ? "bg-amber-100 text-amber-900 font-medium"
                                      : "text-amber-700 hover:bg-amber-50 hover:text-amber-900"
                                  }`}
                                >
                                  <span>{tab.label}</span>
                                  {tab.badge && (
                                    <span className="inline-flex items-center justify-center text-[10px] px-1.5 py-0.5 rounded-full bg-red-500 text-white font-bold">
                                      {tab.badge > 99 ? "99+" : tab.badge}
                                    </span>
                                  )}
                                </a>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

          </aside>

          {/* Main content area */}
          <main className="min-h-[70vh]">
            {/* Tabs for active group (if any) */}
            {activeGroup?.tabs?.length ? (
              <div className="mb-6 overflow-x-auto">
                <div className="inline-flex bg-white border border-slate-200 rounded-lg p-1 gap-1">
                  {activeGroup.tabs.map((t) => {
                    const isActive = (currentPath || "").startsWith(t.href);
                    return (
                      <a
                        key={t.href}
                        href={t.href}
                        className={`px-5 py-2.5 text-sm rounded-md whitespace-nowrap transition-colors ${
                          isActive
                            ? "bg-amber-500 text-white"
                            : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <span className="inline-flex items-center gap-2">
                          {t.label}
                          {t.href === "/admin/messages" && unreadCount > 0 && (
                            <span className="inline-flex items-center justify-center text-[10px] px-1.5 py-0.5 rounded-full bg-red-500 text-white">
                              {unreadCount}
                            </span>
                          )}
                        </span>
                      </a>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {/* Page content */}
            <div className="bg-transparent">{children}</div>
          </main>
        </div>
      </div>

      {/* Mobile Components - conditionally show based on modal state */}
      <div className={`${isModalOpen ? "hidden" : "block"} lg:block`}>
        <BottomTabNav unreadCount={unreadCount} />
      </div>

    </div>
  );
}

import { ErrorBoundary } from "@/components/ErrorBoundary";

// Rendered as a React Router layout route (see src/app/routes.ts), so the
// page arrives through <Outlet />.
export default function AdminLayout({ children }) {
  const content = children ?? <Outlet />;
  return (
    <ErrorBoundary name="admin-dashboard" fullPage>
      <AdminAuthProvider>
        <ModalProvider>
          <AdminLayoutContent>{content}</AdminLayoutContent>
        </ModalProvider>
      </AdminAuthProvider>
    </ErrorBoundary>
  );
}
