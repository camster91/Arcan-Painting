const ATTRIBUTION_KEY = "arcan_attribution";
let initialized = false;

function clean(value, max = 200) {
  return typeof value === "string" ? value.slice(0, max) : "";
}

function isPrivatePage() {
  return /^\/(?:admin|account)(?:\/|$)/.test(window.location.pathname);
}

export function getAttribution() {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.sessionStorage.getItem(ATTRIBUTION_KEY) || "{}");
  } catch {
    return {};
  }
}

export function initializeAnalytics() {
  try { initializeAnalyticsInternal(); } catch { /* Analytics must never block an enquiry. */ }
}

function initializeAnalyticsInternal() {
  if (typeof window === "undefined" || isPrivatePage() || initialized) return;
  initialized = true;
  window.dataLayer = window.dataLayer || [];

  const params = new URLSearchParams(window.location.search);
  const existing = getAttribution();
  const attribution = {
    landingPage: existing.landingPage || clean(`${window.location.pathname}${window.location.search}`, 500),
    referrer: existing.referrer || clean(document.referrer, 500),
    utmSource: existing.utmSource || clean(params.get("utm_source")),
    utmMedium: existing.utmMedium || clean(params.get("utm_medium")),
    utmCampaign: existing.utmCampaign || clean(params.get("utm_campaign")),
    utmContent: existing.utmContent || clean(params.get("utm_content")),
    utmTerm: existing.utmTerm || clean(params.get("utm_term")),
  };
  window.sessionStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(attribution));

  document.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target.closest("a,button") : null;
    if (!target) return;
    const href = target instanceof HTMLAnchorElement ? target.getAttribute("href") || "" : "";
    if (href.startsWith("tel:")) trackEvent("click_to_call", { location: clean(window.location.pathname) });
    else if (href.startsWith("mailto:")) trackEvent("click_to_email", { location: clean(window.location.pathname) });
    else if (target instanceof HTMLButtonElement && /discuss your project|contact|get quote|project review/i.test(target.textContent || "")) {
      trackEvent("cta_click", { location: clean(window.location.pathname), label: clean((target.textContent || "").trim()) });
    }
  });

  document.addEventListener("invalid", (event) => {
    const field = event.target;
    if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement || field instanceof HTMLSelectElement) {
      trackEvent("form_validation_error", { form: clean(field.form?.id || field.form?.getAttribute("name") || "unknown"), field: clean(field.name || field.id || "unknown") });
    }
  }, true);

  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
  if (import.meta.env.NEXT_PUBLIC_ENABLE_ANALYTICS === "true" && measurementId && /^G-[A-Z0-9]+$/.test(measurementId)) {
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    document.head.appendChild(script);
    window.gtag = window.gtag || function gtag() { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", measurementId, {
      send_page_view: false,
      page_location: `${window.location.origin}${window.location.pathname}`,
      page_referrer: withoutQuery(document.referrer),
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
    });
  }
}

export function trackEvent(eventName, properties = {}) {
  if (typeof window === "undefined" || isPrivatePage()) return;
  try {
    initializeAnalytics();
    const event = { event: eventName, ...properties };
    window.dataLayer.push(event);
    if (typeof window.gtag === "function") window.gtag("event", eventName, {
      ...properties,
      page_location: `${window.location.origin}${window.location.pathname}`,
      page_referrer: withoutQuery(document.referrer),
    });
  } catch { /* Vendor scripts or blocked storage cannot interrupt form submission. */ }
}

export function trackPageView(path) {
  trackEvent("page_view", { page_path: path.split(/[?#]/)[0], page_title: document.title });
}

function withoutQuery(value) {
  try { const url = new URL(value); return `${url.origin}${url.pathname}`; } catch { return ""; }
}
