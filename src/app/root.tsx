import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useAsyncError,
  useLocation,
  useRouteError,
} from 'react-router';

import {
  useCallback,
  useEffect,
  useState,
  useMemo,
  type ReactNode,
  Component,
} from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './global.css';

// Sentry client init — lazy to avoid bundle circular dep issues
if (typeof window !== 'undefined') {
  import('../sentry.client.js').then(({ initSentryClient }) => {
    initSentryClient();
  }).catch(() => {});
}

// CSRF: inject x-csrf-token from the arcan_csrf cookie on every state-changing
// /api/* request. Patched once on module load so we don't need to touch 50+
// fetch call sites. Public/unauthenticated endpoints (login, contact, quote,
// webhook) are skipped so they don't carry a stale token.
if (typeof window !== 'undefined' && !window.__arcanCsrfPatched) {
  window.__arcanCsrfPatched = true;
  const originalFetch = window.fetch.bind(window);
  const CSRF_EXEMPT_PREFIXES = [
    '/api/local-auth/login',
    '/api/local-auth/logout',
    '/api/contact',
    '/api/quote',
    '/api/lead-webhook/',
    '/api/stripe-webhook',
    '/api/health',
  ];
  const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
  window.fetch = function patchedFetch(input, init) {
    try {
      const requestInput = input instanceof Request ? input : undefined;
      const url = typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : input?.url ?? '';
      const method = (init?.method || requestInput?.method || 'GET').toUpperCase();
      const isApi = url.startsWith('/api/') || url.includes('://') && url.includes('/api/');
      const isExempt = CSRF_EXEMPT_PREFIXES.some((p) => url.includes(p));
      if (isApi && !SAFE_METHODS.has(method) && !isExempt) {
        const cookieMatch = document.cookie.match(/(?:^|;\s*)arcan_csrf=([^;]+)/);
        const token = cookieMatch ? decodeURIComponent(cookieMatch[1]) : null;
        if (token) {
          init = init || {};
          const headers = new Headers(init.headers || requestInput?.headers || undefined);
          if (!headers.has('x-csrf-token')) {
            headers.set('x-csrf-token', token);
          }
          init.headers = headers;
        }
      }
    } catch {
      // never let the patch itself break a request
    }
    return originalFetch(input, init);
  };
}

// @ts-ignore
// LoadFonts was provided by the deleted plugins/loadFontsFromTailwindSource
// virtual module. Stripped in v53: the project now uses Tailwind's font-sans
// utility (which maps to Fredoka, Inter, etc. via tailwind.config.js), and
// the explicit Google Fonts preload component was a build-time optimization
// the SPA doesn't need at our scale.
// import { LoadFonts } from 'virtual:load-fonts.jsx';
import { Toaster } from 'sonner';
import type { Route } from './+types/root';

export const links = () => [];

function SharedErrorBoundary({
  isOpen,
  children,
}: {
  isOpen: boolean;
  children?: ReactNode;
}): React.ReactElement {
  return (
    <div
      className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-500 ease-out ${
        isOpen ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
      }`}
    >
      <div className="bg-[#18191B] text-[#F2F2F2] rounded-lg p-4 max-w-md w-full mx-4 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-[#F2F2F2] rounded-full flex items-center justify-center">
              <span className="text-black text-[1.125rem] leading-none">!</span>
            </div>
          </div>
          <div className="flex flex-col gap-2 flex-1">
            <div className="flex flex-col gap-1">
              <p className="font-light text-[#F2F2F2] text-sm">App Error Detected</p>
              <p className="text-[#959697] text-sm font-light">
                It looks like an error occurred while trying to use your app.
              </p>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <SharedErrorBoundary isOpen={true} />;
}

function InternalErrorBoundary({ error: errorArg }: Route.ErrorBoundaryProps) {
  const routeError = useRouteError();
  const asyncError = useAsyncError();
  const error = errorArg ?? asyncError ?? routeError;
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const animateTimer = setTimeout(() => setIsOpen(true), 100);
    return () => clearTimeout(animateTimer);
  }, []);

  const handleCopy = useCallback(() => {
    try {
      const message = error instanceof Error ? `${error.name}: ${error.message}\n\n${error.stack || ''}` : JSON.stringify(error, null, 2);
      navigator.clipboard.writeText(message);
    } catch {
      // clipboard not available
    }
  }, [error]);

  return (
    <SharedErrorBoundary isOpen={isOpen}>
      <button
        className="flex flex-row items-center justify-center gap-[4px] outline-none transition-colors rounded-[8px] border-[1px] bg-[#2C2D2F] hover:bg-[#414243] active:bg-[#555658] border-[#414243] text-white text-sm px-[8px] py-[4px] w-fit"
        type="button"
        onClick={handleCopy}
      >
        Copy error
      </button>
    </SharedErrorBoundary>
  );
}

type ErrorBoundaryProps = {
  children: React.ReactNode;
};

type ErrorBoundaryState = { hasError: boolean; error: unknown | null };

class ErrorBoundaryWrapper extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: unknown, info: unknown) {
    console.error(error, info);
    try {
      import('../sentry.client.js').then(({ Sentry }) => {
        Sentry.withScope((scope: any) => {
          scope.setTag('error_boundary', 'root');
          scope.setExtra('componentStack', (info as any)?.componentStack);
          Sentry.captureException(error);
        });
      });
    } catch {
      // Sentry not available — fail silently
    }
  }

  render() {
    if (this.state.hasError) {
      return <InternalErrorBoundary error={this.state.error} params={{}} />;
    }
    return this.props.children;
  }
}

export function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const pathname = location?.pathname;

  // Per-page meta description. Default is the home/company-wide description;
  // specific routes get a route-specific one so Google doesn't see four pages
  // with the same description (duplicate-content signal that hurts ranking).
  // Map is keyed on the leading URL segment after the slash.
  const pageMeta = (() => {
    const segs = (pathname || "/").split("/").filter(Boolean);
    const seg = segs[0] || "";
    const sub = segs[1] || "";
    // Two-segment routes (admin/leads, admin/calendar, etc.) get the
    // most specific title.
    if (seg === "admin" && sub) {
      const subTitle = sub.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      return {
        title: `${subTitle} | Arcan Painting Admin`,
        description: `Arcan Painting admin ${subTitle.toLowerCase()} page.`,
      };
    }
    // /admin (no sub) is the dashboard.
    if (seg === "admin") {
      return {
        title: "Admin Dashboard | Arcan Painting",
        description: "Arcan Painting internal CRM dashboard.",
      };
    }
    switch (seg) {
      case "quote":
        return {
          title: "Get a Free Painting Quote | Arcan Painting",
          description: "Free instant painting quote for your Toronto or GTA project. Interior, exterior, commercial. Get a detailed estimate in 24 hours.",
        };
      case "contact":
        return {
          title: "Contact Arcan Painting | Free Painting Estimate",
          description: "Get a free painting estimate in 24 hours. Call (416) 727-2148 or send a quick message — we serve Toronto, Mississauga, Brampton, Markham, and the GTA.",
        };
      case "thank-you":
        return {
          title: "Thank You | Arcan Painting",
          description: "We received your request and will be in touch within 24 hours. Book your free painting estimate online or call (416) 727-2148.",
        };
      default:
        return {
          title: "Arcan Painting | Professional Interior & Exterior Painting Services",
          description: "Expert painting services for residential & commercial properties in Toronto and the GTA. Free estimates. Licensed & insured.",
        };
    }
  })();

  // Hide SSR SEO block once React has hydrated — the interactive app takes over
  useEffect(() => {
    const ssrBlock = document.getElementById("ssr-seo-block");
    if (ssrBlock) ssrBlock.style.display = "none";
  }, []);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* SEO: Title & Description (per-page) */}
        <title>{pageMeta.title}</title>
        <meta name="description" content={pageMeta.description} />
        <meta name="geo.region" content="CA-ON" />
        <meta name="geo.position" content="43.6532;-79.3832" />
        <meta name="ICBM" content="43.6532, -79.3832" />
        {/* SEO: Canonical tag */}
        <link rel="canonical" href={`https://arcanpainting.ca${pathname}`} />
        {/* SEO: LocalBusiness JSON-LD schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              "name": "Arcan Painting",
              "description": "Professional interior and exterior painting services for residential and commercial properties in Toronto and the GTA. Licensed, insured, and free estimates.",
              "url": "https://arcanpainting.ca",
              "telephone": "+1 (416) 727-2148",
              "email": "info@arcanpainting.ca",
              "address": {
                "@type": "PostalAddress",
                "addressLocality": "Toronto",
                "addressRegion": "ON",
                "addressCountry": "CA"
              },
              "areaServed": [
                "Toronto", "Scarborough", "North York", "Etobicoke",
                "Mississauga", "Brampton", "Vaughan", "Markham",
                "Richmond Hill", "Pickering", "Ajax", "Oshawa"
              ],
              "image": "https://arcanpainting.ca/logo.png",
              "priceRange": "$$",
              "openingHoursSpecification": [
                {
                  "@type": "OpeningHoursSpecification",
                  "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                  "opens": "08:00",
                  "closes": "18:00"
                },
                {
                  "@type": "OpeningHoursSpecification",
                  "dayOfWeek": ["Saturday"],
                  "opens": "09:00",
                  "closes": "16:00"
                }
              ],
              "sameAs": [
                "https://arcanpainting.ca"
              ]
            })
          }}
        />
        {/* Static OG meta tags for social crawlers (SSR-rendered) */}
        <meta property="og:title" content="Arcan Painting - Professional Toronto Painting Services | GTA's Trusted Painters" />
        <meta property="og:description" content="Transform your Toronto space with professional painting services. Family legacy of quality craftsmanship in the GTA, licensed & insured. Get your free estimate today." />
        <meta property="og:url" content="https://arcanpainting.ca" />
        <meta property="og:site_name" content="Arcan Painting" />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="en_CA" />
        <meta property="og:image" content="https://arcanpainting.ca/og-image.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Arcan Painting Professional Toronto Painting Services" />
        <meta property="og:image:type" content="image/png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@arcanpainting" />
        <meta name="twitter:title" content="Arcan Painting - Professional Toronto Painting Services | GTA's Trusted Painters" />
        <meta name="twitter:description" content="Transform your Toronto space with professional painting services. Family legacy of quality craftsmanship in the GTA, licensed & insured. Get your free estimate today." />
        <meta name="twitter:image" content="https://arcanpainting.ca/og-image.png" />
        <meta name="twitter:image:alt" content="Arcan Painting Professional Toronto Painting Services" />
        {/* SEO: Robots meta */}
        <meta name="robots" content="index, follow" />
        {/* Performance: Preload hero images (critical above-fold) */}
        <link
          rel="preload"
          as="image"
          href="https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=1200&q=80&fm=webp"
          type="image/webp"
          imageSrcSet="https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=600&q=80&fm=webp 600w, https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=1200&q=80&fm=webp 1200w, https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=1920&q=80&fm=webp 1920w"
          imageSizes="(max-width: 640px) 600px, (max-width: 1280px) 1200px, 1920px"
        />
        <Meta />
        <Links />
      </head>
      <body suppressHydrationWarning>
        {/* SSR SEO Block — visible to Google crawlers, hidden after React hydration */}
        <div
          id="ssr-seo-block"
          className="sr-only"
          aria-hidden="true"
        >
          <h1>Professional Painting Services in Toronto &amp; the GTA — Arcan Painting</h1>

          <p>Arcan Painting is Toronto's trusted painting contractor, proudly serving homeowners and businesses across the Greater Toronto Area. With over 15 years of hands-on experience, our family-owned team delivers exceptional interior and exterior painting results — on time, on budget, and backed by our 2-year satisfaction guarantee.</p>

          <p>From a single accent wall to a complete commercial repaint, we treat every project with the same care, precision, and pride that has made us one of the GTA's most recommended painting companies. Whether you need fresh colour for a bedroom, weather-resistant protection for your home's exterior, or a professional finish for your office space, Arcan Painting is the team you can count on.</p>

          <h2>Why Choose Arcan Painting for Your Toronto Painting Project?</h2>

          <ul>
            <li><strong>15+ Years of Experience</strong></li>
            <li><strong>Licensed and Fully Insured</strong></li>
            <li><strong>Premium Materials Only</strong> — Sherwin-Williams and Benjamin Moore</li>
            <li><strong>Guaranteed Satisfaction</strong> — 2-year interior / 5-year exterior warranty</li>
            <li><strong>500+ Happy Clients</strong></li>
          </ul>

          <h2>Our Painting Services</h2>

          <h3>Interior Painting Toronto</h3>
          <p>Transform your living spaces with professional interior painting. Get a <a href="/contact">free estimate for interior painting</a>.</p>

          <h3>Exterior Painting Toronto &amp; GTA</h3>
          <p>Weather-resistant protection for Ontario's climate. Learn more about our <a href="/contact">exterior painting services</a>.</p>

          <h3>Commercial Painting Services</h3>
          <p>Flexible after-hours scheduling. <a href="/contact">Request a commercial painting quote</a>.</p>

          <h3>Wallpaper Installation &amp; Removal</h3>
          <p>Expert wallpaper services for all wallpaper types.</p>

          <h3>Specialty Finishes &amp; Decorative Painting</h3>
          <p>Faux textures, Venetian plaster, limewash, and more.</p>

          <h2>Serving Toronto &amp; the Greater Toronto Area</h2>

          <p>Toronto, Mississauga, Brampton, Markham, Vaughan, Richmond Hill, Oakville, Burlington, Pickering, Ajax, Whitby, Oshawa, Newmarket, Aurora and more. <a href="/contact">Contact us</a> for a free estimate.</p>

          <h2>Get a Free Painting Estimate in Toronto</h2>

          <p>Arcan Painting — Toronto's trusted family painting company. <a href="#quote">Get your free estimate today.</a></p>
        </div>

        <ErrorBoundaryWrapper>
          {children}
        </ErrorBoundaryWrapper>
        <Toaster position="bottom-right" />
        <ScrollRestoration />
        <Scripts />
        <script src="https://kit.fontawesome.com/2c15cc0cc7.js" crossOrigin="anonymous" async />
      </body>
    </html>
  );
}

export default function App() {
  // QueryClient lives at the App root so every route gets a client in scope.
  // The file-based router in src/app/routes.ts only mounts page.jsx (not
  // layout.jsx), so the QueryClientProvider that previously lived in
  // layout.jsx was never being mounted. Components like <ContactSection>
  // call useMutation from TanStack Query and crash with "No QueryClient
  // set" if the provider is missing. Mounting here is cheap (one client
  // per session) and fixes the home page 500.
  const queryClient = useMemo(() => new QueryClient(), []);
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  );
}
