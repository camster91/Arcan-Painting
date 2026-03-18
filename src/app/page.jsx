import Header from "../components/Header";
import QuoteRequestForm from "../components/QuoteRequestForm";
import HeroSection from "../components/HeroSection";
import ServicesSection from "../components/ServicesSection";
import ProcessSection from "../components/ProcessSection";
// import PortfolioSection from "../components/PortfolioSection"; // REMOVED for now
// import PricingSection from "../components/PricingSection"; // HIDDEN for now
// import TestimonialsSection from "../components/TestimonialsSection"; // REMOVED for now
import GuaranteeSection from "../components/GuaranteeSection";
import LocalAreaSection from "../components/LocalAreaSection";
import FAQSection from "../components/FAQSection";
import AboutSection from "../components/AboutSection";
import ContactSection from "../components/ContactSection";
import Footer from "../components/Footer";

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

      {/* Header - Navigation bar with logo and CTA */}
      <Header />

      {/* Main content */}
      <main id="main" role="main" tabIndex={-1}>
        {/* Hero Section - Main banner with background image and CTA */}
        <HeroSection />

        {/* Services Section - Interior, exterior, commercial, residential painting */}
        <ServicesSection />

        {/* Process Section - Step-by-step how we work */}
        <ProcessSection />

        {/* Portfolio Section - Before/after project photos */}
        {/* <PortfolioSection /> REMOVED for now */}

        {/* Unified Pricing Section - Calculator + transparent pricing tiers */}
        {/* <PricingSection /> */}

        {/* Testimonials Section - Customer reviews and ratings */}
        {/* <TestimonialsSection /> REMOVED for now */}

        {/* Guarantee Section - Risk reversal with warranties */}
        <GuaranteeSection />

        {/* Local Area Section - Service areas and local expertise */}
        <LocalAreaSection />

        {/* FAQ Section - Address common concerns */}
        <FAQSection />

        {/* About Section - Family business heritage and experience */}
        <AboutSection />

        {/* Quote Request Section */}
        <section id="quote" className="py-20 bg-gradient-to-b from-white to-amber-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Get a Free Quote</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Tell us about your project and we'll send you a detailed estimate within 24-48 hours. No obligation.
              </p>
            </div>
            <QuoteRequestForm />
          </div>
        </section>

        {/* Contact Section - Contact form and business information */}
        <ContactSection />
      </main>

      {/* Footer - Business info, social media, additional navigation */}
      <Footer />
    </div>
  );
}
