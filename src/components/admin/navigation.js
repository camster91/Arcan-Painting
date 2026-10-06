import { LayoutGrid, Inbox, Users, FileText, Briefcase, Wallet, Settings } from "lucide-react";

// Keep business labels separate from stable backend routes.
export function getAdminNavigation(unreadCount = 0) {
  return [
      {
        key: "home",
        label: "Home",
        icon: LayoutGrid,
        entryHref: "/admin",
        tabs: [],
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
        description: "Enquiries and follow-ups",
        showNotificationBadge: unreadCount > 0,
      },
      {
        key: "customers",
        label: "Customers",
        icon: Users,
        entryHref: "/admin/clients",
        tabs: [],
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
        description: "Billing and payments",
        showNotificationBadge: false,
      },
      {
        key: "team", label: "Team", icon: Users, entryHref: "/admin/team",
        tabs: [], description: "People doing the work", showNotificationBadge: false,
      },
      {
        key: "settings",
        label: "Settings",
        icon: Settings,
        entryHref: "/admin/settings",
        tabs: [
          { label: "Company", href: "/admin/settings", description: "Business details" },
          { label: "Booking slots", href: "/admin/availability", description: "Estimate visit times" },
          { label: "Password", href: "/account/change-password", description: "Your sign-in" },
        ],
        description: "Business setup",
        showNotificationBadge: false,
      },
    ];
}

export function matchesAdminPath(path, href) {
  const normalized = path.replace(/\/$/, "");
  return normalized === href || (href !== "/admin" && normalized.startsWith(`${href}/`));
}

export function getActiveAdminGroup(path, groups = getAdminNavigation()) {
  return groups.find((group) => [group.entryHref, ...group.tabs.map((tab) => tab.href)]
    .some((href) => matchesAdminPath(path, href))) || groups[0];
}
