import Header from "../../components/Header";
import Footer from "../../components/Footer";

export const metadata = {
  title: "Commercial Painting Toronto | Professional Commercial Painters GTA | Arcan Painting",
  description:
    "Expert commercial painting services in Toronto and the GTA. Office buildings, retail spaces, warehouses & more. Minimal downtime, large crews, premium finishes. Licensed & insured. Free estimates.",
  keywords:
    "commercial painting Toronto, commercial painters GTA, office painting Toronto, retail painting Toronto, industrial painting Toronto, commercial building painters, professional commercial painting services GTA",
  alternates: {
    canonical: "https://arcanpainting.ca/commercial-painting",
  },
  openGraph: {
    title: "Commercial Painting Toronto | Arcan Painting",
    description:
      "Expert commercial painting services in Toronto and the GTA. Office buildings, retail spaces, warehouses & more. Free estimates.",
    url: "https://arcanpainting.ca/commercial-painting",
    siteName: "Arcan Painting",
    type: "website",
    locale: "en_CA",
    images: [
      {
        url: "https://arcanpainting.ca/og-image.png",
        width: 1200,
        height: 630,
        alt: "Commercial Painting Services Toronto - Arcan Painting",
      },
    ],
  },
};

const schema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "LocalBusiness",
      "@id": "https://arcanpainting.ca/#business",
      name: "Arcan Painting",
      url: "https://arcanpainting.ca",
      image: "https://arcanpainting.ca/og-image.png",
      description:
        "Professional painting contractor serving Toronto and the GTA since 1995.",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Toronto",
        addressRegion: "ON",
        addressCountry: "CA",
      },
      areaServed: ["Toronto", "Mississauga", "Brampton", "Markham", "Vaughan", "Richmond Hill", "Oakville"],
      email: "info@arcanpainting.ca",
      priceRange: "$$",
      openingHours: "Mo-Fr 07:00-18:00, Sa 08:00-16:00",
    },
    {
      "@type": "Service",
      "@id": "https://arcanpainting.ca/commercial-painting#service",
      name: "Commercial Painting Services Toronto",
      serviceType: "Commercial Painting",
      provider: { "@id": "https://arcanpainting.ca/#business" },
      areaServed: ["Toronto", "GTA", "Ontario"],
      description:
        "Professional commercial painting services for offices, retail, and industrial properties in Toronto and the GTA. Large crews, off-hours scheduling, and commercial-grade coatings.",
      offers: {
        "@type": "Offer",
        priceSpecification: {
          "@type": "PriceSpecification",
          priceCurrency: "CAD",
          description: "Custom quotes based on scope; contact us for a detailed assessment",
        },
      },
    },
  ],
};

export default function CommercialPaintingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <div className="min-h-screen bg-white">
        <Header />

        <main>
          {/* Hero */}
          <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 py-20 lg:py-32">
            <div className="max-w-5xl mx-auto px-6 text-center">
              <div className="inline-flex items-center gap-2 bg-amber-400/20 border border-amber-400/40 rounded-full px-5 py-2 mb-8">
                <span className="text-amber-400 font-semibold text-sm uppercase tracking-wider">Commercial Painting</span>
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6">
                Commercial Painting<br />
                <span className="text-amber-400">Toronto & GTA</span>
              </h1>
              <p className="text-xl lg:text-2xl text-slate-300 max-w-3xl mx-auto leading-relaxed mb-10">
                Keep your business looking its best. Our commercial painting crews deliver fast, professional results with minimal disruption to your operations.
              </p>
              <a
                href="/#contact"
                className="inline-block bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold px-10 py-4 rounded-xl text-xl transition-all duration-300 hover:scale-105 shadow-lg"
              >
                Get a Commercial Quote
              </a>
            </div>
          </section>

          {/* Industries Served */}
          <section className="py-20 bg-white">
            <div className="max-w-5xl mx-auto px-6">
              <h2 className="text-4xl font-bold text-slate-900 text-center mb-4">
                Industries We Serve
              </h2>
              <p className="text-slate-600 text-center text-lg mb-14 max-w-2xl mx-auto">
                From small offices to large commercial properties — we've done it all across the GTA.
              </p>
              <div className="grid md:grid-cols-3 gap-8">
                {[
                  {
                    title: "Office Buildings",
                    desc: "Professional office environments painted during off-hours to avoid disrupting your team. Quick turnarounds and clean finishes.",
                  },
                  {
                    title: "Retail Spaces",
                    desc: "Brand-matching colors, feature walls, and high-traffic durable finishes for retail stores, restaurants, and hospitality venues.",
                  },
                  {
                    title: "Warehouses & Industrial",
                    desc: "Heavy-duty coatings, floor paint, safety markings, and industrial-grade finishes for warehouses and manufacturing facilities.",
                  },
                  {
                    title: "Strata & Condos",
                    desc: "Common areas, hallways, lobbies, parkades, and exterior corridors for strata corporations and property managers.",
                  },
                  {
                    title: "Healthcare & Education",
                    desc: "Low-odour, antimicrobial paint options for hospitals, clinics, schools, and daycares — safe environments guaranteed.",
                  },
                  {
                    title: "New Construction",
                    desc: "Full painting packages for builders and developers — from prime to final coat across every unit and common space.",
                  },
                ].map((item, i) => (
                  <div key={i} className="bg-slate-50 rounded-2xl p-7 border border-slate-100">
                    <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                    <p className="text-slate-600 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Why Choose Us for Commercial */}
          <section className="py-20 bg-slate-50">
            <div className="max-w-4xl mx-auto px-6">
              <h2 className="text-4xl font-bold text-slate-900 text-center mb-12">
                Why Businesses Choose Arcan Painting
              </h2>
              <div className="grid md:grid-cols-2 gap-8">
                {[
                  {
                    title: "Minimal Business Disruption",
                    desc: "We schedule work around your hours — evenings, weekends, phased sections — so your operations never skip a beat.",
                  },
                  {
                    title: "Large, Experienced Crews",
                    desc: "Need 10,000 sq ft done in a weekend? We can mobilize large crews to hit tight commercial deadlines.",
                  },
                  {
                    title: "Fully Licensed & Insured",
                    desc: "We carry full commercial liability insurance and WSIB coverage. You'll receive proof of insurance before any work begins.",
                  },
                  {
                    title: "Commercial-Grade Products",
                    desc: "We use Sherwin-Williams commercial and industrial coatings — built for durability in high-traffic environments.",
                  },
                  {
                    title: "Detailed Project Management",
                    desc: "Dedicated project manager for every commercial job. You'll always know who to call and what's happening on-site.",
                  },
                  {
                    title: "Competitive Tendering",
                    desc: "We provide detailed, itemized quotes for RFP processes and work with property managers and GCs regularly.",
                  },
                ].map((item, i) => (
                  <div key={i} className="bg-white rounded-2xl p-7 border border-slate-200 flex gap-4">
                    <span className="text-amber-400 font-extrabold text-2xl leading-tight">✓</span>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
                      <p className="text-slate-600 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pricing note */}
              <div className="mt-12 bg-white border border-amber-200 rounded-2xl p-8 text-center">
                <h3 className="text-2xl font-bold text-slate-900 mb-3">Commercial Pricing</h3>
                <p className="text-slate-600 text-lg leading-relaxed max-w-xl mx-auto">
                  Commercial projects are priced based on scope, surface area, access requirements, and timeline. Contact us for a free on-site assessment and detailed quote — typically delivered within 48 hours.
                </p>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="py-20 bg-gradient-to-br from-amber-400 to-yellow-500">
            <div className="max-w-3xl mx-auto px-6 text-center">
              <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
                Let's Talk About Your Project
              </h2>
              <p className="text-slate-800 text-xl mb-10 leading-relaxed">
                We work with property managers, business owners, and general contractors across the GTA. Tell us about your project and we'll get you a quote within 48 hours.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="/#contact"
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-10 py-4 rounded-xl text-xl transition-all duration-300 hover:scale-105 shadow-lg"
                >
                  Request a Quote
                </a>
                <a
                  href="tel:+16472507521"
                  className="bg-white/30 hover:bg-white/50 text-slate-900 font-bold px-10 py-4 rounded-xl text-xl transition-all duration-300 border border-slate-900/20"
                >
                  Call Us Now
                </a>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
}
