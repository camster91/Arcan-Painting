import { useEffect, useRef } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/utils/useTheme";
import PWAInstaller, { PWAStatus } from "@/components/PWAInstaller";
import ChatWidget from "@/components/ChatWidget";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export const metadata = {
  title:
    "Arcan Painting - Professional Toronto Painting Services | Interior & Exterior Painters GTA",
  description:
    "Professional Toronto painting services for residential and commercial properties. Family-owned business serving the GTA with generations of craftsmanship. Licensed, insured, and quality guaranteed. Get your free Toronto estimate today.",
  keywords:
    "Toronto painting services, GTA painters, interior painting Toronto, exterior painting Toronto, commercial painting Toronto, residential painting Toronto, professional painters Toronto, licensed painters GTA, insured painters, free estimates Toronto, color consultation, specialty finishes",
  authors: [{ name: "Arcan Painting" }],
  creator: "Arcan Painting",
  publisher: "Arcan Painting",
  robots: "index, follow",
  // PWA Manifest
  manifest: "/manifest",
  alternates: {
    canonical: "https://arcanpainting.ca",
  },
  openGraph: {
    title:
      "Arcan Painting - Professional Toronto Painting Services | GTA's Trusted Painters",
    description:
      "Transform your Toronto space with professional painting services. Family legacy of quality craftsmanship in the GTA, licensed & insured. Get your free estimate today.",
    url: "https://arcanpainting.ca",
    siteName: "Arcan Painting",
    type: "website",
    locale: "en_CA",
    images: [
      {
        url: "https://arcanpainting.ca/og-image.png",
        width: 1200,
        height: 630,
        alt: "Arcan Painting Professional Toronto Painting Services - Interior & Exterior Painters GTA",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@arcanpainting",
    creator: "@arcanpainting",
    title:
      "Arcan Painting - Professional Toronto Painting Services | GTA's Trusted Painters",
    description:
      "Transform your Toronto space with professional painting services. Family legacy of quality craftsmanship in the GTA, licensed & insured. Get your free estimate today.",
    images: [
      {
        url: "https://arcanpainting.ca/og-image.png",
        alt: "Arcan Painting Professional Toronto Painting Services - Interior & Exterior Painters GTA",
      },
    ],
  },
  verification: {
    google: "your-google-verification-code",
  },
  other: {
    // PWA Meta Tags
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "Arcan CRM",
    "msapplication-TileColor": "#F59E0B",
    "msapplication-config": "/browserconfig.xml",
    "geo.region": "CA-ON",
    "geo.placename": "Toronto, Ontario, Canada",
    "geo.position": "43.6532;-79.3832",
    ICBM: "43.6532, -79.3832",
    "business:contact_data:street_address": "Greater Toronto Area",
    "business:contact_data:locality": "Toronto",
    "business:contact_data:region": "ON",
    "business:contact_data:postal_code": "",
    "business:contact_data:country_name": "Canada",
    "business:contact_data:email": "info@arcanpainting.ca",
    "business:contact_data:phone_number": "+14167272148",
    "business:contact_data:website": "https://arcanpainting.ca",
  },
};

// Add head tags on the client to avoid SSR hydration issues
function HeadTags() {
  useEffect(() => {
    if (typeof document === "undefined") return;

    document.title = metadata.title;

    const ensureMeta = (name, content, property = false) => {
      if (!content) return;
      const attribute = property ? "property" : "name";
      let el = document.head.querySelector(`meta[${attribute}="${name}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attribute, name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    const ensureLink = (rel, href, attrs = {}) => {
      if (!href) return;
      let el = document.head.querySelector(
        `link[rel="${rel}"][href="${href}"]`,
      );
      if (!el) {
        el = document.createElement("link");
        el.setAttribute("rel", rel);
        el.setAttribute("href", href);
        Object.entries(attrs).forEach(
          ([k, v]) => v != null && el.setAttribute(k, v),
        );
        document.head.appendChild(el);
      }
      return el;
    };

    // Basic SEO meta tags
    ensureMeta("description", metadata.description);
    ensureMeta("keywords", metadata.keywords);
    ensureMeta("author", "Arcan Painting");
    ensureMeta(
      "robots",
      "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1",
    );
    ensureMeta(
      "googlebot",
      "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1",
    );

    // Viewport and mobile optimization
    ensureMeta("viewport", "width=device-width, initial-scale=1");
    ensureMeta("theme-color", "#f5f4ef");
    ensureMeta("msapplication-TileColor", "#f5f4ef");
    ensureMeta("apple-mobile-web-app-capable", "yes");
    ensureMeta("apple-mobile-web-app-status-bar-style", "default");
    ensureMeta("format-detection", "telephone=no");

    // OpenGraph meta tags for social sharing
    ensureMeta("og:title", metadata.openGraph.title, true);
    ensureMeta("og:description", metadata.openGraph.description, true);
    ensureMeta("og:url", metadata.openGraph.url, true);
    ensureMeta("og:site_name", metadata.openGraph.siteName, true);
    ensureMeta("og:type", metadata.openGraph.type, true);
    ensureMeta("og:locale", metadata.openGraph.locale, true);
    ensureMeta("og:image", metadata.openGraph.images[0].url, true);
    ensureMeta(
      "og:image:width",
      metadata.openGraph.images[0].width.toString(),
      true,
    );
    ensureMeta(
      "og:image:height",
      metadata.openGraph.images[0].height.toString(),
      true,
    );
    ensureMeta("og:image:alt", metadata.openGraph.images[0].alt, true);
    ensureMeta("og:image:type", metadata.openGraph.images[0].type, true);

    // Twitter Card meta tags
    ensureMeta("twitter:card", metadata.twitter.card);
    ensureMeta("twitter:site", metadata.twitter.site);
    ensureMeta("twitter:creator", metadata.twitter.creator);
    ensureMeta("twitter:title", metadata.twitter.title);
    ensureMeta("twitter:description", metadata.twitter.description);
    ensureMeta("twitter:image", metadata.twitter.images[0].url);
    ensureMeta("twitter:image:alt", metadata.twitter.images[0].alt);

    // Additional social platform support
    ensureMeta("pinterest:description", metadata.description);
    ensureMeta("pinterest:media", metadata.openGraph.images[0].url);

    // LinkedIn specific
    ensureMeta("linkedin:owner", "Arcan Painting");

    // Geographic meta tags
    ensureMeta("geo.region", metadata.other["geo.region"]);
    ensureMeta("geo.placename", metadata.other["geo.placename"]);
    ensureMeta("geo.position", metadata.other["geo.position"]);
    ensureMeta("ICBM", metadata.other.ICBM);

    // Business contact information
    ensureMeta(
      "business:contact_data:street_address",
      metadata.other["business:contact_data:street_address"],
      true,
    );
    ensureMeta(
      "business:contact_data:locality",
      metadata.other["business:contact_data:locality"],
      true,
    );
    ensureMeta(
      "business:contact_data:region",
      metadata.other["business:contact_data:region"],
      true,
    );
    ensureMeta(
      "business:contact_data:country_name",
      metadata.other["business:contact_data:country_name"],
      true,
    );
    ensureMeta(
      "business:contact_data:email",
      metadata.other["business:contact_data:email"],
      true,
    );
    ensureMeta(
      "business:contact_data:website",
      metadata.other["business:contact_data:website"],
      true,
    );

    // Canonical URL
    ensureLink("canonical", metadata.alternates.canonical);

    // DNS prefetch and preconnect for performance
    ensureLink("preconnect", "https://ucarecdn.com");
    ensureLink("preconnect", "https://raw.createusercontent.com");
    ensureLink("preconnect", "https://images.unsplash.com");
    ensureLink("preconnect", "https://fonts.googleapis.com");
    ensureLink("preconnect", "https://fonts.gstatic.com", {
      crossOrigin: "anonymous",
    });

    // Favicons
    ensureLink(
      "icon",
      "https://ucarecdn.com/d3a2d3b6-b78f-4d6c-94bf-ce75c42de977/-/format/auto/-/resize/32x32/",
      { sizes: "32x32", type: "image/png" },
    );
    ensureLink(
      "icon",
      "https://ucarecdn.com/d3a2d3b6-b78f-4d6c-94bf-ce75c42de977/-/format/auto/-/resize/16x16/",
      { sizes: "16x16", type: "image/png" },
    );
    ensureLink(
      "apple-touch-icon",
      "https://ucarecdn.com/d3a2d3b6-b78f-4d6c-94bf-ce75c42de977/-/format/auto/-/resize/180x180/",
      { sizes: "180x180" },
    );

    // Local Business JSON-LD
    const addJsonLd = (id, data) => {
      let el = document.head.querySelector(`#${id}`);
      if (!el) {
        el = document.createElement("script");
        el.type = "application/ld+json";
        el.id = id;
        document.head.appendChild(el);
      }
      el.textContent = JSON.stringify(data);
    };

    addJsonLd("ld-local-business", {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "@id": "https://arcanpainting.ca/#business",
      name: "Arcan Painting",
      description:
        "Professional interior and exterior painting services for residential and commercial properties across the Greater Toronto Area.",
      url: "https://arcanpainting.ca",
      telephone: "+14167272148",
      email: "info@arcanpainting.ca",
      logo: "https://ucarecdn.com/599e7887-839f-4d2a-ba07-41425b1276a2/-/format/auto/",
      image:
        "https://ucarecdn.com/599e7887-839f-4d2a-ba07-41425b1276a2/-/format/auto/",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Toronto",
        addressRegion: "ON",
        addressCountry: "CA",
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: 43.6532,
        longitude: -79.3832,
      },
      areaServed: [
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
      ],
      openingHoursSpecification: [
        {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
          opens: "07:00",
          closes: "18:00",
        },
        {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: ["Saturday"],
          opens: "08:00",
          closes: "16:00",
        },
      ],
      priceRange: "$$",
      sameAs: [
        "https://www.facebook.com/arcanpainting",
        "https://www.instagram.com/arcanpaint",
        "https://www.linkedin.com/company/arcan-painting",
      ],
    });

    // Website JSON-LD
    addJsonLd("ld-website", {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Arcan Painting",
      url: "https://arcanpainting.ca",
      inLanguage: "en-CA",
      potentialAction: {
        "@type": "ContactAction",
        target: "https://arcanpainting.ca/#contact",
        name: "Request a Free Estimate",
      },
    });

  }, []);

  return null;
}

// PWA Service Worker Registration Component
function PWAServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      const registerServiceWorker = async () => {
        try {
          console.log("PWA: Registering service worker...");

          const registration = await navigator.serviceWorker.register(
            "/sw.js",
            {
              scope: "/",
            },
          );

          console.log(
            "PWA: Service worker registered successfully:",
            registration,
          );

          // Handle service worker updates
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;

            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (
                  newWorker.state === "installed" &&
                  navigator.serviceWorker.controller
                ) {
                  // New service worker available, show update prompt
                  console.log("PWA: New service worker available");

                  // You could show a toast notification here
                  if (
                    confirm("A new version is available. Reload to update?")
                  ) {
                    window.location.reload();
                  }
                }
              });
            }
          });
        } catch (error) {
          console.error("PWA: Service worker registration failed:", error);
        }
      };

      // Register service worker after page load
      if (document.readyState === "loading") {
        window.addEventListener("load", registerServiceWorker);
      } else {
        registerServiceWorker();
      }
    } else {
      console.log("PWA: Service workers not supported");
    }

    // Listen for service worker messages
    const handleMessage = (event) => {
      if (event.data && event.data.type === "SYNC_COMPLETE") {
        console.log("PWA: Background sync completed");
        // Refresh current data
        window.location.reload();
      }
    };

    navigator.serviceWorker?.addEventListener("message", handleMessage);

    return () => {
      navigator.serviceWorker?.removeEventListener("message", handleMessage);
    };
  }, []);

  return null;
}

export default function RootLayout({ children }) {
  // Add a simple focus helper to move focus to main on route changes (best-effort)
  const mainRef = useRef(null);
  useEffect(() => {
    if (!mainRef.current) return;
    // If hash changes to #main-content, move focus
    const onHash = () => {
      if (window.location.hash === "#main-content") {
        mainRef.current.focus();
      }
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <PWAServiceWorker />
        <HeadTags />
        <PWAStatus />
        {/* Skip link for accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-white focus:text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 px-3 py-2 rounded"
        >
          Skip to main content
        </a>
        {/* Main content wrapper with landmark */}
        <main
          id="main-content"
          ref={mainRef}
          role="main"
          tabIndex={-1}
          style={{
            margin: 0,
            padding: 0,
            fontFamily:
              'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          }}
        >
          {children}
          <ChatWidget />
        </main>
        <PWAInstaller />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
