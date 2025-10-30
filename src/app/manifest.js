export default function manifest() {
  return {
    name: "Arcan Painting CRM",
    short_name: "Arcan CRM",
    description: "Professional painting business management system",
    start_url: "/admin",
    display: "standalone",
    background_color: "#0F172A",
    theme_color: "#F59E0B",
    orientation: "portrait-primary",
    scope: "/",
    categories: ["business", "productivity"],
    lang: "en-US",
    icons: [
      {
        src: "/icons/icon-72x72.png",
        sizes: "72x72",
        type: "image/png",
        purpose: "maskable any",
      },
      {
        src: "/icons/icon-96x96.png",
        sizes: "96x96",
        type: "image/png",
        purpose: "maskable any",
      },
      {
        src: "/icons/icon-128x128.png",
        sizes: "128x128",
        type: "image/png",
        purpose: "maskable any",
      },
      {
        src: "/icons/icon-144x144.png",
        sizes: "144x144",
        type: "image/png",
        purpose: "maskable any",
      },
      {
        src: "/icons/icon-152x152.png",
        sizes: "152x152",
        type: "image/png",
        purpose: "maskable any",
      },
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable any",
      },
      {
        src: "/icons/icon-384x384.png",
        sizes: "384x384",
        type: "image/png",
        purpose: "maskable any",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable any",
      },
    ],
    screenshots: [
      {
        src: "/screenshots/desktop-1.png",
        sizes: "1280x720",
        type: "image/png",
        form_factor: "wide",
        label: "Dashboard Overview",
      },
      {
        src: "/screenshots/mobile-1.png",
        sizes: "390x844",
        type: "image/png",
        form_factor: "narrow",
        label: "Mobile Dashboard",
      },
    ],
    shortcuts: [
      {
        name: "Dashboard",
        short_name: "Dashboard",
        url: "/admin",
        icons: [
          {
            src: "/icons/shortcut-dashboard.png",
            sizes: "96x96",
          },
        ],
      },
      {
        name: "Leads",
        short_name: "Leads",
        url: "/admin/leads",
        icons: [
          {
            src: "/icons/shortcut-leads.png",
            sizes: "96x96",
          },
        ],
      },
      {
        name: "Projects",
        short_name: "Projects",
        url: "/admin/projects",
        icons: [
          {
            src: "/icons/shortcut-projects.png",
            sizes: "96x96",
          },
        ],
      },
      {
        name: "Calendar",
        short_name: "Calendar",
        url: "/admin/calendar",
        icons: [
          {
            src: "/icons/shortcut-calendar.png",
            sizes: "96x96",
          },
        ],
      },
    ],
    prefer_related_applications: false,
    // Add better handling for loading states
    display_override: ["window-controls-overlay", "standalone", "minimal-ui"],
    // Add handling for when the app can't connect
    offline_enabled: true,
    protocol_handlers: [],
    share_target: {
      action: "/admin/leads",
      method: "GET",
      params: {
        title: "name",
        text: "project_description",
      },
    },
  };
}
