const CACHE_NAME = "arcan-crm-v2";
const STATIC_CACHE = "arcan-static-v2";
const DYNAMIC_CACHE = "arcan-dynamic-v2";
const OUTBOX_DB = "arcan-field-outbox";
const OUTBOX_STORE = "actions";
const OUTBOX_VERSION = 1;
const MAX_OUTBOX_BODY_BYTES = 100000;
const MAX_SYNC_ATTEMPTS = 10;

// Static assets to cache
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
];

// Only absolute, conflict-safe field updates are eligible for offline retry.
// Creates, payments, approvals, and deletes must fail visibly while offline.
const OFFLINE_MUTATION_ROUTES = new Map([
  ["/api/completion-workflows", new Set(["PUT"])],
  ["/api/project-progress", new Set(["PUT"])],
  ["/api/projects", new Set(["PUT"])],
]);

// Install event - cache static assets
self.addEventListener("install", (event) => {
  console.log("Service Worker: Installing...");

  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        console.log("Service Worker: Caching static assets...");
        return Promise.allSettled(STATIC_ASSETS.map((asset) => cache.add(asset)));
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

  if (url.origin !== self.location.origin) {
    return;
  }

  if (request.method !== "GET") {
    if (isOfflineMutation(url.pathname, request.method)) {
      event.respondWith(handleFieldMutation(request));
    } else if (url.pathname === "/api/local-auth/logout") {
      event.respondWith(handleLogout(request));
    } else if (url.pathname === "/api/local-auth/login") {
      event.respondWith(handleLogin(request));
    }
    return;
  }

  // Authenticated API data is never persisted in Cache Storage. This prevents
  // one user seeing another user's stale CRM data on a shared field device.
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(fetch(request).catch(() => offlineApiResponse()));
    return;
  }

  // Handle page requests with network-first strategy
  if (request.headers.get("accept")?.includes("text/html")) {
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
    return offlineApiResponse();
  }
}

// Page Request Handler - Network first
async function handlePageRequest(request) {
  try {
    console.log("Service Worker: Fetching page from network", request.url);
    const response = await fetch(request);

    if (response.ok && !new URL(request.url).pathname.startsWith("/admin")) {
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
      new Response(
        "<!doctype html><html><head><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>Arcan Painting offline</title></head><body style=\"font-family:system-ui;padding:2rem;max-width:40rem;margin:auto\"><h1>You are offline</h1><p>Previously queued field updates will retry when this signed-in device reconnects. New financial, approval, and deletion actions require a connection.</p></body></html>",
        { status: 503, headers: { "Content-Type": "text/html", "Cache-Control": "no-store" } },
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

function offlineApiResponse() {
  return new Response(JSON.stringify({ error: "Offline", message: "A network connection is required for current CRM data." }), {
    status: 503,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

function isOfflineMutation(pathname, method) {
  return OFFLINE_MUTATION_ROUTES.get(pathname)?.has(method.toUpperCase()) || false;
}

async function handleFieldMutation(request) {
  try {
    return await fetch(request.clone());
  } catch {
    const body = await request.clone().text();
    if (new TextEncoder().encode(body).byteLength > MAX_OUTBOX_BODY_BYTES) return offlineApiResponse();
    const action = {
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      url: new URL(request.url).pathname + new URL(request.url).search,
      method: request.method,
      headers: Array.from(request.headers.entries()).filter(([name]) => ["content-type", "x-csrf-token"].includes(name.toLowerCase())),
      body,
      createdAt: Date.now(),
      attempts: 0,
    };
    await putOfflineAction(action);
    if (self.registration.sync) await self.registration.sync.register("sync-offline-actions").catch(() => {});
    await notifyClients({ type: "OUTBOX_QUEUED", actionId: action.id });
    return new Response(JSON.stringify({ success: true, queued: true, offline: true, action_id: action.id }), {
      status: 202,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  }
}

async function handleLogout(request) {
  const response = await fetch(request);
  if (response.ok) await clearOfflineState();
  return response;
}

async function handleLogin(request) {
  // Never replay one operator's queued actions under a later session.
  await clearOfflineState();
  return fetch(request);
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
        const response = await fetch(action.url, {
          method: action.method,
          headers: new Headers(action.headers),
          body: action.body,
          credentials: "include",
        });
        if (response.ok) {
          await removeOfflineAction(action.id);
          await notifyClients({ type: "OUTBOX_SYNCED", actionId: action.id });
          continue;
        }
        if ([400, 401, 403, 404, 409, 422].includes(response.status)) {
          await removeOfflineAction(action.id);
          await notifyClients({ type: "OUTBOX_FAILED", actionId: action.id, status: response.status });
          continue;
        }
        await incrementOfflineAttempt(action);
        break;
      } catch (error) {
        await incrementOfflineAttempt(action);
        break;
      }
    }

    // Notify clients that sync is complete
    await notifyClients({ type: "SYNC_COMPLETE" });
  } catch (error) {
    console.error("Background sync failed:", error);
  }
}

function openOutbox() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(OUTBOX_DB, OUTBOX_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(OUTBOX_STORE)) db.createObjectStore(OUTBOX_STORE, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withOutbox(mode, operation) {
  const db = await openOutbox();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(OUTBOX_STORE, mode);
    const store = tx.objectStore(OUTBOX_STORE);
    operation(store);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

async function putOfflineAction(action) {
  return withOutbox("readwrite", (store) => store.put(action));
}

async function getOfflineActions() {
  const db = await openOutbox();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(OUTBOX_STORE, "readonly");
    const request = tx.objectStore(OUTBOX_STORE).getAll();
    request.onsuccess = () => resolve(request.result.sort((a, b) => a.createdAt - b.createdAt));
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

async function removeOfflineAction(id) {
  return withOutbox("readwrite", (store) => store.delete(id));
}

async function incrementOfflineAttempt(action) {
  action.attempts = Number(action.attempts || 0) + 1;
  if (action.attempts >= MAX_SYNC_ATTEMPTS) {
    await removeOfflineAction(action.id);
    await notifyClients({ type: "OUTBOX_FAILED", actionId: action.id, status: "retry_limit" });
  } else {
    await putOfflineAction(action);
  }
}

async function clearOfflineState() {
  await withOutbox("readwrite", (store) => store.clear()).catch(() => {});
  await Promise.all((await caches.keys()).map((name) => caches.delete(name)));
}

async function notifyClients(message) {
  const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  windows.forEach((client) => client.postMessage(message));
}

self.addEventListener("message", (event) => {
  if (event.data?.type === "SYNC_NOW") event.waitUntil(syncOfflineActions());
  if (event.data?.type === "CLEAR_OFFLINE_STATE") event.waitUntil(clearOfflineState());
});

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
