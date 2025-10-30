import { preloadData } from "@/hooks/usePerformanceCache";

// Critical data that should be preloaded for common admin pages
const PRELOAD_CONFIGS = {
  "/admin": [
    {
      key: "dashboard-overview",
      fetcher: () => fetch("/api/admin/dashboard").then((r) => r.json()),
    },
  ],
  "/admin/leads": [
    {
      key: "leads-list",
      fetcher: () => fetch("/api/leads").then((r) => r.json()),
    },
    {
      key: "appointments-list",
      fetcher: () => fetch("/api/appointments").then((r) => r.json()),
    },
  ],
  "/admin/estimates": [
    {
      key: "estimates-list",
      fetcher: () => fetch("/api/estimates").then((r) => r.json()),
    },
    {
      key: "leads-list",
      fetcher: () => fetch("/api/leads").then((r) => r.json()),
    },
  ],
  "/admin/projects": [
    {
      key: "projects-list",
      fetcher: () => fetch("/api/projects").then((r) => r.json()),
    },
    {
      key: "team-members-list",
      fetcher: () => fetch("/api/team-members").then((r) => r.json()),
    },
  ],
  "/admin/calendar": [
    {
      key: "calendar-appointments",
      fetcher: () => fetch("/api/appointments").then((r) => r.json()),
    },
    {
      key: "calendar-projects",
      fetcher: () => fetch("/api/projects").then((r) => r.json()),
    },
    {
      key: "availability-slots",
      fetcher: () => fetch("/api/availability").then((r) => r.json()),
    },
  ],
  "/admin/invoices": [
    {
      key: "invoices-list",
      fetcher: () => fetch("/api/invoices").then((r) => r.json()),
    },
  ],
  "/admin/payments": [
    {
      key: "payments-list",
      fetcher: () => fetch("/api/payments").then((r) => r.json()),
    },
    {
      key: "invoices-list",
      fetcher: () => fetch("/api/invoices").then((r) => r.json()),
    },
  ],
};

// Preload data for a specific page
export async function preloadPageData(pathname) {
  const configs = PRELOAD_CONFIGS[pathname];
  if (!configs) return;

  console.log(`Preloading data for ${pathname}`);

  // Preload all data for this page
  const preloadPromises = configs.map((config) =>
    preloadData(config.key, config.fetcher),
  );

  try {
    await Promise.allSettled(preloadPromises);
  } catch (error) {
    console.warn(`Error preloading data for ${pathname}:`, error);
  }
}

// Smart preloader that anticipates user navigation
export function initSmartPreloader() {
  if (typeof window === "undefined") return;

  // Preload on hover for desktop
  document.addEventListener("mouseover", (event) => {
    const link = event.target.closest('a[href^="/admin"]');
    if (link && link.href) {
      const url = new URL(link.href);
      preloadPageData(url.pathname);
    }
  });

  // Preload on touch start for mobile
  document.addEventListener(
    "touchstart",
    (event) => {
      const link = event.target.closest('a[href^="/admin"]');
      if (link && link.href) {
        const url = new URL(link.href);
        preloadPageData(url.pathname);
      }
    },
    { passive: true },
  );

  // Preload common pages immediately
  setTimeout(() => {
    preloadPageData("/admin");
    preloadPageData("/admin/leads");
  }, 1000);
}

// Enhanced link functionality (use this pattern in your JSX components)
export function getPreloadHandlers(href, preload = true) {
  const handleMouseEnter = () => {
    if (preload && href.startsWith("/admin")) {
      preloadPageData(href);
    }
  };

  const handleTouchStart = () => {
    if (preload && href.startsWith("/admin")) {
      preloadPageData(href);
    }
  };

  return {
    onMouseEnter: handleMouseEnter,
    onTouchStart: handleTouchStart,
  };
}

// Preload data when user is likely to navigate to a page
export function preloadOnIdle(pathname, delay = 2000) {
  if (typeof window === "undefined") return;

  // Use requestIdleCallback if available, otherwise setTimeout
  const schedulePreload =
    window.requestIdleCallback || ((callback) => setTimeout(callback, delay));

  schedulePreload(() => {
    preloadPageData(pathname);
  });
}

// Get loading priorities for different page types
export function getLoadingPriority(pathname) {
  const highPriority = ["/admin", "/admin/leads", "/admin/calendar"];
  const mediumPriority = ["/admin/estimates", "/admin/projects"];

  if (highPriority.includes(pathname)) return "high";
  if (mediumPriority.includes(pathname)) return "medium";
  return "low";
}
