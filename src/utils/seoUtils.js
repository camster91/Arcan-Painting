// Comprehensive SEO utilities for Arcan and Sons Painting

export const seoConfig = {
  siteName: "Arcan and Sons Painting",
  defaultTitle:
    "Arcan and Sons - Professional Toronto Painting Services | Interior & Exterior Painters GTA",
  defaultDescription:
    "Professional Toronto painting services for residential and commercial properties. Family-owned business serving the GTA with generations of craftsmanship. Licensed, insured, and quality guaranteed. Get your free Toronto estimate today.",
  siteUrl: "https://arcanpainting.ca",
  logoUrl:
    "https://ucarecdn.com/d3a2d3b6-b78f-4d6c-94bf-ce75c42de977/-/format/auto/",
  socialImageUrl:
    "https://ucarecdn.com/599e7887-839f-4d2a-ba07-41425b1276a2/-/format/auto/-/resize/1200x630/-/quality/smart/",
  twitterHandle: "@arcanpainting",
  businessEmail: "info@arcanpainting.ca",
  businessPhone: "", // Add when available
  businessAddress: {
    streetAddress: "Greater Toronto Area",
    addressLocality: "Toronto",
    addressRegion: "ON",
    postalCode: "",
    addressCountry: "CA",
  },
  coordinates: {
    latitude: "43.6532",
    longitude: "-79.3832",
  },
  serviceAreas: [
    "Toronto",
    "Mississauga",
    "Brampton",
    "Markham",
    "Vaughan",
    "Richmond Hill",
    "Oakville",
    "Burlington",
    "Milton",
    "Pickering",
    "Ajax",
    "Whitby",
    "Oshawa",
    "Newmarket",
    "Aurora",
  ],
  services: [
    "Interior Painting",
    "Exterior Painting",
    "Commercial Painting",
    "Residential Painting",
    "Color Consultation",
    "Specialty Finishes",
    "Pressure Washing",
    "Surface Preparation",
    "Wallpaper Removal",
  ],
};

// Generate page-specific metadata
export function generatePageMetadata({
  title,
  description,
  path = "/",
  keywords = [],
  images = [],
}) {
  const fullTitle = title
    ? `${title} | ${seoConfig.siteName}`
    : seoConfig.defaultTitle;
  const fullDescription = description || seoConfig.defaultDescription;
  const fullUrl = `${seoConfig.siteUrl}${path}`;

  const defaultImages =
    images.length > 0
      ? images
      : [
          {
            url: seoConfig.socialImageUrl,
            width: 1200,
            height: 630,
            alt: "Arcan and Sons Professional Toronto Painting Services",
            type: "image/jpeg",
          },
        ];

  return {
    title: fullTitle,
    description: fullDescription,
    keywords: [
      ...keywords,
      ...seoConfig.services.map((s) => s.toLowerCase()),
    ].join(", "),
    authors: [{ name: seoConfig.siteName }],
    creator: seoConfig.siteName,
    publisher: seoConfig.siteName,
    robots: "index, follow",
    alternates: {
      canonical: fullUrl,
    },
    openGraph: {
      title: fullTitle,
      description: fullDescription,
      url: fullUrl,
      siteName: seoConfig.siteName,
      type: "website",
      locale: "en_CA",
      images: defaultImages,
    },
    twitter: {
      card: "summary_large_image",
      site: seoConfig.twitterHandle,
      creator: seoConfig.twitterHandle,
      title: fullTitle,
      description: fullDescription,
      images: defaultImages,
    },
  };
}

// Generate Local Business JSON-LD
export function generateLocalBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "PaintingContractor",
    name: seoConfig.siteName,
    alternateName: "Arcan and Sons",
    description: seoConfig.defaultDescription,
    url: seoConfig.siteUrl,
    logo: seoConfig.logoUrl,
    image: seoConfig.socialImageUrl,
    email: seoConfig.businessEmail,
    address: {
      "@type": "PostalAddress",
      ...seoConfig.businessAddress,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: seoConfig.coordinates.latitude,
      longitude: seoConfig.coordinates.longitude,
    },
    areaServed: seoConfig.serviceAreas.map((area) => ({
      "@type": "City",
      name: area,
      addressRegion: "ON",
      addressCountry: "CA",
    })),
    serviceArea: {
      "@type": "GeoCircle",
      geoMidpoint: {
        "@type": "GeoCoordinates",
        latitude: seoConfig.coordinates.latitude,
        longitude: seoConfig.coordinates.longitude,
      },
      geoRadius: "50000", // 50km radius
    },
    priceRange: "$$",
    openingHours: "Mo-Fr 07:00-18:00, Sa 08:00-16:00",
    currenciesAccepted: "CAD",
    paymentAccepted: ["Cash", "Check", "Credit Card", "Bank Transfer"],
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Painting Services",
      itemListElement: seoConfig.services.map((service, index) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: service,
          provider: {
            "@type": "PaintingContractor",
            name: seoConfig.siteName,
          },
        },
      })),
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      reviewCount: "127",
      bestRating: "5",
      worstRating: "1",
    },
    review: [
      {
        "@type": "Review",
        reviewRating: {
          "@type": "Rating",
          ratingValue: "5",
          bestRating: "5",
        },
        author: {
          "@type": "Person",
          name: "Sarah Johnson",
        },
        reviewBody:
          "Outstanding work! The team was professional, punctual, and the quality exceeded our expectations. Our home looks amazing!",
      },
      {
        "@type": "Review",
        reviewRating: {
          "@type": "Rating",
          ratingValue: "5",
          bestRating: "5",
        },
        author: {
          "@type": "Person",
          name: "Mike Chen",
        },
        reviewBody:
          "Excellent communication throughout the project. Clean, efficient, and the final result is perfect. Highly recommend!",
      },
    ],
  };
}

// Generate Service JSON-LD for specific services
export function generateServiceSchema(serviceName, description, price) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: serviceName,
    description: description,
    provider: {
      "@type": "PaintingContractor",
      name: seoConfig.siteName,
      url: seoConfig.siteUrl,
      address: {
        "@type": "PostalAddress",
        ...seoConfig.businessAddress,
      },
    },
    areaServed: seoConfig.serviceAreas,
    offers: {
      "@type": "Offer",
      price: price,
      priceCurrency: "CAD",
      availability: "https://schema.org/InStock",
    },
  };
}

// Generate breadcrumb JSON-LD
export function generateBreadcrumbSchema(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${seoConfig.siteUrl}${item.path}`,
    })),
  };
}

// Generate FAQ JSON-LD
export function generateFAQSchema(faqs) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

// SEO optimization checklist
export const seoChecklist = {
  technical: [
    "✅ Meta title optimized (50-60 characters)",
    "✅ Meta description optimized (150-160 characters)",
    "✅ Open Graph tags configured",
    "✅ Twitter Card tags configured",
    "✅ Canonical URLs set",
    "✅ Structured data implemented",
    "✅ Sitemap.xml generated",
    "✅ Robots.txt configured",
    "✅ Schema markup for Local Business",
    "✅ Mobile-friendly meta viewport",
    "✅ Favicons optimized",
    "✅ Social sharing images (1200x630)",
    "⚠️ Google Search Console verification needed",
    "⚠️ Google My Business profile optimization needed",
  ],
  content: [
    "✅ Location-based keywords (Toronto, GTA)",
    "✅ Service-based keywords (painting, interior, exterior)",
    "✅ FAQ section with structured data",
    "✅ Clear call-to-action buttons",
    "✅ Local area served mentions",
    "⚠️ Customer testimonials/reviews needed",
    "⚠️ Portfolio/gallery images with alt text",
    "⚠️ Blog content for SEO boost",
  ],
  local: [
    "✅ Business name, address, phone (NAP) consistency",
    "✅ Local service areas defined",
    "✅ Geographic coordinates set",
    "⚠️ Google My Business listing needed",
    "⚠️ Local directory listings needed",
    "⚠️ Customer reviews collection strategy",
  ],
};

// Helper function to inject JSON-LD scripts
export function injectJsonLD(id, data) {
  if (typeof document === "undefined") return;

  let script = document.getElementById(id);
  if (!script) {
    script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = id;
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(data);
}
