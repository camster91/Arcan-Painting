import { lazy, Suspense } from "react";
import Header from "../components/Header";
import HeroSection from "../components/HeroSection";
import ServicesSection from "../components/ServicesSection";

// ─── Below-fold sections: lazy loaded for faster initial bundle ───────────────
const ProcessSection = lazy(() => import("../components/ProcessSection"));
const PortfolioSection = lazy(() => import("../components/PortfolioSection"));
const PricingSection = lazy(() => import("../components/PricingSection"));
const GuaranteeSection = lazy(() => import("../components/GuaranteeSection"));
const LocalAreaSection = lazy(() => import("../components/LocalAreaSection"));
const FAQSection = lazy(() => import("../components/FAQSection"));
const AboutSection = lazy(() => import("../components/AboutSection"));
const ContactSection = lazy(() => import("../components/ContactSection"));
const Footer = lazy(() => import("../components/Footer"));

// Minimal skeleton that matches each section's approximate height
function SectionSkeleton({ minHeight = "24rem" }) {
  return (
    <div
      className="w-full animate-pulse bg-slate-100"
      style={{ minHeight }}
      aria-hidden="true"
    />
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white transition-colors duration-300">
      {/* Skip to content link for accessibility */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-amber-500 focus:text-slate-900 focus:px-4 focus:py-2 focus:rounded-lg"
      >
        Skip to content
      </a>

      {/* Header - critical path, loaded synchronously */}
      <Header />

      {/* Main content */}
      <main id="main" role="main" tabIndex={-1}>
        {/* Hero Section - critical path, loaded synchronously */}
        <HeroSection />

        {/* Services Section - near top of page, loaded synchronously */}
        <ServicesSection />

        {/* Below-fold sections: lazy loaded */}

        {/* Process Section */}
        <Suspense fallback={<SectionSkeleton minHeight="32rem" />}>
          <ProcessSection />
        </Suspense>

        {/* Portfolio Section */}
        <Suspense fallback={<SectionSkeleton minHeight="40rem" />}>
          <PortfolioSection />
        </Suspense>

        {/* Pricing Section - Calculator + transparent pricing tiers */}
        <Suspense fallback={<SectionSkeleton minHeight="36rem" />}>
          <PricingSection />
        </Suspense>

        {/* Guarantee Section */}
        <Suspense fallback={<SectionSkeleton minHeight="20rem" />}>
          <GuaranteeSection />
        </Suspense>

        {/* Local Area Section */}
        <Suspense fallback={<SectionSkeleton minHeight="24rem" />}>
          <LocalAreaSection />
        </Suspense>

        {/* FAQ Section */}
        <Suspense fallback={<SectionSkeleton minHeight="28rem" />}>
          <FAQSection />
        </Suspense>

        {/* About Section */}
        <Suspense fallback={<SectionSkeleton minHeight="32rem" />}>
          <AboutSection />
        </Suspense>

        {/* Contact Section */}
        <Suspense fallback={<SectionSkeleton minHeight="36rem" />}>
          <ContactSection />
        </Suspense>
      </main>

      {/* Footer */}
      <Suspense fallback={<SectionSkeleton minHeight="16rem" />}>
        <Footer />
      </Suspense>
    </div>
  );
}
