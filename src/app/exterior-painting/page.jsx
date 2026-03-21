import Header from "../../components/Header";
import Footer from "../../components/Footer";

export const metadata = {
  title: "Exterior Painting Toronto | Professional Exterior Painters GTA | Arcan Painting",
  description:
    "Expert exterior painting services in Toronto and the GTA. Weather-resistant coatings, power washing, caulking & priming included. Residential & commercial. Free estimates. Serving Toronto since 1995.",
  keywords:
    "exterior painting Toronto, exterior painters GTA, house painting exterior Toronto, exterior home painting, stucco painting Toronto, brick painting Toronto, commercial exterior painting, professional exterior painters",
  alternates: {
    canonical: "https://arcanpainting.ca/exterior-painting",
  },
  openGraph: {
    title: "Exterior Painting Toronto | Arcan Painting",
    description:
      "Expert exterior painting services in Toronto and the GTA. Weather-resistant coatings, power washing included. Free estimates.",
    url: "https://arcanpainting.ca/exterior-painting",
    siteName: "Arcan Painting",
    type: "website",
    locale: "en_CA",
    images: [
      {
        url: "https://arcanpainting.ca/og-image.png",
        width: 1200,
        height: 630,
        alt: "Exterior Painting Services Toronto - Arcan Painting",
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
      "@id": "https://arcanpainting.ca/exterior-painting#service",
      name: "Exterior Painting Services Toronto",
      serviceType: "Exterior Painting",
      provider: { "@id": "https://arcanpainting.ca/#business" },
      areaServed: ["Toronto", "GTA", "Ontario"],
      description:
        "Professional exterior painting services for residential and commercial properties in Toronto and the GTA. Includes power washing, caulking, and premium weather-resistant coatings.",
      offers: {
        "@type": "Offer",
        priceSpecification: {
          "@type": "PriceSpecification",
          priceCurrency: "CAD",
          description: "Starting from $2,500 for standard homes; full project quotes available",
        },
      },
    },
  ],
};

export default function ExteriorPaintingPage() {
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
                <span className="text-amber-400 font-semibold text-sm uppercase tracking-wider">Exterior Painting</span>
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6">
                Exterior Painting<br />
                <span className="text-amber-400">Toronto & GTA</span>
              </h1>
              <p className="text-xl lg:text-2xl text-slate-300 max-w-3xl mx-auto leading-relaxed mb-10">
                Protect and beautify your home's exterior with weather-resistant coatings built for Toronto's climate. Licensed, insured, and satisfaction guaranteed.
              </p>
              <a
                href="/#contact"
                className="inline-block bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold px-10 py-4 rounded-xl text-xl transition-all duration-300 hover:scale-105 shadow-lg"
              >
                Get a Free Exterior Quote
              </a>
            </div>
          </section>

          {/* Services Detail */}
          <section className="py-20 bg-white">
            <div className="max-w-5xl mx-auto px-6">
              <h2 className="text-4xl font-bold text-slate-900 text-center mb-4">
                What's Included
              </h2>
              <p className="text-slate-600 text-center text-lg mb-14 max-w-2xl mx-auto">
                A complete exterior paint job — from prep to final coat — weather you right.
              </p>
              <div className="grid md:grid-cols-3 gap-8">
                {[
                  {
                    title: "Power Washing",
                    desc: "All exterior surfaces are thoroughly pressure-washed to remove dirt, mildew, and peeling paint before we apply a single coat.",
                  },
                  {
                    title: "Caulking & Crack Repair",
                    desc: "We seal all gaps, cracks, and joints before painting — preventing water infiltration and ensuring a clean, professional finish.",
                  },
                  {
                    title: "Priming",
                    desc: "Proper priming ensures maximum adhesion and paint longevity. We never skip primer on exterior projects.",
                  },
                  {
                    title: "Siding, Stucco & Brick",
                    desc: "We paint all exterior surfaces — wood siding, stucco, brick, aluminum, vinyl, and more with appropriate coatings for each material.",
                  },
                  {
                    title: "Soffits, Fascia & Trim",
                    desc: "Complete exterior painting includes all trim, soffits, fascia, eaves, doors, and windows for a fully cohesive look.",
                  },
                  {
                    title: "5-Year Warranty",
                    desc: "All exterior work is backed by our 5-year workmanship warranty. If it peels, cracks, or fades prematurely, we'll fix it — free.",
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

          {/* Pricing */}
          <section className="py-20 bg-slate-50">
            <div className="max-w-4xl mx-auto px-6">
              <h2 className="text-4xl font-bold text-slate-900 text-center mb-4">
                Exterior Painting Pricing
              </h2>
              <p className="text-slate-600 text-center text-lg mb-12">
                Transparent pricing based on your home's size and condition. All quotes are free and fully itemized.
              </p>
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  {
                    tier: "Townhouse / Semi",
                    price: "From $2,500",
                    items: ["Power wash included", "Caulking & priming", "2 coats exterior paint", "5-year warranty"],
                  },
                  {
                    tier: "Detached Home",
                    price: "From $4,000",
                    items: ["Full exterior including trim", "Soffit & fascia painted", "Color consultation", "5-year warranty"],
                    highlight: true,
                  },
                  {
                    tier: "Commercial",
                    price: "Custom Quote",
                    items: ["Large crews available", "Off-hours scheduling", "Commercial-grade coatings", "Detailed project plan"],
                  },
                ].map((plan, i) => (
                  <div
                    key={i}
                    className={`rounded-2xl p-8 ${plan.highlight ? "bg-amber-400 text-slate-900 shadow-xl" : "bg-white border border-slate-200"}`}
                  >
                    <h3 className="text-xl font-bold mb-2 text-slate-900">{plan.tier}</h3>
                    <p className={`text-3xl font-extrabold mb-6 ${plan.highlight ? "text-slate-900" : "text-amber-500"}`}>
                      {plan.price}
                    </p>
                    <ul className="space-y-2">
                      {plan.items.map((item, j) => (
                        <li key={j} className={`flex items-start gap-2 text-sm ${plan.highlight ? "text-slate-800" : "text-slate-600"}`}>
                          <span className="text-green-600 font-bold mt-0.5">✓</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="py-20 bg-gradient-to-br from-amber-400 to-yellow-500">
            <div className="max-w-3xl mx-auto px-6 text-center">
              <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
                Protect Your Home This Season
              </h2>
              <p className="text-slate-800 text-xl mb-10 leading-relaxed">
                Toronto weather is tough on exteriors. Get a free quote from our expert exterior painters and protect your investment before the next season hits.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="/#contact"
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-10 py-4 rounded-xl text-xl transition-all duration-300 hover:scale-105 shadow-lg"
                >
                  Get a Free Quote
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
