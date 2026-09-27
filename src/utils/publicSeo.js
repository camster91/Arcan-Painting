const SITE_URL = "https://arcanpainting.ca";

export const SERVICE_FAQS = {
  "Interior Painting": [["What should I include in an interior painting inquiry?", "Share the rooms and surfaces involved, their current condition, colour or finish ideas, access constraints, and your preferred timing. Photos can help the team understand what needs review."], ["How are colours and finishes confirmed?", "Bring any samples or reference images you have. Product, colour, and sheen choices should be confirmed for the actual surfaces and use of each room before work begins."]],
  "Exterior Painting": [["What information helps with an exterior project review?", "Include the property type, surfaces, material, approximate height, access limitations, current condition, and photos from several angles."], ["Why does exterior timing need confirmation?", "Preparation and coating conditions can be affected by temperature, moisture, and the product selected. Project-specific timing should be confirmed after the surfaces and scope are reviewed."]],
  "Commercial Painting": [["What should a commercial painting inquiry include?", "Provide the site type, approximate scope, surfaces, access requirements, operating constraints, specifications if available, and the dates the project is working toward."], ["Can work be planned around site operations?", "Share the hours and areas that must remain available. Feasible sequencing and access can then be discussed as part of the project review."]],
  "Wallpaper Services": [["What details are useful for a wallpaper installation inquiry?", "Include wall measurements, ceiling height, photos, the wallpaper product or link, roll information, pattern repeat, and the condition of the surface."], ["Does old wallpaper need to be assessed before removal?", "Yes. The type of covering, adhesive, layers, and wall beneath it can affect the removal and preparation scope, so those conditions should be reviewed."]],
  "Specialty Finishes": [["How should I describe a specialty finish?", "Visual references are the clearest starting point. Add notes about colour, texture, reflectivity, scale, and what you like about each example."], ["Why might a sample be part of the process?", "A physical sample can help evaluate colour, texture, and appearance under the actual lighting before the full project scope is finalized."]],
};

const PUBLIC_PAGES = {
  "/": {
    title: "Arcan Painting | Painting Project Inquiries",
    description: "Explore Arcan Painting services and discuss an interior, exterior, commercial, wallpaper, or specialty-finish project.",
  },
  "/interior-painting": {
    title: "Interior Painting | Arcan Painting",
    description: "Plan an interior painting project, from surface preparation and room access to colours, finishes, and timing.",
    service: "Interior Painting",
  },
  "/exterior-painting": {
    title: "Exterior Painting | Arcan Painting",
    description: "Plan an exterior painting project with attention to surface condition, preparation, materials, access, and weather.",
    service: "Exterior Painting",
  },
  "/commercial-painting": {
    title: "Commercial Painting | Arcan Painting",
    description: "Discuss a commercial painting project, including site access, operating hours, surfaces, sequencing, and scope.",
    service: "Commercial Painting",
  },
  "/wallpaper-services": {
    title: "Wallpaper Services | Arcan Painting",
    description: "Plan wallpaper installation or removal by sharing wall condition, material details, room dimensions, and timing.",
    service: "Wallpaper Services",
  },
  "/specialty-finishes": {
    title: "Specialty Finishes | Arcan Painting",
    description: "Discuss a specialty-finish project, including the desired appearance, sample references, surfaces, and room conditions.",
    service: "Specialty Finishes",
  },
  "/contact": {
    title: "Contact Arcan Painting",
    description: "Share your project details and questions with Arcan Painting for review.",
  },
  "/quote": {
    title: "Project Inquiry | Arcan Painting",
    description: "Tell Arcan Painting about your project so the team can review its scope, surfaces, timing, and next steps.",
  },
  "/privacy": {
    title: "Privacy Notice | Arcan Painting",
    description: "Learn how Arcan Painting uses information submitted through this website.",
  },
};

export function getPublicSeo(pathname = "/") {
  const path = pathname !== "/" ? pathname.replace(/\/$/, "") : "/";
  const page = PUBLIC_PAGES[path];
  const isPrivate = path.startsWith("/admin") || path.startsWith("/account") || path.startsWith("/crew") || path.startsWith("/e/") || path.startsWith("/i/") || path === "/thank-you";
  const isGeneratedLocation = /^\/(interior-painting|exterior-painting|commercial-painting|wallpaper-services|specialty-finishes)\/[^/]+$/.test(path);
  const indexable = Boolean(page) && !isPrivate && !isGeneratedLocation;

  if (page) return { ...page, path, canonical: `${SITE_URL}${path === "/" ? "/" : path}`, indexable };

  return {
    title: isPrivate ? "Arcan Painting" : "Page Not Found | Arcan Painting",
    description: isPrivate ? "Arcan Painting website page." : "The requested Arcan Painting page could not be found.",
    path,
    canonical: `${SITE_URL}${path}`,
    indexable: false,
  };
}

export function buildStructuredData(seo) {
  const business = {
    "@type": "ProfessionalService",
    "@id": `${SITE_URL}/#business`,
    name: "Arcan Painting",
    url: `${SITE_URL}/`,
    email: "info@arcanpainting.ca",
    telephone: "+1-416-727-2148",
    logo: `${SITE_URL}/logo.png`,
    image: `${SITE_URL}/og-image.png`,
    sameAs: [
      "https://www.facebook.com/arcanpainting",
      "https://www.instagram.com/arcanpaint",
      "https://www.linkedin.com/company/arcan-painting",
    ],
  };

  const page = {
    "@type": "WebPage",
    "@id": `${seo.canonical}#webpage`,
    url: seo.canonical,
    name: seo.title,
    description: seo.description,
    isPartOf: { "@id": `${SITE_URL}/#website` },
    about: { "@id": `${SITE_URL}/#business` },
  };

  const graph = [
    business,
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: `${SITE_URL}/`,
      name: "Arcan Painting",
      publisher: { "@id": `${SITE_URL}/#business` },
    },
    page,
  ];

  if (seo.service) {
    graph.push({
      "@type": "Service",
      "@id": `${seo.canonical}#service`,
      name: seo.service,
      url: seo.canonical,
      provider: { "@id": `${SITE_URL}/#business` },
      mainEntityOfPage: { "@id": `${seo.canonical}#webpage` },
    });
    graph.push({
      "@type": "BreadcrumbList",
      "@id": `${seo.canonical}#breadcrumb`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
        { "@type": "ListItem", position: 2, name: seo.service, item: seo.canonical },
      ],
    });
    graph.push({
      "@type": "FAQPage",
      "@id": `${seo.canonical}#faq`,
      mainEntity: SERVICE_FAQS[seo.service].map(([name, text]) => ({
        "@type": "Question",
        name,
        acceptedAnswer: { "@type": "Answer", text },
      })),
    });
  }

  return { "@context": "https://schema.org", "@graph": graph };
}
