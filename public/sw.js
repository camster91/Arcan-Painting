const CACHE_NAME = "arcan-crm-v1";
const STATIC_CACHE = "arcan-static-v1";
const DYNAMIC_CACHE = "arcan-dynamic-v1";

// Static assets to cache
const STATIC_ASSETS = [
  "/",
  "/admin",
  "/admin/leads",
  "/admin/projects",
  "/admin/calendar",
  "/admin/estimates",
  "/manifest.json",
  // Add other critical routes
];

// API routes to cache
const API_CACHE_ROUTES = [
  "/api/leads",
  "/api/projects",
  "/api/estimates",
  "/api/admin/dashboard",
  "/api/appointments",
];

// Install event - cache static assets
self.addEventListener("install", (event) => {
  console.log("Service Worker: Installing...");

  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        console.log("Service Worker: Caching static assets...");
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log("Service Worker: Static assets cached");
        return self.skipWaiting(); // Activate immediately
      })
      .catch((err) => {
        console.error("Service Worker: Cache failed", err);
      }),
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("Service Worker: Activating...");

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Delete old caches
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log("Service Worker: Deleting old cache", cacheName);
              return caches.delete(cacheName);
            }
          }),
        );
      })
      .then(() => {
        console.log("Service Worker: Activated");
        return self.clients.claim(); // Take control of all pages
      }),
  );
});

// Fetch event - serve from cache with network fallback
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and external URLs
  if (request.method !== "GET" || !url.origin.includes(self.location.origin)) {
    return;
  }

  // Handle API requests with cache-first strategy for performance
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle page requests with network-first strategy
  if (request.headers.get("accept").includes("text/html")) {
    event.respondWith(handlePageRequest(request));
    return;
  }

  // Handle static assets with cache-first strategy
  event.respondWith(handleStaticRequest(request));
});

// API Request Handler - Cache first for performance
async function handleApiRequest(request) {
  const url = new URL(request.url);

  try {
    // Try cache first for better performance
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      console.log("Service Worker: Serving API from cache", url.pathname);

      // Fetch fresh data in background to update cache
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            caches
              .open(DYNAMIC_CACHE)
              .then((cache) => cache.put(request, responseClone));
          }
        })
        .catch(() => {}); // Silent background update failure

      return cachedResponse;
    }

    // No cache, fetch from network
    console.log("Service Worker: Fetching API from network", url.pathname);
    const response = await fetch(request);

    if (response.ok && shouldCacheApiRoute(url.pathname)) {
      const responseClone = response.clone();
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, responseClone);
    }

    return response;
  } catch (error) {
    console.log(
      "Service Worker: API request failed, serving from cache",
      url.pathname,
    );

    // Network failed, try to serve stale cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline response for API calls
    return new Response(
      JSON.stringify({
        error: "Offline",
        message: "You are currently offline. Some data may not be current.",
      }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

// Page Request Handler - Network first
async function handlePageRequest(request) {
  try {
    console.log("Service Worker: Fetching page from network", request.url);
    const response = await fetch(request);

    if (response.ok) {
      // Cache successful page loads
      const responseClone = response.clone();
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, responseClone);
    }

    return response;
  } catch (error) {
    console.log(
      "Service Worker: Page request failed, serving from cache",
      request.url,
    );

    // Network failed, try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline page
    return (
      caches.match("/admin") ||
      new Response(
        "<h1>You are offline</h1><p>Please check your internet connection.</p>",
        { headers: { "Content-Type": "text/html" } },
      )
    );
  }
}

// Static Request Handler - Cache first
async function handleStaticRequest(request) {
  try {
    // Try cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Fetch from network and cache
    const response = await fetch(request);
    if (response.ok) {
      const responseClone = response.clone();
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, responseClone);
    }

    return response;
  } catch (error) {
    // Return cached version if available
    return caches.match(request) || new Response("Asset not available offline");
  }
}

// Helper function to determine if API route should be cached
function shouldCacheApiRoute(pathname) {
  return API_CACHE_ROUTES.some((route) => pathname.startsWith(route));
}

// Background sync for offline actions
self.addEventListener("sync", (event) => {
  console.log("Service Worker: Background sync triggered", event.tag);

  if (event.tag === "sync-offline-actions") {
    event.waitUntil(syncOfflineActions());
  }
});

// Sync offline actions when connection restored
async function syncOfflineActions() {
  try {
    // Get offline actions from IndexedDB or localStorage
    const offlineActions = await getOfflineActions();

    for (const action of offlineActions) {
      try {
        await fetch(action.url, {
          method: action.method,
          headers: action.headers,
          body: action.body,
        });

        // Remove successful action from offline storage
        await removeOfflineAction(action.id);
      } catch (error) {
        console.error("Failed to sync action:", action, error);
      }
    }

    // Notify clients that sync is complete
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({ type: "SYNC_COMPLETE" });
    });
  } catch (error) {
    console.error("Background sync failed:", error);
  }
}

// Placeholder functions for offline action storage (implement with IndexedDB)
async function getOfflineActions() {
  // TODO: Implement with IndexedDB
  return [];
}

async function removeOfflineAction(id) {
  // TODO: Implement with IndexedDB
}

// Push notifications (if needed later)
self.addEventListener("push", (event) => {
  if (event.data) {
    const data = event.data.json();

    const options = {
      body: data.body,
      icon: "/icons/icon-192x192.png",
      badge: "/icons/badge-72x72.png",
      data: data.data,
      actions: data.actions || [],
      requireInteraction: true,
    };

    event.waitUntil(self.registration.showNotification(data.title, options));
  }
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const data = event.notification.data;

  if (data && data.url) {
    event.waitUntil(clients.openWindow(data.url));
  } else {
    event.waitUntil(clients.openWindow("/admin"));
  }
});

console.log("Service Worker: Loaded and ready");
