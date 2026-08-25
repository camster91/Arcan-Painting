import Header from "../components/Header";
import HeroSection from "../components/HeroSection";
import ServicesSection from "../components/ServicesSection";

// ─── Below-fold sections: lazy loaded for faster initial bundle ───────────────
import ProcessSection from "../components/ProcessSection";
import PortfolioSection from "../components/PortfolioSection";
import FAQSection from "../components/FAQSection";
import ContactSection from "../components/ContactSection";
import Footer from "../components/Footer";


export default function HomePage() {
  return (
    <div className="min-h-screen bg-white transition-colors duration-300">
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
        
          <ProcessSection />
        

        {/* Portfolio Section */}
        
          <PortfolioSection />
        

        {/* FAQ Section */}
        
          <FAQSection />
        

        {/* Contact Section */}
        
          <ContactSection />
        
      </main>

      {/* Footer */}
      
        <Footer />
      
    </div>
  );
}
