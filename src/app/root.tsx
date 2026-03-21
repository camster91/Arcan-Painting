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

import { useButton } from '@react-aria/button';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type FC,
  Component,
} from 'react';
import './global.css';

// Sentry client init — must run before any other app code
import { initSentryClient } from '../sentry.client.js';
if (typeof window !== 'undefined') {
  initSentryClient();
}

import fetch from '@/__create/fetch';
// @ts-ignore
import { SessionProvider } from '@auth/create/react';
import { useNavigate } from 'react-router';
import { serializeError } from 'serialize-error';
import { Toaster } from 'sonner';
// @ts-ignore
import { LoadFonts } from 'virtual:load-fonts.jsx';
import { HotReloadIndicator } from '../__create/HotReload';
import { useSandboxStore } from '../__create/hmr-sandbox-store';
import type { Route } from './+types/root';
import { useDevServerHeartbeat } from '../__create/useDevServerHeartbeat';

export const links = () => [];

if (globalThis.window && globalThis.window !== undefined) {
  globalThis.window.fetch = fetch;
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
              <span className="text-black text-[1.125rem] leading-none">⚠</span>
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

/**
 * NOTE: we have a shared error boundary for the app, but then we also expose
 * this in case something goes wrong outside of the normal user's app flow.
 * React-router will mount this one
 */
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
  const { buttonProps: showLogsButtonProps } = useButton(
    {
      onPress: useCallback(() => {
        window.parent.postMessage(
          {
            type: 'sandbox:web:show-logs',
          },
          '*'
        );
      }, []),
    },
    useRef<HTMLButtonElement>(null)
  );
  const { buttonProps: fixButtonProps } = useButton(
    {
      onPress: useCallback(() => {
        window.parent.postMessage(
          {
            type: 'sandbox:web:fix',
            error: serializeError(error),
          },
          '*'
        );
        setIsOpen(false);
      }, [error]),
      isDisabled: !error,
    },
    useRef<HTMLButtonElement>(null)
  );
  const { buttonProps: copyButtonProps } = useButton(
    {
      onPress: useCallback(() => {
        navigator.clipboard.writeText(JSON.stringify(serializeError(error)));
      }, [error]),
    },
    useRef<HTMLButtonElement>(null)
  );

  function isInIframe() {
    try {
      return window.parent !== window;
    } catch {
      return true;
    }
  }
  return (
    <SharedErrorBoundary isOpen={isOpen}>
      {isInIframe() ? (
        <div className="flex gap-2">
          {!!error && (
            <button
              className="flex flex-row items-center justify-center gap-[4px] outline-none transition-colors rounded-[8px] border-[1px] bg-[#f9f9f9] hover:bg-[#dbdbdb] active:bg-[#c4c4c4] border-[#c4c4c4] text-[#18191B] text-sm px-[8px] py-[4px] cursor-pointer"
              type="button"
              {...fixButtonProps}
            >
              Try to fix
            </button>
          )}

          <button
            className="flex flex-row items-center justify-center gap-[4px] outline-none transition-colors rounded-[8px] border-[1px] bg-[#2C2D2F] hover:bg-[#414243] active:bg-[#555658] border-[#414243] text-white text-sm px-[8px] py-[4px]"
            type="button"
            {...showLogsButtonProps}
          >
            Show logs
          </button>
        </div>
      ) : (
        <button
          className="flex flex-row items-center justify-center gap-[4px] outline-none transition-colors rounded-[8px] border-[1px] bg-[#2C2D2F] hover:bg-[#414243] active:bg-[#555658] border-[#414243] text-white text-sm px-[8px] py-[4px] w-fit"
          type="button"
          {...copyButtonProps}
        >
          Copy error
        </button>
      )}
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
    // Report to Sentry
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

function LoaderWrapper({ loader }: { loader: () => React.ReactNode }) {
  return <>{loader()}</>;
}

type ClientOnlyProps = {
  loader: () => React.ReactNode;
};

export const ClientOnly: React.FC<ClientOnlyProps> = ({ loader }) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <ErrorBoundaryWrapper>
      <LoaderWrapper loader={loader} />
    </ErrorBoundaryWrapper>
  );
};

/**
 * useHmrConnection()
 * ------------------
 * • `true`  → HMR socket is healthy
 * • `false` → socket lost (Vite is polling / may auto‑reload soon)
 *
 * Works only in dev; in prod it always returns `true`.
 */
export function useHmrConnection(): boolean {
  const [connected, setConnected] = useState(() => !!import.meta.hot);

  useEffect(() => {
    // No HMR object outside dev builds
    if (!import.meta.hot) return;

    /** Fired the moment the WS closes unexpectedly */
    const onDisconnect = () => setConnected(false);
    /** Fired every time the WS (re‑)opens */
    const onConnect = () => setConnected(true);

    import.meta.hot.on('vite:ws:disconnect', onDisconnect);
    import.meta.hot.on('vite:ws:connect', onConnect);

    // Optional: catch the “about to full‑reload” event as a last resort
    const onFullReload = () => setConnected(false);
    import.meta.hot.on('vite:beforeFullReload', onFullReload);

    return () => {
      import.meta.hot?.off('vite:ws:disconnect', onDisconnect);
      import.meta.hot?.off('vite:ws:connect', onConnect);
      import.meta.hot?.off('vite:beforeFullReload', onFullReload);
    };
  }, []);

  return connected;
}

const healthyResponseType = 'sandbox:web:healthcheck:response';
const useHandshakeParent = () => {
  const isHmrConnected = useHmrConnection();
  useEffect(() => {
    const healthyResponse = {
      type: healthyResponseType,
      healthy: isHmrConnected,
    };
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'sandbox:web:healthcheck') {
        window.parent.postMessage(healthyResponse, '*');
      }
    };
    window.addEventListener('message', handleMessage);
    // Immediately respond to the parent window with a healthy response in
    // case we missed the healthcheck message
    window.parent.postMessage(healthyResponse, '*');
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [isHmrConnected]);
};

const useCodeGen = () => {
  const { startCodeGen, setCodeGenGenerating, completeCodeGen, errorCodeGen, stopCodeGen } =
    useSandboxStore();

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const { type } = event.data;

      switch (type) {
        case 'sandbox:web:codegen:started':
          startCodeGen();
          break;
        case 'sandbox:web:codegen:generating':
          setCodeGenGenerating();
          break;
        case 'sandbox:web:codegen:complete':
          completeCodeGen();
          break;
        case 'sandbox:web:codegen:error':
          errorCodeGen();
          break;
        case 'sandbox:web:codegen:stopped':
          stopCodeGen();
          break;
      }
    };
    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [startCodeGen, setCodeGenGenerating, completeCodeGen, errorCodeGen, stopCodeGen]);
};

const useRefresh = () => {
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'sandbox:web:refresh:request') {
        setTimeout(() => {
          window.location.reload();
        }, 1000);
        window.parent.postMessage({ type: 'sandbox:web:refresh:complete' }, '*');
      }
    };
    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);
};

export function Layout({ children }: { children: ReactNode }) {
  useHandshakeParent();
  useCodeGen();
  useRefresh();
  useDevServerHeartbeat();
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location?.pathname;
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'sandbox:navigation') {
        navigate(event.data.pathname);
      }
    };
    window.addEventListener('message', handleMessage);
    window.parent.postMessage({ type: 'sandbox:web:ready' }, '*');
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [navigate]);

  useEffect(() => {
    if (pathname) {
      window.parent.postMessage(
        {
          type: 'sandbox:web:navigation',
          pathname,
        },
        '*'
      );
    }
  }, [pathname]);

  // Hide SSR SEO block once React has hydrated — the interactive app takes over
  useEffect(() => {
    const ssrBlock = document.getElementById('ssr-seo-block');
    if (ssrBlock) ssrBlock.style.display = 'none';
  }, []);
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* SEO: Title & Description */}
        <title>Arcan Painting | Professional Interior &amp; Exterior Painting Services</title>
        <meta name="description" content="Expert painting services for residential &amp; commercial properties. Free estimates. Licensed &amp; insured." />
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
              "image": "https://ucarecdn.com/599e7887-839f-4d2a-ba07-41425b1276a2/",
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
        <meta property="og:image" content="https://ucarecdn.com/599e7887-839f-4d2a-ba07-41425b1276a2/-/format/auto/-/resize/1200x630/-/quality/smart/" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Arcan Painting Professional Toronto Painting Services" />
        <meta property="og:image:type" content="image/jpeg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@arcanpainting" />
        <meta name="twitter:title" content="Arcan Painting - Professional Toronto Painting Services | GTA's Trusted Painters" />
        <meta name="twitter:description" content="Transform your Toronto space with professional painting services. Family legacy of quality craftsmanship in the GTA, licensed & insured. Get your free estimate today." />
        <meta name="twitter:image" content="https://ucarecdn.com/599e7887-839f-4d2a-ba07-41425b1276a2/-/format/auto/-/resize/1200x630/-/quality/smart/" />
        <meta name="twitter:image:alt" content="Arcan Painting Professional Toronto Painting Services" />
        {/* SEO: Geo tags for local search */}
        <meta name="geo.region" content="CA-ON" />
        <meta name="geo.position" content="43.6532;-79.3832" />
        <meta name="ICBM" content="43.6532, -79.3832" />
        {/* SEO: Robots meta */}
        <meta name="robots" content="index, follow" />
        {/* Performance: Preload hero images (critical above-fold) */}
        <link
          rel="preload"
          as="image"
          href="https://ucarecdn.com/8549198e-0903-4f02-a80c-424ffc8e2dc9/-/format/webp/-/resize/1200x/"
          type="image/webp"
          imageSrcSet="https://ucarecdn.com/8549198e-0903-4f02-a80c-424ffc8e2dc9/-/format/webp/-/resize/600x/ 600w, https://ucarecdn.com/8549198e-0903-4f02-a80c-424ffc8e2dc9/-/format/webp/-/resize/1200x/ 1200w, https://ucarecdn.com/8549198e-0903-4f02-a80c-424ffc8e2dc9/-/format/webp/-/resize/1920x/ 1920w"
          imageSizes="(max-width: 640px) 600px, (max-width: 1280px) 1200px, 1920px"
        />
        <link
          rel="preload"
          as="image"
          href="https://raw.createusercontent.com/bf59fc7f-c2f3-4eee-adaa-a7482b62994f/-/format/webp/-/resize/1920x/"
          type="image/webp"
        />
        <Meta />
        <Links />
        <script type="module" src="/src/__create/dev-error-overlay.js"></script>
        <link rel="icon" href="/src/__create/favicon.png" />
        <LoadFonts />
      </head>
      <body>
        {/* SSR SEO Block — visible to Google crawlers, hidden after React hydration */}
        <div
          id="ssr-seo-block"
          style={{
            position: 'absolute',
            left: '-9999px',
            top: '-9999px',
            width: '1px',
            height: '1px',
            overflow: 'hidden',
            clip: 'rect(0,0,0,0)',
            whiteSpace: 'nowrap',
          }}
          aria-hidden="true"
        >
          <h1>Professional Painting Services in Toronto &amp; the GTA — Arcan Painting</h1>

          <p>Arcan Painting is Toronto's trusted painting contractor, proudly serving homeowners and businesses across the Greater Toronto Area. With over 15 years of hands-on experience, our family-owned team delivers exceptional interior and exterior painting results — on time, on budget, and backed by our 2-year satisfaction guarantee.</p>

          <p>From a single accent wall to a complete commercial repaint, we treat every project with the same care, precision, and pride that has made us one of the GTA's most recommended painting companies. Whether you need fresh colour for a bedroom, weather-resistant protection for your home's exterior, or a professional finish for your office space, Arcan Painting is the team you can count on.</p>

          <h2>Why Choose Arcan Painting for Your Toronto Painting Project?</h2>

          <p>Choosing the right painting contractor is about more than just a good price. It's about trust, quality, and results that last. Here's why thousands of GTA homeowners and businesses choose us:</p>

          <ul>
            <li><strong>15+ Years of Experience:</strong> Our team has painted hundreds of homes and commercial properties across Toronto and the GTA. We know exactly what works — and what doesn't — in Ontario's climate.</li>
            <li><strong>Licensed and Fully Insured:</strong> We carry comprehensive liability insurance and workers' compensation coverage. You'll receive proof of insurance before any work begins, giving you complete peace of mind.</li>
            <li><strong>Premium Materials Only:</strong> We use industry-leading paints from Sherwin-Williams and Benjamin Moore — including low-VOC and zero-VOC formulas that are safe for your family and the environment.</li>
            <li><strong>Guaranteed Satisfaction:</strong> Every project comes with our 2-year workmanship warranty on interior work and 5-year warranty on exterior work. If something isn't right, we make it right.</li>
            <li><strong>Clean, Respectful Work Crews:</strong> We protect your furniture, floors, and belongings with drop cloths, plastic sheeting, and careful masking. We treat your home as if it were our own.</li>
            <li><strong>500+ Happy Clients:</strong> Our reputation is built on referrals and repeat business. Check our reviews — our clients say it best.</li>
          </ul>

          <h2>Our Painting Services</h2>

          <p>We offer a comprehensive range of painting and finishing services to meet every need, budget, and style. From small residential rooms to large-scale commercial projects, no job is too big or too small.</p>

          <h3>Interior Painting Toronto</h3>
          <p>Transform your living spaces with professional interior painting. Our interior painting services cover bedrooms, living rooms, kitchens, bathrooms, hallways, basements, and more. We start with thorough surface preparation — filling holes, sanding rough patches, and priming where needed — so your new paint goes on smooth and looks flawless. We offer complimentary colour consultation with every interior project, helping you choose hues that complement your furniture, lighting, and personal style. Get a <a href="/contact">free estimate for interior painting</a>.</p>

          <h3>Exterior Painting Toronto &amp; GTA</h3>
          <p>Ontario's climate is tough on exterior surfaces. Freeze-thaw cycles, humidity, UV exposure, and heavy rain can damage paint and expose your home's structure to costly moisture damage. Our exterior painting service starts with thorough pressure washing, followed by surface repair, premium priming, and weather-resistant topcoats designed specifically for Ontario conditions. The result: a beautiful finish that protects your home for years to come. Learn more about our <a href="/contact">exterior painting services</a>.</p>

          <h3>Commercial Painting Services</h3>
          <p>We understand that downtime costs your business money. That's why we offer flexible after-hours and weekend scheduling for our commercial clients. Our commercial painting team handles offices, retail spaces, warehouses, restaurants, multi-unit residential buildings, and more. We use commercial-grade materials and large-scale equipment to deliver fast, consistent results with minimal disruption to your operations. <a href="/contact">Request a commercial painting quote</a>.</p>

          <h3>Wallpaper Installation &amp; Removal</h3>
          <p>Expert wallpaper services including installation of all wallpaper types — vinyl, grasscloth, fabric, peel-and-stick — with perfect pattern matching and seamless edges. We also offer professional wallpaper removal without damaging your walls, followed by proper surface prep so your new paint or wallpaper adheres perfectly.</p>

          <h3>Specialty Finishes &amp; Decorative Painting</h3>
          <p>Looking for something unique? Our team offers specialty finishes including faux textures, Venetian plaster, limewash, and decorative feature wall treatments. We also apply protective industrial coatings for high-traffic commercial areas and garage floors. If you can imagine it, we can paint it.</p>

          <h2>Our Painting Process — How We Work</h2>

          <p>We believe a great paint job starts long before the brush ever touches the wall. Here's what you can expect when you hire Arcan Painting:</p>

          <ol>
            <li><strong>Free On-Site Estimate:</strong> We visit your property, assess the scope of work, discuss your vision, and provide a detailed written quote — no obligation, no pressure.</li>
            <li><strong>Colour Consultation:</strong> Our experienced team helps you choose the perfect colours and finishes. We can provide sample patches on your walls before committing to a full colour.</li>
            <li><strong>Surface Preparation:</strong> We pressure wash (exterior), repair cracks and holes, sand surfaces, and apply primer where needed. Good prep is the foundation of a long-lasting paint job.</li>
            <li><strong>Professional Application:</strong> Our crews use professional-grade brushes, rollers, and sprayers to achieve a consistent, flawless finish. We apply two coats minimum on all projects.</li>
            <li><strong>Final Walkthrough:</strong> Before we pack up, we walk through the project with you to ensure every detail meets your expectations. We don't consider a job done until you're satisfied.</li>
            <li><strong>Clean-Up &amp; Touch-Ups:</strong> We remove all masking, clean up our work areas, and handle any touch-ups on the spot. We leave your space cleaner than we found it.</li>
          </ol>

          <h2>Serving Toronto &amp; the Greater Toronto Area</h2>

          <p>We proudly serve homeowners and businesses in Toronto and across the entire GTA, including:</p>

          <ul>
            <li>Toronto (Scarborough, North York, Etobicoke, East York, Downtown)</li>
            <li>Mississauga</li>
            <li>Brampton</li>
            <li>Markham</li>
            <li>Vaughan</li>
            <li>Richmond Hill</li>
            <li>Oakville</li>
            <li>Burlington</li>
            <li>Pickering</li>
            <li>Ajax</li>
            <li>Whitby</li>
            <li>Oshawa</li>
            <li>Newmarket</li>
            <li>Aurora</li>
          </ul>

          <p>Not sure if we serve your area? <a href="/contact">Contact us</a> — we likely do, and we'd love to give you a free estimate.</p>

          <h2>Trust Signals &amp; Credentials</h2>

          <p>When you invite a painting crew into your home or business, trust matters. Here's why Arcan Painting has earned the trust of hundreds of GTA customers:</p>

          <ul>
            <li>✓ Fully licensed painting contractor in Ontario</li>
            <li>✓ Comprehensive liability insurance — up to $2M coverage</li>
            <li>✓ WSIB-covered workers for your protection</li>
            <li>✓ 500+ completed projects across the GTA</li>
            <li>✓ Family-owned and operated — we answer the phone</li>
            <li>✓ 5-star rated by our clients</li>
            <li>✓ Free, no-obligation estimates within 24 hours</li>
            <li>✓ 2-year interior / 5-year exterior workmanship warranty</li>
          </ul>

          <h2>Get a Free Painting Estimate in Toronto</h2>

          <p>Ready to transform your space? Getting started is easy. Fill out our quick <a href="#quote">online estimate form</a> or <a href="/contact">contact us directly</a> and a member of our team will be in touch within 24 hours to schedule your free on-site consultation.</p>

          <p>We serve the entire GTA and our estimates are always free, detailed, and no-obligation. Whether your project is big or small, we'd love the opportunity to earn your business and deliver results you'll be proud of for years to come.</p>

          <p>Arcan Painting — Toronto's trusted family painting company. <a href="#quote">Get your free estimate today.</a></p>
        </div>

        <ClientOnly loader={() => children} />
        <HotReloadIndicator />
        <Toaster position="bottom-right" />
        <ScrollRestoration />
        <Scripts />
        <script src="https://kit.fontawesome.com/2c15cc0cc7.js" crossOrigin="anonymous" async />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <SessionProvider>
      <Outlet />
    </SessionProvider>
  );
}
