import { PHOTOS } from "./photos.js";

// Content for search landing pages. Add an entry here (plus a route file, a
// PUBLIC_PAGES entry in utils/publicSeo.js and a sitemap line) for each new page.
// Only state things Arcan has confirmed: no years in business, awards or prices.

export const LUXURY_GTA = {
  path: "/luxury-painting-gta",
  service: "Luxury Painting",
  eyebrow: "Luxury painting · Greater Toronto Area",
  headline: "Luxury painting for homes across the",
  headlineEm: "Greater Toronto Area.",
  intro:
    "Venetian plaster, limewash, statement wallcoverings and deep, high-contrast rooms — planned around your architecture and finished with exacting preparation and sharp lines.",
  heroPhoto: PHOTOS.muralRoom,
  finishesTitle: "Finishes for interiors that are meant to be noticed.",
  finishes: [
    {
      title: "Venetian plaster",
      text: "Smooth, layered plaster with depth and a soft sheen, for feature walls, fireplaces and full rooms.",
    },
    {
      title: "Limewash",
      text: "A mineral, matte finish with subtle movement in the colour — warm, calm and never flat.",
    },
    {
      title: "Wallcoverings and murals",
      text: "Designer wallpaper and botanical murals installed with careful seams, pattern matching and surface preparation.",
    },
    {
      title: "Dark and high-contrast rooms",
      text: "Deep colours, painted ceilings and crisp trim lines that make a room feel deliberate and tailored.",
    },
    {
      title: "Staircases and millwork",
      text: "Refinished treads, risers, balusters, panelling and doors with a smooth, durable finish.",
    },
    {
      title: "Sharp lines and clean details",
      text: "Straight edges at ceilings, trim and colour breaks — the details that separate a luxury finish from a standard one.",
    },
  ],
  principlesTitle: "Why luxury finishes start with preparation.",
  principles: [
    "Surfaces are cleaned, filled and sanded before any coat, plaster or paper goes on. High-end finishes show every flaw underneath.",
    "Samples and test areas can be used to confirm colour, texture and sheen under your own lighting before the full scope is agreed.",
    "Floors, furniture and fixtures are protected, and the space is left clean at the end of each stage.",
  ],
  areasTitle: "Serving the Greater Toronto Area",
  areas: ["Toronto", "Vaughan", "Richmond Hill", "Markham", "King City", "Aurora", "Newmarket", "Bradford", "Barrie", "Mississauga", "Oakville", "Brampton", "Pickering"],
  areaLinks: {
    Toronto: "/luxury-painting/toronto",
    Vaughan: "/luxury-painting/vaughan",
    "Richmond Hill": "/luxury-painting/richmond-hill",
    Markham: "/luxury-painting/markham",
    "King City": "/luxury-painting/king-city",
    Aurora: "/luxury-painting/aurora",
    Newmarket: "/luxury-painting/newmarket",
    Bradford: "/luxury-painting/bradford",
    Barrie: "/luxury-painting/barrie",
  },
  areasNote: "Not sure whether your address is covered? Ask when you get in touch.",
  faqs: [
    [
      "What does luxury painting include?",
      "Luxury painting covers finishes and detail work beyond a standard single-colour coat: Venetian plaster, limewash, wallcoverings and murals, deep or high-contrast colour schemes, and precise trim and ceiling lines. The scope is defined room by room.",
    ],
    [
      "Can I see a sample before committing to a finish?",
      "Plaster, limewash and specialty colours are best judged in person. Ask about a sample or test area so you can review colour, texture and sheen in your own lighting before the full scope is confirmed.",
    ],
    [
      "Do you install designer wallpaper and murals?",
      "Yes. Wallcovering installation is one of Arcan's services. Share the product, roll details, pattern repeat and wall dimensions, and the team can review the surface and scope with you.",
    ],
    [
      "Which parts of the GTA do you work in?",
      "Arcan Painting works across the Greater Toronto Area. Tell the team your address when you get in touch and they can confirm whether it is within range.",
    ],
    [
      "How do I get started?",
      "Use the project form or call (416) 727-2148 with the rooms, the finish you have in mind and any reference images. A team member reviews the details and confirms next steps before any work is booked.",
    ],
  ],
};

// One page per finish. Copy is general craft information; it makes no claims
// about Arcan's past projects. Confirm each finish is offered before merge.
const FINISH_BASE = {
  areasTitle: "Serving the Greater Toronto Area",
  areas: LUXURY_GTA.areas,
  areaLinks: LUXURY_GTA.areaLinks,
  areasNote: LUXURY_GTA.areasNote,
  principlesTitle: "Preparation decides how it looks.",
};

export const FINISH_PAGES = {
  "venetian-plaster": {
    ...FINISH_BASE,
    service: "Venetian Plaster",
    eyebrow: "Finishes · Venetian plaster",
    headline: "Venetian plaster with depth and",
    headlineEm: "a burnished glow.",
    intro: "Thin, hand-troweled layers that build a smooth, luminous surface with depth — for feature walls, fireplaces, entries and whole rooms across the GTA.",
    heroTexture: "plaster-teal",
    cardText: "Burnished, layered plaster with depth.",
    context: "Venetian plaster is applied in several thin coats and burnished, so the surface catches light differently from every angle. It rewards careful preparation and a steady hand.",
    finishesTitle: "Where Venetian plaster works well.",
    finishes: [
      { title: "Feature walls", text: "A single wall in a deep or pale tone that anchors a living room or bedroom." },
      { title: "Fireplace surrounds", text: "A smooth, polished face that suits a hearth without adding visual clutter." },
      { title: "Entries and hallways", text: "Rooms people pass through slowly, where the surface is seen up close." },
      { title: "Dining rooms", text: "Rich colour with sheen that reads well in candle and evening light." },
      { title: "Powder rooms", text: "Small rooms where a bold finish makes the biggest impression." },
      { title: "Whole-room schemes", text: "Continuous walls with clean lines at ceilings, trim and openings." },
    ],
    principles: [
      "Walls are repaired, sanded and primed first. Plaster shows every dent and seam beneath it.",
      "Colour, sheen and trowel pattern are best confirmed on a sample board in your own light.",
      "Finished with a protective coat suited to the room, then walked through with you.",
    ],
    faqs: [
      ["What is Venetian plaster?", "A decorative finish built from thin layers of fine plaster that are troweled and burnished to a smooth, subtly variable surface with depth and sheen."],
      ["Can I see a sample first?", "Yes — ask for a sample or test area. Plaster is hard to judge from photos, and colour and sheen change with your lighting."],
      ["Can it be used in a bathroom or kitchen?", "It depends on the room and the surface. Share the room, its moisture and use, and the team can advise on suitable products before the scope is confirmed."],
      ["How do I get started?", "Use the project form or call (416) 727-2148 with the rooms, any reference images and your timing. A team member reviews the details before any work is booked."],
    ],
  },
  limewash: {
    ...FINISH_BASE,
    service: "Limewash",
    eyebrow: "Finishes · Limewash",
    headline: "Limewash with soft, cloudy",
    headlineEm: "mineral colour.",
    intro: "A matte, chalky finish with gentle movement in the colour — warm, calm and unlike flat paint. For interior walls, fireplaces, brick and more.",
    heroTexture: "limewash-ivory",
    cardText: "Soft, chalky mineral colour.",
    context: "Limewash is a mineral wash applied in loose, layered coats. The colour varies slightly across the wall and shifts with the light, which is much of its appeal.",
    finishesTitle: "Where limewash works well.",
    finishes: [
      { title: "Living rooms and bedrooms", text: "Soft, enveloping colour with a matte, low-glare surface." },
      { title: "Brick and fireplaces", text: "A washed, softened look over brick or masonry surfaces." },
      { title: "Plastered walls", text: "A natural partner for plaster, with a mineral, aged character." },
      { title: "Feature walls", text: "Depth and movement in place of a flat single colour." },
      { title: "Hallways and stairwells", text: "Long walls that benefit from tonal variation." },
      { title: "Exterior masonry", text: "Suitable surfaces can be reviewed on site before a scope is agreed." },
    ],
    principles: [
      "Limewash needs a suitable, porous surface. Existing coatings and their condition are reviewed first.",
      "Colour looks different wet and dry, so a test area is agreed before the full wall is done.",
      "Loose, layered application means the finish is best planned wall by wall for a consistent result.",
    ],
    faqs: [
      ["What makes limewash different from paint?", "It is a mineral wash rather than a film-forming paint, with a matte, chalky look and soft variation in colour rather than a uniform flat coat."],
      ["Can limewash go over existing paint?", "That depends on the current coating. Photos and a site review help determine whether the surface needs preparation or a different product."],
      ["Will the colour look the same as the sample?", "Limewash dries lighter and shifts with light, which is why a test area on your wall is recommended before the full scope."],
      ["How do I get started?", "Use the project form or call (416) 727-2148 with the rooms, reference images and timing. A team member reviews the details before any work is booked."],
    ],
  },
  wallcoverings: {
    ...FINISH_BASE,
    service: "Luxury Wallcoverings",
    eyebrow: "Finishes · Wallcoverings and murals",
    headline: "Designer wallcoverings, hung with",
    headlineEm: "exacting seams.",
    intro: "Installation of designer wallpaper, botanical murals and statement patterns — with careful surface preparation, pattern matching and clean edges.",
    heroPhoto: PHOTOS.muralInstall,
    cardText: "Designer papers and murals, seam-matched.",
    context: "A wallcovering is only as good as the wall beneath it and the care taken at every seam. Pattern repeat, corners and openings all need to be planned before the first drop goes up.",
    finishesTitle: "What we install and prepare.",
    finishes: [
      { title: "Designer wallpaper", text: "Pattern-matched installation across full rooms or feature walls." },
      { title: "Botanical and scenic murals", text: "Multi-panel murals aligned carefully from edge to edge." },
      { title: "Grasscloth and textured papers", text: "Materials that need particular handling and seam planning." },
      { title: "Removal of old wallpaper", text: "Existing coverings and adhesive assessed and removed before new work." },
      { title: "Surface repair", text: "Skim, patch and prime so the wall beneath is flat and sound." },
      { title: "Ceilings and accent details", text: "Painted ceilings and trim planned alongside the wallcovering." },
    ],
    principles: [
      "Share the product name, roll size and pattern repeat so the drops can be planned before work starts.",
      "Corners, openings and outlets are measured and planned, not improvised.",
      "Walls are made flat and sealed first, so seams stay tight and the pattern reads cleanly.",
    ],
    faqs: [
      ["What should I send about my wallcovering?", "The manufacturer, pattern name or link, roll dimensions and pattern repeat, plus wall dimensions and photos of corners, windows and any damage."],
      ["Do you remove old wallpaper?", "Yes. The type of covering, adhesive and the wall beneath affect the preparation, so those conditions are reviewed as part of the scope."],
      ["Can you install murals?", "Mural installation is part of the wallcovering service. Panel order, alignment and wall condition are reviewed before work begins."],
      ["How do I get started?", "Use the project form or call (416) 727-2148 with the product details, room dimensions and timing. A team member reviews the details before any work is booked."],
    ],
  },
  "dark-rooms": {
    ...FINISH_BASE,
    service: "Dark and High-Contrast Rooms",
    eyebrow: "Finishes · Dark and high-contrast rooms",
    headline: "Deep colour and painted ceilings with",
    headlineEm: "sharp, crisp lines.",
    intro: "Rich, saturated walls, painted ceilings and bold trim contrasts — planned so the lines stay clean and the finish looks deliberate.",
    heroPhoto: PHOTOS.wineBar,
    cardText: "Deep colour, painted ceilings, sharp lines.",
    context: "Dark colour is unforgiving: every flaw, brush mark and wobbly edge shows. That is why preparation, product choice and line work matter more here than anywhere.",
    finishesTitle: "How high-contrast rooms come together.",
    finishes: [
      { title: "Deep wall colours", text: "Navy, forest, charcoal and oxblood applied for an even, saturated finish." },
      { title: "Painted ceilings", text: "Colour carried overhead for a wrapped, enclosed feel." },
      { title: "Contrasting trim", text: "Crisp white or tonal trim with straight, clean edges." },
      { title: "Doors and millwork", text: "Smooth, durable finishes on doors, panelling and built-ins." },
      { title: "Accent walls", text: "A single strong wall that sets the tone of the room." },
      { title: "Sheen selection", text: "Matte to satin chosen for the light in the room and how it is used." },
    ],
    principles: [
      "Surfaces are filled and sanded flat so deep colour does not highlight imperfections.",
      "Primer and coat count are planned for the colour, not applied by default.",
      "Edges at ceilings, trim and colour breaks are cut in carefully and checked in raking light.",
    ],
    faqs: [
      ["Will a dark colour make my room feel smaller?", "It can feel more enclosed, or more intimate and tailored, depending on the room, its light and how the colour is used. A sample on your wall helps you judge."],
      ["Do dark colours need extra coats?", "Often, and often a tinted primer. The right approach depends on the colour and the surface, and is confirmed as part of the scope."],
      ["Can you paint ceilings and trim in the same scheme?", "Yes. Ceilings, trim, doors and walls can be planned together so the contrast and sheen work as one scheme."],
      ["How do I get started?", "Use the project form or call (416) 727-2148 with the rooms, colour ideas and timing. A team member reviews the details before any work is booked."],
    ],
  },
  staircases: {
    ...FINISH_BASE,
    service: "Staircase Refinishing",
    eyebrow: "Finishes · Staircases and millwork",
    headline: "Staircases and millwork refinished with",
    headlineEm: "a hardwearing finish.",
    intro: "Treads, risers, balusters, handrails and panelling refinished with strong contrast and a smooth, durable surface.",
    heroPhoto: PHOTOS.staircase,
    cardText: "Treads, risers and rails that last.",
    context: "A staircase is the most-touched, most-walked-on surface in a home. The finish has to look sharp and stand up to daily use.",
    finishesTitle: "What a staircase refinish covers.",
    finishes: [
      { title: "Treads", text: "Sanded, primed and coated with a finish suited to foot traffic." },
      { title: "Risers", text: "Clean, contrasting risers with crisp lines against the treads." },
      { title: "Balusters and newel posts", text: "Detailed spindles prepared and coated evenly." },
      { title: "Handrails", text: "A smooth finish that feels good in the hand." },
      { title: "Panelling and wainscoting", text: "Millwork alongside the stairs finished to match." },
      { title: "Doors and trim", text: "Adjacent doors and trim included in the scheme." },
    ],
    principles: [
      "Existing finishes are assessed. Stain, varnish and old paint each need different preparation.",
      "Stairs are planned in stages so the house stays usable while coats cure.",
      "Dark treads and light risers need sharp, straight edges, which are checked before sign-off.",
    ],
    faqs: [
      ["Can dark treads and white risers be done on existing stairs?", "Yes, in most cases. The stair material and current finish are reviewed first so the right preparation and coating can be planned."],
      ["How long before we can use the stairs?", "It depends on the products and the number of coats, and the schedule can be staged to keep part of the stairs usable. Timing is confirmed after review."],
      ["Do you refinish balusters and handrails?", "Yes. Balusters, newel posts, handrails and nearby panelling can be included in the scope."],
      ["How do I get started?", "Use the project form or call (416) 727-2148 with photos of the stairs and your timing. A team member reviews the details before any work is booked."],
    ],
  },
};

export const FINISH_SLUGS = Object.keys(FINISH_PAGES);
export const finishPath = (slug) => `/finishes/${slug}`;
