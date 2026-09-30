"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ContactSection from "@/components/ContactSection";

export default function ContactPage() {
  // Removed the page-level `mounted` gate (was: const [mounted, setMounted] =
  // useState(false); useEffect(() => setMounted(true), []); {mounted &&
  // <ContactSection />}). That gate was breaking SSR — `mounted` is always
  // false during streaming SSR, so the page rendered an empty <main>.
  // ContactSection is SSR-safe on its own (v55's defensive useTheme).
  return (
    <div className="min-h-screen bg-paper text-ink transition-colors duration-300">
      <Header />
      <main id="main" tabIndex={-1} className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        <h1 className="font-display text-4xl font-normal text-ink mb-2">Contact Arcan Painting</h1>
        <p className="text-muted mb-8">
          Tell us about your project and a team member can review the details with you.
        </p>
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
}
