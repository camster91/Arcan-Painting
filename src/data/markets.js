import { LUXURY_GTA } from "./landingPages.js";

// Market pages for luxury painting, Toronto northward to Barrie.
//
// Guardrail (REMEDIATION.md): location pages stay noindexed and out of the
// sitemap until the client approves each service area. All markets below were
// approved by the owner on 2026-09-30. Set `approved` to false to noindex one.
// Neighbourhood names are geography only. Do not add claims about past work in
// a market unless it is documented in PROOF_REGISTER.md.

export const MARKETS = {
  toronto: {
    name: "Toronto",
    theme: "navy",
    approved: true,
    image: "PXL_20250217_224338011_MP.webp",
    alt: "Freshly painted living room with white walls and dark hardwood floors",
    areas: ["Rosedale", "Forest Hill", "Yorkville", "Lawrence Park", "Bridle Path", "The Kingsway", "Bayview Village", "Leaside"],
    intro:
      "Luxury painting for Toronto homes, from heritage residences with detailed millwork to modern condos and custom builds — Venetian plaster, limewash, wallcoverings and precise trim work.",
    context:
      "Older Toronto homes often carry plaster, layered coatings and decorative trim that need careful assessment before a new finish goes on. Newer builds and condos call for clean lines, deep colour and feature walls. Either way, the scope is reviewed room by room.",
    faq: ["Do you paint heritage and older Toronto homes?", "Older homes can have layered coatings, plaster repairs and detailed millwork. Share photos and what you'd like to achieve, and the team can review the surfaces and scope with you."],
  },
  vaughan: {
    name: "Vaughan",
    theme: "burgundy",
    approved: true,
    image: "PXL_20251018_142500065.webp",
    alt: "Dining room finished with a patterned wallcovering and a dark painted ceiling",
    areas: ["Kleinburg", "Woodbridge", "Maple", "Thornhill", "Vellore Village"],
    intro:
      "Luxury painting for Vaughan homes: statement wallcoverings, plaster and limewash finishes, and deep, high-contrast rooms with sharp, clean lines.",
    context:
      "Larger homes bring tall foyers, long staircases and feature walls where finish quality is very visible. Those are the areas where preparation and lines matter most.",
    faq: ["Can you paint tall foyers and staircases?", "Yes — staircases and feature walls are part of the work. Access, height and the finish you want are reviewed as part of the project scope."],
  },
  "richmond-hill": {
    name: "Richmond Hill",
    theme: "teal",
    approved: true,
    image: "IMG-20260212-WA0016.webp",
    alt: "Staircase refinished with black treads, white risers and white balusters",
    areas: ["Bayview Hill", "Oak Ridges", "Mill Pond", "Jefferson", "Richvale"],
    intro:
      "Luxury interior painting in Richmond Hill — refined finishes, wallcoverings and high-contrast details for family homes and custom builds.",
    context:
      "Staircases, trim and open-plan rooms benefit from a finish that stays crisp under daily use. Samples and test areas help confirm colour and sheen in your own light.",
    faq: ["Can a staircase be refinished with a dark and white scheme?", "Yes. Treads, risers and balusters can be refinished with contrasting colours. Share photos and the look you want and the team can review the scope."],
  },
  markham: {
    name: "Markham",
    theme: "charcoal",
    approved: true,
    image: "PXL_20260213_210915996.webp",
    alt: "Bedroom wall finished with a soft floral wallpaper",
    areas: ["Unionville", "Angus Glen", "Cornell", "Berczy Village", "Markham Village"],
    intro:
      "Luxury painting and wallcovering installation in Markham, including designer wallpaper, plaster and limewash finishes, and precise trim work.",
    context:
      "Wallcoverings and feature walls reward careful surface preparation and pattern matching. Share the product and wall dimensions and the team can review the installation scope.",
    faq: ["Do you install designer wallpaper?", "Yes. Wallcovering installation is one of Arcan's services. Share the product, pattern repeat and wall dimensions so the team can review the surface and scope."],
  },
  "king-city": {
    name: "King City",
    theme: "terracotta",
    approved: true,
    image: "PXL_20251009_180850831.webp",
    alt: "Painter installing a botanical mural wallcovering from a ladder",
    areas: ["King City", "Nobleton", "Schomberg", "Kettleby"],
    intro:
      "Luxury painting for King City and King Township homes — murals, wallcoverings, plaster and limewash, and exterior refinishing planned around the property.",
    context:
      "Larger properties often combine interior finishes with exterior doors, trim and outbuildings. The scope can be planned across both.",
    faq: ["Can interior and exterior work be planned together?", "Yes. Describe the interior rooms and exterior surfaces together and the team can review the whole scope and how it might be sequenced."],
  },
  aurora: {
    name: "Aurora",
    theme: "navy",
    approved: true,
    image: "20251012_165336.webp",
    alt: "Brick house with a freshly painted front door and garage door",
    areas: ["Aurora Highlands", "Bayview Northeast", "Aurora Heights", "St. Andrews Valley"],
    intro:
      "Luxury painting in Aurora: refined interiors, front doors and exterior details, and specialty finishes with clean, sharp lines.",
    context:
      "A front door, garage door and trim can change how a home reads from the street. Exterior work is planned around surface condition and weather.",
    faq: ["Can you refinish front doors and garage doors?", "Yes. Exterior doors, trim and window frames are part of the exterior painting service. Photos of the current condition help with the review."],
  },
  newmarket: {
    name: "Newmarket",
    theme: "burgundy",
    approved: true,
    image: "PXL_20250217_224338011_MP.webp",
    alt: "Freshly painted living room with white walls and dark hardwood floors",
    areas: ["Stonehaven", "Glenway", "Bogart", "Armitage"],
    intro:
      "Interior painting and specialty finishes for Newmarket homes, from deep accent colours to plaster, limewash and wallcoverings.",
    context:
      "Accent colours and feature walls can make a room feel considered without a full renovation. Sample areas help confirm the colour before committing.",
    faq: ["Can I try a colour before the whole room is painted?", "Ask about a sample or test area. It lets you see colour and sheen in your own lighting before the full scope is confirmed."],
  },
  bradford: {
    name: "Bradford West Gwillimbury",
    theme: "charcoal",
    approved: true,
    image: "IMG-20260212-WA0016.webp",
    alt: "Staircase refinished with black treads, white risers and white balusters",
    areas: ["Bradford", "Bond Head", "Newton Robinson"],
    intro:
      "Interior painting and staircase refinishing in Bradford West Gwillimbury, with attention to preparation, colour and clean lines.",
    context:
      "Family homes see heavy use on stairs, trim and doors. A durable, well-prepared finish keeps those surfaces looking sharp.",
    faq: ["How are stairs and trim prepared?", "Surfaces are cleaned, filled and sanded before coating so the finish bonds properly and stays crisp. Condition is reviewed as part of the scope."],
  },
  barrie: {
    name: "Barrie",
    theme: "teal",
    approved: true,
    image: "PXL_20260213_210915996.webp",
    alt: "Bedroom wall finished with a soft floral wallpaper",
    areas: ["Innisfil", "Midhurst", "Orillia", "Collingwood"],
    intro:
      "Luxury painting for Barrie and the Simcoe area — wallcoverings, plaster and limewash finishes, and refined interior and exterior painting.",
    context:
      "Homes in and around Barrie include lakeside properties, larger family builds and cottages. Interior finishes and exterior surfaces can be reviewed together.",
    faq: ["Do you work in Barrie and Simcoe County?", "Tell the team your address when you get in touch and they can confirm whether it is within range before any work is booked."],
  },
};

export const MARKET_SLUGS = Object.keys(MARKETS);

export function marketPath(slug) {
  return `/luxury-painting/${slug}`;
}

// Same shape as LUXURY_GTA so the LandingPage component can render either.
export function buildMarketPage(slug) {
  const m = MARKETS[slug];
  if (!m) return null;
  return {
    ...LUXURY_GTA,
    path: marketPath(slug),
    service: "Luxury Painting",
    eyebrow: `Luxury painting · ${m.name}`,
    headline: "Luxury painting in",
    headlineEm: `${m.name}.`,
    intro: m.intro,
    theme: m.theme,
    heroImage: m.image,
    heroAlt: m.alt,
    context: m.context,
    areasTitle: `Serving ${m.name} and nearby`,
    areas: m.areas,
    areasNote: "Not sure whether your address is covered? Ask when you get in touch.",
    faqs: [m.faq, ...LUXURY_GTA.faqs.filter(([q]) => !q.startsWith("Which parts"))],
  };
}
