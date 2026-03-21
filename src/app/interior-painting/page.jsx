import Header from "../../components/Header";
import Footer from "../../components/Footer";

export const metadata = {
  title: "Interior Painting Toronto | Professional Interior Painters GTA | Arcan Painting",
  description:
    "Expert interior painting services in Toronto and the GTA. Premium paints, flawless finishes, minimal disruption. Residential & commercial interior painters. Free estimates. Serving Toronto since 1995.",
  keywords:
    "interior painting Toronto, interior painters GTA, house painting Toronto, room painting Toronto, interior wall painting, professional interior painters, Toronto interior painting services",
  alternates: {
    canonical: "https://arcanpainting.ca/interior-painting",
  },
  openGraph: {
    title: "Interior Painting Toronto | Arcan Painting",
    description:
      "Expert interior painting services in Toronto and the GTA. Premium paints, flawless finishes, minimal disruption. Free estimates.",
    url: "https://arcanpainting.ca/interior-painting",
    siteName: "Arcan Painting",
    type: "website",
    locale: "en_CA",
    images: [
      {
        url: "https://arcanpainting.ca/og-image.png",
        width: 1200,
        height: 630,
        alt: "Interior Painting Services Toronto - Arcan Painting",
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
      telephone: "",
      email: "info@arcanpainting.ca",
      priceRange: "$$",
      openingHours: "Mo-Fr 07:00-18:00, Sa 08:00-16:00",
    },
    {
      "@type": "Service",
      "@id": "https://arcanpainting.ca/interior-painting#service",
      name: "Interior Painting Services Toronto",
      serviceType: "Interior Painting",
      provider: { "@id": "https://arcanpainting.ca/#business" },
      areaServed: ["Toronto", "GTA", "Ontario"],
      description:
        "Professional interior painting services for residential and commercial properties in Toronto and the GTA. We use premium low-VOC paints for beautiful, long-lasting results.",
      offers: {
        "@type": "Offer",
        priceSpecification: {
          "@type": "PriceSpecification",
          priceCurrency: "CAD",
          description: "Starting from $350 per room; full home quotes available",
        },
      },
    },
  ],
};

export default function InteriorPaintingPage() {
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
                <span className="text-amber-400 font-semibold text-sm uppercase tracking-wider">Interior Painting</span>
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6">
                Interior Painting<br />
                <span className="text-amber-400">Toronto & GTA</span>
              </h1>
              <p className="text-xl lg:text-2xl text-slate-300 max-w-3xl mx-auto leading-relaxed mb-10">
                Transform every room with flawless finishes and premium paints. Family-owned, fully licensed, and trusted by Toronto homeowners since 1995.
              </p>
              <a
                href="/#contact"
                className="inline-block bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold px-10 py-4 rounded-xl text-xl transition-all duration-300 hover:scale-105 shadow-lg"
              >
                Get a Free Interior Quote
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
                Every interior painting project is handled with care — from prep to final coat.
              </p>
              <div className="grid md:grid-cols-3 gap-8">
                {[
                  {
                    title: "Wall & Ceiling Painting",
                    desc: "Full rooms, single accent walls, ceilings — any finish from matte to semi-gloss. We prepare all surfaces before painting.",
                  },
                  {
                    title: "Trim, Doors & Baseboards",
                    desc: "Crisp, clean lines on all trim, doors, crown moulding, and baseboards. We tape precisely and clean up thoroughly.",
                  },
                  {
                    title: "Color Consultation",
                    desc: "Not sure what color? We offer complimentary color consultation and can apply sample patches before committing.",
                  },
                  {
                    title: "Cabinet Painting",
                    desc: "Refresh kitchen or bathroom cabinets with a smooth, durable factory-style finish — fraction of the cost of replacement.",
                  },
                  {
                    title: "Feature Walls & Texture",
                    desc: "Accent walls, faux finishes, and textured effects to give any room a unique character.",
                  },
                  {
                    title: "Low-VOC Paints",
                    desc: "We exclusively use premium Sherwin-Williams and Benjamin Moore low-VOC paints — safe for your family and pets.",
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
                Interior Painting Pricing
              </h2>
              <p className="text-slate-600 text-center text-lg mb-12">
                Transparent pricing with no hidden fees. All quotes are free and include a detailed written breakdown.
              </p>
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  {
                    tier: "Single Room",
                    price: "From $350",
                    items: ["Surface prep & priming", "2 coats premium paint", "Trim & ceiling included", "Same-day cleanup"],
                  },
                  {
                    tier: "Full Home Interior",
                    price: "Custom Quote",
                    items: ["All rooms & hallways", "Volume discount applied", "Color consultation included", "2-year workmanship warranty"],
                    highlight: true,
                  },
                  {
                    tier: "Commercial Interior",
                    price: "Custom Quote",
                    items: ["Off-hours available", "Large-scale crews", "Low-odour paints", "Project management included"],
                  },
                ].map((plan, i) => (
                  <div
                    key={i}
                    className={`rounded-2xl p-8 ${plan.highlight ? "bg-amber-400 text-slate-900 shadow-xl" : "bg-white border border-slate-200"}`}
                  >
                    <h3 className={`text-xl font-bold mb-2 ${plan.highlight ? "text-slate-900" : "text-slate-900"}`}>
                      {plan.tier}
                    </h3>
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
                Ready to Refresh Your Interior?
              </h2>
              <p className="text-slate-800 text-xl mb-10 leading-relaxed">
                Get a free, no-obligation quote from Toronto's trusted interior painting experts. We'll assess your space and provide a detailed estimate within 24 hours.
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
