import { publicPath, safeAttribution } from "./attribution";
import { getPublicCtaForHref, isPublicCta } from "./publicCtas";
const ATTRIBUTION_KEY = "arcan_attribution";
let initialized = false;

// These are the only direct-contact destinations published by Arcan. Events
// carry a category rather than the address so personal data and query strings
// can never enter analytics payloads.
const VERIFIED_BUSINESS_DESTINATIONS = Object.freeze({
  "tel:+14167272148": { event: "click_to_call", destination: "phone" },
  "mailto:info@arcanpainting.ca": { event: "click_to_email", destination: "email" },
});

function clean(value, max = 200) {
  return typeof value === "string" ? value.slice(0, max) : "";
}

export function getAttribution() {
  if (typeof window === "undefined") return {};
  try {
    return safeAttribution(JSON.parse(window.sessionStorage.getItem(ATTRIBUTION_KEY) || "{}"));
  } catch {
    return {};
  }
}

export function initializeAnalytics() {
  if (typeof window === "undefined" || publicPath(window.location.pathname) === "/other" || initialized) return;
  initialized = true;
  window.dataLayer = window.dataLayer || [];

  const params = new URLSearchParams(window.location.search);
  const existing = getAttribution();
  const attribution = safeAttribution({
    landingPage: existing.landingPage || publicPath(window.location.pathname),
    referrer: existing.referrer || clean(document.referrer, 500),
    utmSource: existing.utmSource || clean(params.get("utm_source")),
    utmMedium: existing.utmMedium || clean(params.get("utm_medium")),
    utmCampaign: existing.utmCampaign || clean(params.get("utm_campaign")),
    utmContent: existing.utmContent || clean(params.get("utm_content")),
    utmTerm: existing.utmTerm || clean(params.get("utm_term")),
  });
  try { window.sessionStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(attribution)); } catch { /* Storage may be disabled. */ }

  document.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target.closest("a,button") : null;
    if (!target) return;
    const href = target instanceof HTMLAnchorElement ? target.getAttribute("href") || "" : "";
    const contactDestination = getVerifiedBusinessDestination(href);
    if (contactDestination) {
      trackEvent(contactDestination.event, { location: publicPath(window.location.pathname), destination: contactDestination.destination });
      return;
    }

    const label = target.getAttribute("data-cta") || "";
    const declaredDestination = target.getAttribute("data-cta-destination") || "";
    const publicHref = target instanceof HTMLAnchorElement ? target.getAttribute("href") || "" : "";
    const destination = declaredDestination || publicHref;
    if (isPublicCta(label, destination, publicHref)) {
      const cta = getPublicCtaForHref(destination);
      trackEvent("cta_click", { location: publicPath(window.location.pathname), label, destination: cta.destination });
    }
  });

  document.addEventListener("invalid", (event) => {
    const field = event.target;
    if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement || field instanceof HTMLSelectElement) {
      trackEvent("form_validation_error", { form: clean(field.form?.id || field.form?.getAttribute("name") || "unknown"), field: clean(field.name || field.id || "unknown") });
    }
  }, true);

  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
  if (measurementId && /^G-[A-Z0-9]+$/.test(measurementId)) {
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    document.head.appendChild(script);
    window.gtag = window.gtag || function gtag() { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", measurementId, { send_page_view: false, anonymize_ip: true, page_location: `${window.location.origin}${publicPath(window.location.pathname)}`, page_referrer: attribution.referrer || "", allow_google_signals: false });
  }
}

function getVerifiedBusinessDestination(href) {
  if (typeof href !== "string" || /[?#]/.test(href)) return null;
  return VERIFIED_BUSINESS_DESTINATIONS[href.trim().toLowerCase()] || null;
}

export function trackEvent(eventName, properties = {}) {
  if (typeof window === "undefined" || publicPath(window.location.pathname) === "/other") return;
  initializeAnalytics();
  const event = { event: eventName, ...properties };
  window.dataLayer.push(event);
  if (typeof window.gtag === "function") window.gtag("event", eventName, properties);
}

export function trackPageView(path) {
  const page = publicPath(path);
  if (page === "/other") return;
  trackEvent("page_view", { page_path: page, page_location: `${window.location.origin}${page}`, page_referrer: getAttribution().referrer || "", page_title: document.title });
}
