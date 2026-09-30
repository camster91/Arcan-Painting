"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import QuoteCalculatorSection from "@/components/QuoteCalculatorSection";
import ContactSection from "@/components/ContactSection";

export default function QuotePage() {
  // The page-level `mounted` gate that used to be here (useState(false) +
  // useEffect setMounted(true)) was breaking SSR — the <main> rendered
  // empty because `mounted` is always false during streaming SSR. The
  // QuoteCalculatorSection is SSR-safe on its own (it uses
  // useTheme().mounted for any client-only styling, and v55's defensive
  // useTheme returns a safe default).
  return (
    <div className="min-h-screen bg-paper text-ink transition-colors duration-300">
      <Header />
      <main id="main" tabIndex={-1}>
        <QuoteCalculatorSection />
      </main>
      {/* The calculator's button scrolls to #contact, so the form must be on this page. */}
      <ContactSection />
      <Footer />
    </div>
  );
}
