import { beforeEach, describe, expect, it } from "vitest";
import { getAttribution, initializeAnalytics, trackEvent } from "@/utils/analytics";

describe("public analytics event layer", () => {
  beforeEach(() => {
    window.dataLayer = [];
    window.sessionStorage.clear();
    window.history.replaceState({}, "", "/interior-painting?utm_source=search&utm_campaign=summer");
  });

  it("stores first-touch attribution and emits vendor-neutral events", () => {
    initializeAnalytics();
    expect(getAttribution()).toMatchObject({ landingPage: "/interior-painting?utm_source=search&utm_campaign=summer", utmSource: "search", utmCampaign: "summer" });
    trackEvent("lead_submit_success", { service_type: "interior" });
    expect(window.dataLayer).toContainEqual({ event: "lead_submit_success", service_type: "interior" });
  });

  it("tracks click-to-call, click-to-email, CTA, and invalid fields", () => {
    initializeAnalytics();
    document.body.innerHTML = '<a href="tel:+14167272148">Call</a><a href="mailto:info@arcanpainting.ca">Email</a><button>Discuss Your Project</button><form id="contact"><input name="email" required></form>';
    document.querySelectorAll("a").forEach((link) => link.addEventListener("click", (event) => event.preventDefault()));
    document.querySelector('[href^="tel:"]').click();
    document.querySelector('[href^="mailto:"]').click();
    document.querySelector('button').click();
    document.querySelector('input').dispatchEvent(new Event("invalid", { bubbles: false, cancelable: true }));
    const names = window.dataLayer.map((item) => item.event);
    expect(names).toEqual(expect.arrayContaining(["click_to_call", "click_to_email", "cta_click", "form_validation_error"]));
  });
});
