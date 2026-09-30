import { LUXURY_GTA } from "./landingPages.js";
import { PHOTOS } from "./photos.js";

// Market pages for luxury painting, Toronto northward to Barrie.
//
// Guardrail (REMEDIATION.md): location pages stay noindexed and out of the
// sitemap until the client approves each service area. All markets below were
// approved by the owner on 2026-09-30. Set `approved` to false to noindex one.
// Local notes describe typical housing and rooms in general terms only. Do not
// add claims about past work in a market unless PROOF_REGISTER.md documents it.

export const MARKETS = {
  toronto: {
    name: "Toronto",
    approved: true,
    photo: PHOTOS.staircaseLong,
    areas: ["Rosedale", "Forest Hill", "Yorkville", "Lawrence Park", "Bridle Path", "The Kingsway", "Bayview Village", "Leaside"],
    intro: "Luxury painting for Toronto homes, from heritage residences with detailed millwork to modern condos and custom builds: Venetian plaster, limewash, wallcoverings and precise trim work.",
    context: "Older Toronto homes often carry plaster walls, layered coatings and decorative trim that need careful assessment before a new finish goes on.",
    architecture: "In neighbourhoods like Rosedale, Forest Hill and Lawrence Park, many houses pair original mouldings and plaster with renovated kitchens and additions, so a scheme has to work across old and new surfaces. Downtown condos and custom infill homes call for the opposite: flat, crisp walls, deep colour and feature walls with clean lines.",
    faqs: [
      ["Do you paint heritage and older Toronto homes?", "Yes. Older homes can have layered coatings, plaster repairs and detailed millwork. Share photos and what you'd like to achieve, and the team can review the surfaces and scope with you."],
      ["Can you work in a condo building?", "Condo work usually involves building rules for elevators, parking and working hours. Share your building's requirements and the team can plan around them."],
      ["Can Venetian plaster go on old plaster walls?", "Often, once the walls are repaired and sound. Cracks, loose areas and previous coatings are reviewed first so the finish bonds and stays smooth."],
    ],
  },
  vaughan: {
    name: "Vaughan",
    approved: true,
    photo: PHOTOS.rugRoom,
    areas: ["Kleinburg", "Woodbridge", "Maple", "Thornhill", "Vellore Village"],
    intro: "Luxury painting for Vaughan homes: statement wallcoverings, plaster and limewash finishes, and deep, high-contrast rooms with sharp, clean lines.",
    context: "Larger homes bring tall foyers, long staircases and feature walls where finish quality is very visible.",
    architecture: "Custom builds in Kleinburg and estate homes in Woodbridge and Maple often have double-height entries, coffered ceilings and open-plan living spaces. These are the areas where preparation, sightlines and straight edges matter most, and where a single plaster or wallcovering feature can set the tone for the whole house.",
    faqs: [
      ["Can you paint tall foyers and staircases?", "Yes. Staircases and feature walls are part of the work. Access, height and the finish you want are reviewed as part of the project scope."],
      ["Can a coffered or tray ceiling be painted a different colour?", "Yes. Ceiling details can be picked out in a contrasting colour or sheen. Share photos and the look you want, and the team can plan the edges and sequence."],
      ["Do you work on new custom builds?", "Yes. Share the build schedule and finish specifications, and the team can review timing and coordination with your builder or designer."],
    ],
  },
  "richmond-hill": {
    name: "Richmond Hill",
    approved: true,
    photo: PHOTOS.muralInstall,
    areas: ["Bayview Hill", "Oak Ridges", "Mill Pond", "Jefferson", "Richvale"],
    intro: "Luxury interior painting in Richmond Hill: refined finishes, wallcoverings and high-contrast details for family homes and custom builds.",
    context: "Staircases, trim and open-plan rooms need a finish that stays crisp under daily use.",
    architecture: "Bayview Hill and Oak Ridges include many larger family homes with formal dining rooms, curved staircases and generous wall spans. Those spaces suit a statement wallcovering or mural in one room and a calm, consistent palette through the rest.",
    faqs: [
      ["Can a staircase be refinished with a dark and white scheme?", "Yes. Treads, risers and balusters can be refinished with contrasting colours. Share photos and the look you want and the team can review the scope."],
      ["Can you install a mural in a dining room?", "Mural installation is part of the wallcovering service. Share the product, panel layout and wall dimensions so the team can review alignment and surface preparation."],
      ["Can work be staged so we can stay in the house?", "Usually. Rooms can be sequenced so parts of the home stay usable. The plan is agreed as part of the scope."],
    ],
  },
  markham: {
    name: "Markham",
    approved: true,
    photo: PHOTOS.floralBedroom,
    areas: ["Unionville", "Angus Glen", "Cornell", "Berczy Village", "Markham Village"],
    intro: "Luxury painting and wallcovering installation in Markham, including designer wallpaper, plaster and limewash finishes, and precise trim work.",
    context: "Wallcoverings and feature walls reward careful surface preparation and pattern matching.",
    architecture: "Markham ranges from heritage homes on Main Street Unionville to larger modern builds in Angus Glen and Cornell. Bedrooms, dens and powder rooms are good candidates for a patterned wallcovering or a limewash accent without reworking the whole house.",
    faqs: [
      ["Do you install designer wallpaper?", "Yes. Wallcovering installation is one of Arcan's services. Share the product, pattern repeat and wall dimensions so the team can review the surface and scope."],
      ["Is limewash a good choice for a bedroom?", "It can be. Limewash gives a soft, matte look with gentle variation in colour. A test area helps you judge it in your own light before committing."],
      ["Can you paint a heritage home in Unionville?", "Share photos and any heritage requirements you are aware of. Older surfaces and trim are assessed before a finish is agreed."],
    ],
  },
  "king-city": {
    name: "King City",
    approved: true,
    photo: PHOTOS.muralRoom,
    areas: ["King City", "Nobleton", "Schomberg", "Kettleby"],
    intro: "Luxury painting for King City and King Township homes: murals, wallcoverings, plaster and limewash, and exterior refinishing planned around the property.",
    context: "Larger properties often combine interior finishes with exterior doors, trim and outbuildings.",
    architecture: "Country estates and custom homes across King Township often have great rooms, libraries and long hallways where a mural, a plaster feature or a deep colour can carry the space. Exterior doors, window frames and trim can be planned in the same scope.",
    faqs: [
      ["Can interior and exterior work be planned together?", "Yes. Describe the interior rooms and exterior surfaces together and the team can review the whole scope and how it might be sequenced."],
      ["Do you travel to rural properties in King Township?", "Share your address when you get in touch and the team can confirm access, travel and scheduling before any work is booked."],
      ["Can you paint exterior window frames black?", "Yes. Window frames, doors and trim can be refinished in dark colours. The existing material and coating are reviewed first so the right product is used."],
    ],
  },
  aurora: {
    name: "Aurora",
    approved: true,
    photo: PHOTOS.staircase,
    areas: ["Aurora Highlands", "Bayview Northeast", "Aurora Heights", "St. Andrews Valley"],
    intro: "Luxury painting in Aurora: refined interiors, staircases and trim, front doors and exterior details, and specialty finishes with clean, sharp lines.",
    context: "A staircase, front door and trim can change how a home feels the moment you walk in.",
    architecture: "Aurora Highlands and St. Andrews Valley have many established two-storey family homes with central staircases, wainscoting and formal rooms. Refinishing the stairs in contrasting colours and adding one deep feature colour is a common way to update them without a renovation.",
    faqs: [
      ["Can you refinish stairs without replacing them?", "In most cases, yes. The stair material and current finish are reviewed first so the right preparation and coating can be planned."],
      ["Can you refinish front doors and garage doors?", "Yes. Exterior doors, trim and window frames are part of the exterior painting service. Photos of the current condition help with the review."],
      ["How do we choose a feature colour?", "Bring references or ideas and ask about a sample on your wall. Colour and sheen should be confirmed in the room's actual light."],
    ],
  },
  newmarket: {
    name: "Newmarket",
    approved: true,
    photo: PHOTOS.blueAccent,
    areas: ["Stonehaven", "Glenway", "Bogart", "Armitage"],
    intro: "Interior painting and specialty finishes for Newmarket homes, from deep accent colours to plaster, limewash and wallcoverings.",
    context: "Accent colours and feature walls can make a room feel considered without a full renovation.",
    architecture: "Family homes in Stonehaven and Glenway often have a fireplace wall or a main living space that anchors the house. A deep colour, a limewash or a plaster finish on that one wall, with crisp white trim, gives the room a focal point.",
    faqs: [
      ["Can I try a colour before the whole room is painted?", "Ask about a sample or test area. It lets you see colour and sheen in your own lighting before the full scope is confirmed."],
      ["Can a fireplace wall get a plaster or limewash finish?", "Often, yes. The surface and any heat exposure are reviewed first so a suitable product and preparation are chosen."],
      ["Do you paint whole houses as well as feature walls?", "Yes. Whole-home interiors and single feature walls are both reviewed the same way: rooms, surfaces, condition and timing."],
    ],
  },
  bradford: {
    name: "Bradford West Gwillimbury",
    approved: true,
    photo: PHOTOS.blackWindow,
    areas: ["Bradford", "Bond Head", "Newton Robinson"],
    intro: "Interior and exterior painting in Bradford West Gwillimbury, with attention to preparation, colour and clean lines.",
    context: "Family homes see heavy use on stairs, trim and doors, and exteriors face open weather.",
    architecture: "Newer subdivisions in Bradford and rural properties around Bond Head both benefit from durable, well-prepared finishes. Dark window frames and doors against brick are a simple way to sharpen an exterior, and they depend on careful preparation to last.",
    faqs: [
      ["How are stairs and trim prepared?", "Surfaces are cleaned, filled and sanded before coating so the finish bonds properly and stays crisp. Condition is reviewed as part of the scope."],
      ["When is exterior painting scheduled?", "Exterior work depends on temperature and moisture, and on the products used. Timing is confirmed once the surfaces and scope are reviewed."],
      ["Can window frames be painted a dark colour?", "Yes, on suitable materials. The frame material and current coating are reviewed so the right product and preparation are used."],
    ],
  },
  barrie: {
    name: "Barrie",
    approved: true,
    photo: PHOTOS.muralLadder,
    areas: ["Innisfil", "Midhurst", "Orillia", "Collingwood"],
    intro: "Luxury painting for Barrie and the Simcoe area: wallcoverings, plaster and limewash finishes, and refined interior and exterior painting.",
    context: "Homes in and around Barrie include lakeside properties, larger family builds and cottages.",
    architecture: "Lakeside homes around Kempenfelt Bay and cottages toward Collingwood often have large windows, wood surfaces and open living spaces. Soft limewash or plaster finishes suit that light, and exterior trim and doors can be planned in the same scope.",
    faqs: [
      ["Do you work in Barrie and Simcoe County?", "Yes. Tell the team your address when you get in touch and they can confirm scheduling and travel before any work is booked."],
      ["Can you paint a cottage between seasons?", "Share your timing and access, and the team can review what can be done and when, including interior and exterior surfaces."],
      ["Is limewash suitable for a lake house?", "It depends on the surface and the room's moisture. The team can review the rooms and recommend where limewash or another finish makes sense."],
    ],
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
  const others = Object.entries(MARKETS).filter(([s]) => s !== slug);
  return {
    ...LUXURY_GTA,
    path: marketPath(slug),
    service: "Luxury Painting",
    eyebrow: `Luxury painting · ${m.name}`,
    headline: "Luxury painting in",
    headlineEm: `${m.name}.`,
    intro: m.intro,
    heroPhoto: m.photo,
    context: m.context,
    architecture: m.architecture,
    areasTitle: `Serving ${m.name} and nearby`,
    areas: [...m.areas, ...others.map(([, o]) => o.name)],
    areaLinks: Object.fromEntries(others.map(([s, o]) => [o.name, marketPath(s)])),
    areasNote: "Not sure whether your address is covered? Ask when you get in touch.",
    faqs: [...m.faqs, ...LUXURY_GTA.faqs.filter(([q]) => !q.startsWith("Which parts"))],
  };
}
