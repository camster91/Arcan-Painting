import { services as publicServices } from "../data/premiumSite";
// Comprehensive SEO utilities for Arcan Painting

export const seoConfig = {
  siteName: "Arcan Painting",
  defaultTitle: "Arcan Painting | Premium Painting, Wallpaper & Luxury Finishes",
  defaultDescription: "Premium Painting, High-end Wallpaper and Luxury Finishes for homes and commercial interiors. Explore Arcan’s work and discuss your project with the team.",
  siteUrl: "https://arcanpainting.ca",
  logoUrl: "https://arcanpainting.ca/brand/arcan-painting-logo.png",
  socialImageUrl: "https://arcanpainting.ca/og-image.png",
  businessEmail: "info@arcanpainting.ca",
  businessPhone: "+1-416-727-2148",
  googleListingUrl: "https://maps.app.goo.gl/WY8Rh5myeWX6JJhR6",
  services: publicServices.map(service => service.title),
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
            alt: "Arcan Painting brand mark",
            type: "image/png",
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
    "@type": "ProfessionalService",
    name: seoConfig.siteName,
    alternateName: "Arcan Painting",
    description: seoConfig.defaultDescription,
    url: seoConfig.siteUrl,
    logo: seoConfig.logoUrl,
    image: seoConfig.socialImageUrl,
    email: seoConfig.businessEmail,
    telephone: seoConfig.businessPhone,
    sameAs: [
      "https://www.instagram.com/arcanpaint",
      seoConfig.googleListingUrl,
    ],
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Painting Services",
      itemListElement: seoConfig.services.map((service) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: service,
          provider: {
            "@type": "ProfessionalService",
            name: seoConfig.siteName,
          },
        },
      })),
    },
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
      "@type": "ProfessionalService",
      name: seoConfig.siteName,
      url: seoConfig.siteUrl,
    },
    ...(price !== undefined && price !== null && price !== "" ? {
      offers: {
        "@type": "Offer",
        price,
        priceCurrency: "CAD",
      },
    } : {}),
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
  ],
  content: [
    "✅ Approved service names used consistently",
    "✅ Service details describe scope, surfaces, access, and timing",
    "✅ Clear call-to-action buttons",
    "✅ Portfolio and gallery images include descriptive alt text",
    "⚠️ Blog content for SEO boost",
  ],
  local: [
    "✅ Business name, phone, and email are consistent",
    "✅ Google listing link is provided for current business details",
    "⚠️ Service availability is confirmed for each project inquiry",
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
