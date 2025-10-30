"use client";

import { Suspense } from "react";
import DashboardOverview from "@/components/admin/dashboard/DashboardOverview";
import AdaptiveContentArea, {
  ResponsiveGrid,
  ResponsiveCard,
} from "@/components/AdaptiveContentArea";

// Loading skeleton for the dashboard
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <ResponsiveGrid cols={{ sm: 1, md: 2, lg: 4 }}>
        {[...Array(4)].map((_, i) => (
          <ResponsiveCard key={i} className="animate-pulse">
            <div className="h-4 bg-slate-200 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-slate-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-slate-200 rounded w-1/3"></div>
          </ResponsiveCard>
        ))}
      </ResponsiveGrid>

      {/* Recent activity skeleton */}
      <ResponsiveGrid cols={{ sm: 1, lg: 2 }} gap={8}>
        <ResponsiveCard>
          <div className="h-6 bg-slate-200 rounded w-1/3 mb-6 animate-pulse"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-start gap-3 animate-pulse">
                <div className="w-10 h-10 bg-slate-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </ResponsiveCard>

        <ResponsiveCard>
          <div className="h-6 bg-slate-200 rounded w-1/3 mb-6 animate-pulse"></div>
          <ResponsiveGrid cols={{ sm: 2 }} gap={4}>
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="p-4 rounded-lg border border-slate-200 animate-pulse"
              >
                <div className="w-6 h-6 bg-slate-200 rounded mb-2"></div>
                <div className="h-4 bg-slate-200 rounded w-2/3 mb-1"></div>
                <div className="h-3 bg-slate-200 rounded w-1/2"></div>
              </div>
            ))}
          </ResponsiveGrid>
        </ResponsiveCard>
      </ResponsiveGrid>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <AdaptiveContentArea
      title="Dashboard"
      subtitle="Welcome back! Here's what's happening with your business."
      breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Dashboard" }]}
      actions={{
        primary: {
          label: "Quick Actions",
          variant: "primary",
          onClick: () => console.log("Quick actions clicked"),
        },
        secondary: [
          {
            label: "Export Data",
            onClick: () => console.log("Export clicked"),
          },
          {
            label: "Settings",
            onClick: () => (window.location.href = "/admin/settings"),
          },
        ],
      }}
    >
      {/* Dashboard Content */}
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardOverview />
      </Suspense>

      {/* Additional responsive sections demonstrating the layout system */}
      <div className="mt-8 text-sm text-slate-500 text-center">
        <p>Last updated: {new Date().toLocaleDateString()}</p>
      </div>
    </AdaptiveContentArea>
  );
}
