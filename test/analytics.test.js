import { createElement } from "react";
import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { ButtonLink } from "@/components/premium/primitives";
import { getAttribution, initializeAnalytics, trackEvent } from "@/utils/analytics";

describe("public analytics event layer", () => {
  beforeEach(() => {
    window.dataLayer = [];
    window.sessionStorage.clear();
    window.history.replaceState({}, "", "/interior-painting?utm_source=search&utm_campaign=summer");
  });

  it("stores first-touch attribution and emits vendor-neutral events", () => {
    initializeAnalytics();
    expect(getAttribution()).toMatchObject({ landingPage: "/interior-painting", utmSource: "search", utmCampaign: "summer" });
    trackEvent("lead_submit_success", { service_type: "interior" });
    expect(window.dataLayer).toContainEqual({ event: "lead_submit_success", service_type: "interior" });
  });

  it("tracks verified contact links, allowlisted CTAs, and invalid fields", () => {
    initializeAnalytics();
    initializeAnalytics();
    document.body.innerHTML = '<a href="tel:+14167272148">Call</a><a href="mailto:info@arcanpainting.ca">Email</a><form id="contact"><input name="email" required></form>';
    const { container } = render(createElement(ButtonLink, { href: "#work" }, createElement("svg", null, createElement("path"))));
    document.querySelectorAll("a").forEach((link) => link.addEventListener("click", (event) => event.preventDefault()));
    const dispatchClick = (element) => element.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    dispatchClick(document.querySelector('[href^="tel:"]'));
    dispatchClick(document.querySelector('[href^="mailto:"]'));
    dispatchClick(container.querySelector("svg"));
    document.querySelector('input').dispatchEvent(new Event("invalid", { bubbles: false, cancelable: true }));
    const names = window.dataLayer.map((item) => item.event);
    expect(names).toEqual(expect.arrayContaining(["click_to_call", "click_to_email", "cta_click", "form_validation_error"]));
    expect(window.dataLayer).toContainEqual({ event: "click_to_call", location: "/interior-painting", destination: "phone" });
    expect(window.dataLayer).toContainEqual({ event: "click_to_email", location: "/interior-painting", destination: "email" });
    expect(window.dataLayer).toContainEqual({ event: "cta_click", location: "/interior-painting", label: "selected_work", destination: "#work" });
  });

  it("does not emit arbitrary CTA labels or private contact destinations", () => {
    initializeAnalytics();
    document.body.innerHTML = [
      '<a href="tel:+14167272148?customer=private">Private query</a>',
      '<a href="tel:+14165551234">Unverified phone</a>',
      '<a href="mailto:someone@example.com">Unverified email</a>',
      '<a href="/contact?email=private@example.com" data-cta="contact" data-cta-destination="/contact">Private query</a>',
      '<button data-cta="contact" data-cta-destination="/private-customer">Private destination</button>',
    ].join("");
    document.querySelectorAll("a").forEach((link) => link.addEventListener("click", (event) => event.preventDefault()));
    document.querySelectorAll("a,button").forEach((element) => element.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true })));

    expect(window.dataLayer.filter((item) => ["click_to_call", "click_to_email", "cta_click"].includes(item.event))).toEqual([]);
  });

  it.each([
    ["/contact", "contact", "/contact"],
    ["/quote", "quote", "/quote"],
    ["/projects", "selected_work", "/projects"],
    ["#work", "selected_work", "#work"],
    ["#enquire", "project_enquiry", "#enquire"],
    ["/interior-painting", "interior_painting", "/interior-painting"],
    ["/wallpaper-services", "wallpaper", "/wallpaper-services"],
    ["/specialty-finishes", "specialty_finishes", "/specialty-finishes"],
    ["/commercial-painting", "commercial_painting", "/commercial-painting"],
    ["/exterior-painting", "exterior_painting", "/exterior-painting"],
  ])("renders the approved CTA metadata for %s", (href, label, destination) => {
    const { container } = render(createElement(ButtonLink, { href, "data-cta": "untrusted", "data-cta-destination": "/private" }, "Open"));
    const link = container.querySelector("a");
    expect(link).toHaveAttribute("data-cta", label);
    expect(link).toHaveAttribute("data-cta-destination", destination);
  });
});

it('never emits page views or events for private customer URLs', async () => {
  const { trackPageView } = await import('@/utils/analytics');
  window.dataLayer=[];
  window.history.replaceState({},'', '/i/private-invoice?token=private');
  trackPageView(window.location.pathname+window.location.search);
  trackEvent('form_validation_error',{field:'private-customer-field'});
  expect(window.dataLayer).toEqual([]);
});
