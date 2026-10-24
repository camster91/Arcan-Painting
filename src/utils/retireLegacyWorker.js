const LEGACY_WORKER_PATH = "/sw.js";

function isRootLegacyRegistration(registration, origin) {
  try {
    const scope = new URL(registration.scope);
    const worker = registration.active || registration.waiting || registration.installing;
    const script = worker && new URL(worker.scriptURL);
    return scope.origin === origin
      && scope.pathname === "/"
      && script?.origin === origin
      && script.pathname === LEGACY_WORKER_PATH;
  } catch {
    return false;
  }
}

/**
 * Ask an existing root Arcan service-worker registration to install the
 * network-only retirement worker at /sw.js. The worker unregisters itself once
 * it has claimed clients and removed only its known caches.
 */
export async function retireLegacyWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  try {
    const serviceWorker = navigator.serviceWorker;
    if (typeof serviceWorker.getRegistrations !== "function") return;
    const registrations = await serviceWorker.getRegistrations();
    const matches = registrations.filter((registration) =>
      isRootLegacyRegistration(registration, window.location.origin),
    );
    await Promise.all(matches.map((registration) =>
      Promise.resolve(registration.update()).catch(() => undefined),
    ));
  } catch {
    // Service-worker retirement is best effort and must never affect the site.
  }
}
