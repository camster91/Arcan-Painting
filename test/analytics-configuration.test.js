import { afterEach, beforeEach, expect, it, vi } from "vitest";

beforeEach(() => {
  vi.resetModules();
  sessionStorage.clear();
  window.dataLayer = [];
  delete window.gtag;
  window.history.replaceState({}, "", "/");
  document.head.querySelectorAll('script[src*="googletagmanager"]').forEach(script => script.remove());
});
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

it("requires both an approved public measurement ID and explicit enable flag", async () => {
  vi.stubEnv("VITE_GA_MEASUREMENT_ID", "G-FIXTURE123");
  vi.stubEnv("NEXT_PUBLIC_ENABLE_ANALYTICS", "false");
  (await import("@/utils/analytics")).initializeAnalytics();
  expect(document.querySelector('script[src*="googletagmanager"]')).toBeNull();
});

it("loads one configured tag and strips query and hash from page-view telemetry", async () => {
  vi.stubEnv("VITE_GA_MEASUREMENT_ID", "G-FIXTURE123");
  vi.stubEnv("NEXT_PUBLIC_ENABLE_ANALYTICS", "true");
  window.history.replaceState({}, "", "/quote?email=fixture@example.test#private");
  const { initializeAnalytics, trackPageView } = await import("@/utils/analytics");
  initializeAnalytics(); initializeAnalytics();
  trackPageView("/quote?email=fixture@example.test#private");
  expect(document.querySelectorAll('script[src*="googletagmanager"]')).toHaveLength(1);
  const events = window.dataLayer.map(item => item.event ? item : Array.from(item));
  expect(events).toContainEqual({ event: "page_view", page_path: "/quote", page_title: document.title });
  expect(JSON.stringify(events)).not.toContain("fixture@example.test");
});

it("blocked storage or a failing analytics vendor cannot throw into the form", async () => {
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("storage blocked"); });
  const { initializeAnalytics, trackEvent } = await import("@/utils/analytics");
  expect(() => initializeAnalytics()).not.toThrow();
  window.gtag = () => { throw new Error("vendor unavailable"); };
  expect(() => trackEvent("lead_submit_success", { source: "site_cta" })).not.toThrow();
});

it("does not initialize or emit marketing events on account or CRM pages", async () => {
  const { initializeAnalytics, trackEvent } = await import("@/utils/analytics");
  for (const path of ["/admin", "/admin/leads/123", "/account/signin"]) {
    window.history.replaceState({}, "", path);
    initializeAnalytics();
    trackEvent("page_view", { page_path: path });
  }
  expect(window.dataLayer).toEqual([]);
  expect(sessionStorage.getItem("arcan_attribution")).toBeNull();
});

it("counts contact intent without collecting phone or email destinations", async () => {
  const { initializeAnalytics } = await import("@/utils/analytics");
  initializeAnalytics();
  document.body.innerHTML = '<a href="tel:+14165550101">Call</a><a href="mailto:fixture@example.test">Email</a>';
  for (const link of document.querySelectorAll("a")) {
    link.addEventListener("click", event => event.preventDefault());
    link.click();
  }
  expect(window.dataLayer).toContainEqual({ event: "click_to_call", location: "/" });
  expect(window.dataLayer).toContainEqual({ event: "click_to_email", location: "/" });
  expect(JSON.stringify(window.dataLayer)).not.toMatch(/fixture@example|4165550101/);
});
