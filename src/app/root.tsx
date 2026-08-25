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
// fetch call sites. The login endpoint is unauthenticated; every other
// state-changing API request carries the token when a logged-in browser has
// one, including public forms submitted from an admin session.
if (typeof window !== 'undefined' && !window.__arcanCsrfPatched) {
  window.__arcanCsrfPatched = true;
  const originalFetch = window.fetch.bind(window);
  const CSRF_EXEMPT_PREFIXES = [
    '/api/local-auth/login',
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

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);

  if (!url.pathname.startsWith('/admin')) {
    return null;
  }

  // Routes are generated directly from page modules, so admin/layout.jsx is
  // not a route boundary. Keep this server-side guard at the root instead so
  // every nested admin URL is protected before its page module renders.
  const { protectAdminRoute } = await import('./admin/route-guard.server.js');
  return protectAdminRoute(request);
}

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
  const isAccountPage = pathname?.startsWith('/account/');

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
          title: "Project Inquiry | Arcan Painting",
          description: "Tell Arcan Painting about your project and a team member can review the details with you.",
        };
      case "contact":
        return {
          title: "Contact Arcan Painting",
          description: "Contact Arcan Painting to discuss your project.",
        };
      case "thank-you":
        return {
          title: "Thank You | Arcan Painting",
          description: "We received your request. A team member can review the details before confirming next steps.",
        };
      default:
        return {
          title: "Arcan Painting | Project Inquiries",
          description: "Contact Arcan Painting to discuss your project.",
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
              "description": "Contact Arcan Painting to discuss a project.",
              "url": "https://arcanpainting.ca",
              "email": "info@arcanpainting.ca",
              "image": "https://arcanpainting.ca/logo.png"
            })
          }}
        />
        {/* Static OG meta tags for social crawlers (SSR-rendered) */}
        <meta property="og:title" content="Arcan Painting" />
        <meta property="og:description" content="Contact Arcan Painting to discuss a project." />
        <meta property="og:url" content="https://arcanpainting.ca" />
        <meta property="og:site_name" content="Arcan Painting" />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="en_CA" />
        <meta property="og:image" content="https://arcanpainting.ca/og-image.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Arcan Painting" />
        <meta property="og:image:type" content="image/png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@arcanpainting" />
        <meta name="twitter:title" content="Arcan Painting" />
        <meta name="twitter:description" content="Contact Arcan Painting to discuss a project." />
        <meta name="twitter:image" content="https://arcanpainting.ca/og-image.png" />
        <meta name="twitter:image:alt" content="Arcan Painting" />
        {/* SEO: Robots meta */}
        <meta name="robots" content={isAccountPage ? "noindex, nofollow" : "index, follow"} />
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
          <h1>Arcan Painting</h1>
          <p><a href="/contact">Contact us</a> to discuss your project.</p>
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
