// Public CTA destinations are deliberately finite. This keeps analytics
// labels and destinations useful without allowing arbitrary copy, query
// strings, or internal URLs into the event layer.
const CTA_DEFINITIONS = [
  ["/contact", "contact"],
  ["/quote", "quote"],
  ["/projects", "selected_work"],
  ["#work", "selected_work"],
  ["#enquire", "project_enquiry"],
  ["/interior-painting", "interior_painting"],
  ["/wallpaper-services", "wallpaper"],
  ["/specialty-finishes", "specialty_finishes"],
  ["/commercial-painting", "commercial_painting"],
  ["/exterior-painting", "exterior_painting"],
].map(([destination, label]) => [destination, { destination, label }]);

export const PUBLIC_CTA_BY_HREF = Object.freeze(Object.fromEntries(CTA_DEFINITIONS));

export function getPublicCtaForHref(href) {
  return typeof href === "string" ? PUBLIC_CTA_BY_HREF[href] : undefined;
}

export function isPublicCta(label, destination, href = "") {
  const cta = getPublicCtaForHref(destination || href);
  return Boolean(cta && cta.label === label && (!href || href === cta.destination));
}
