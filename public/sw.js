// One-time migration worker for the former CRM service worker.
//
// Keep this file network-only. Existing registrations can survive the public
// site migration, so this worker must not serve cached CRM pages or API data.
const ARCAN_CACHE_NAMES = Object.freeze([
  "arcan-crm-v1",
  "arcan-static-v1",
  "arcan-dynamic-v1",
]);

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    await self.clients.claim();
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames
        .filter((cacheName) => ARCAN_CACHE_NAMES.includes(cacheName))
        .map((cacheName) => caches.delete(cacheName)),
    );
    await self.registration.unregister();
  })());
});

self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
