import Header from "../../components/Header";
import Footer from "../../components/Footer";

export const metadata = {
  title: "Exterior Painting Toronto | Professional Exterior Painters GTA | Arcan Painting",
  description:
    "Expert exterior painting services in Toronto and the GTA. Weather-resistant coatings built for Ontario's climate, power washing, 5-year warranty. House painting Toronto since 1995. Free estimates.",
  keywords:
    "exterior painting toronto, exterior painters toronto, house painting toronto, exterior painting GTA, exterior home painting, stucco painting Toronto, brick painting Toronto, professional exterior painters",
  alternates: {
    canonical: "https://arcanpainting.ca/exterior-painting",
  },
  openGraph: {
    title: "Exterior Painting Toronto | Arcan Painting",
    description:
      "Expert exterior painting services in Toronto and the GTA. Weather-resistant coatings, power washing, 5-year warranty. Free estimates.",
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
        "Professional painting contractor serving Toronto and the GTA since 1995. Family-owned across three generations.",
      telephone: "+14167272148",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Toronto",
        addressRegion: "ON",
        addressCountry: "CA",
      },
      areaServed: [
        "Toronto", "Mississauga", "Brampton", "Markham", "Vaughan",
        "Richmond Hill", "Oakville", "Burlington", "Milton", "Pickering", "Ajax", "Whitby",
      ],
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
        "Professional exterior painting services for residential and commercial properties in Toronto and the GTA. Includes power washing, caulking, premium weather-resistant coatings, and 5-year warranty.",
      offers: {
        "@type": "Offer",
        priceSpecification: {
          "@type": "PriceSpecification",
          priceCurrency: "CAD",
          description: "Starting from $2,500 for standard homes; full project quotes available",
        },
      },
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "What is the best time of year for exterior painting in Toronto?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "The ideal season for exterior painting in Toronto is late spring through early fall (May to October) when temperatures are consistently above 10°C and humidity is moderate. We monitor weather forecasts closely to ensure optimal painting conditions.",
          },
        },
        {
          "@type": "Question",
          name: "How long does exterior house painting last in Ontario?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "With proper preparation and premium weather-resistant coatings, an exterior paint job in Ontario typically lasts 7-10 years. All our exterior work is backed by a 5-year workmanship warranty.",
          },
        },
        {
          "@type": "Question",
          name: "Do you offer a warranty on exterior painting?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes, all exterior painting work comes with a 5-year workmanship warranty. If the paint peels, cracks, or fades prematurely due to our application, we will fix it at no charge.",
          },
        },
        {
          "@type": "Question",
          name: "How much does exterior painting cost in Toronto?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Exterior painting in Toronto starts from approximately $2,500 for townhouses and semi-detached homes. Detached homes typically start from $4,000. Pricing depends on home size, surface condition, and accessibility. Contact us for a free quote.",
          },
        },
      ],
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
                <span className="text-amber-400 font-semibold text-sm uppercase tracking-wider">Exterior Painting Toronto</span>
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6">
                Professional Exterior Painting<br />
                <span className="text-amber-400">Services in Toronto & GTA</span>
              </h1>
              <p className="text-xl lg:text-2xl text-slate-300 max-w-3xl mx-auto leading-relaxed mb-10">
                Protect and beautify your home's exterior with weather-resistant coatings built for Ontario's climate. Licensed, insured, and backed by a 5-year warranty.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="/#contact"
                  className="inline-block bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold px-10 py-4 rounded-xl text-xl transition-all duration-300 hover:scale-105 shadow-lg"
                >
                  Get a Free Exterior Quote
                </a>
                <a
                  href="tel:+14167272148"
                  className="inline-block bg-white/10 hover:bg-white/20 text-white font-bold px-10 py-4 rounded-xl text-xl transition-all duration-300 border border-white/30"
                >
                  Call (416) 727-2148
                </a>
              </div>
            </div>
          </section>

          {/* Why Exterior Painting Matters */}
          <section className="py-20 bg-white">
            <div className="max-w-5xl mx-auto px-6">
              <h2 className="text-4xl font-bold text-slate-900 text-center mb-4">
                Why Exterior Painting Matters in Toronto
              </h2>
              <p className="text-slate-600 text-center text-lg mb-14 max-w-3xl mx-auto">
                Toronto's climate is tough on home exteriors. From freezing winters and ice storms to humid summers and UV exposure, your home's exterior paint is the first line of defence against the elements. Quality exterior painting in Toronto isn't just cosmetic — it protects your biggest investment from moisture damage, wood rot, and structural deterioration.
              </p>
              <div className="grid md:grid-cols-3 gap-8">
                {[
                  {
                    title: "Weather Protection",
                    desc: "Ontario weather cycles between extreme cold and heat. Proper exterior painting with weather-resistant coatings creates a barrier against moisture, ice, and UV damage that deteriorates unprotected surfaces.",
                  },
                  {
                    title: "Curb Appeal & Property Value",
                    desc: "A fresh exterior paint job is one of the highest-ROI home improvements. Exterior painting in Toronto can increase your property value by up to 5% while making your home the standout on your street.",
                  },
                  {
                    title: "Prevent Costly Repairs",
                    desc: "Peeling or cracked exterior paint exposes wood, stucco, and siding to water infiltration. Regular house painting in Toronto prevents wood rot, mould growth, and expensive structural repairs.",
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

          {/* Our Process */}
          <section className="py-20 bg-slate-50">
            <div className="max-w-5xl mx-auto px-6">
              <h2 className="text-4xl font-bold text-slate-900 text-center mb-4">
                Our Exterior Painting Process
              </h2>
              <p className="text-slate-600 text-center text-lg mb-14 max-w-2xl mx-auto">
                Our exterior painters in Toronto follow a meticulous process to ensure long-lasting results that withstand Ontario's demanding weather.
              </p>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { step: "1", title: "Inspection & Quote", desc: "We assess your home's exterior condition, identify repairs needed, and provide a detailed written estimate — all free of charge." },
                  { step: "2", title: "Power Washing & Prep", desc: "All surfaces are pressure-washed to remove dirt, mildew, and loose paint. Cracks are filled, wood is repaired, and surfaces are sanded and primed." },
                  { step: "3", title: "Professional Painting", desc: "Two coats of premium weather-resistant paint are applied using the right technique for each surface — brush, roller, or sprayer for optimal coverage." },
                  { step: "4", title: "Final Inspection", desc: "We walk the entire property with you, address any touch-ups, and clean up completely. All work is backed by our 5-year warranty." },
                ].map((item, i) => (
                  <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200 text-center">
                    <div className="w-12 h-12 bg-amber-400 text-slate-900 font-extrabold text-xl rounded-full flex items-center justify-center mx-auto mb-4">
                      {item.step}
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Ontario Weather Considerations */}
          <section className="py-20 bg-white">
            <div className="max-w-5xl mx-auto px-6">
              <h2 className="text-4xl font-bold text-slate-900 text-center mb-4">
                Ontario Weather Considerations for Exterior Painting
              </h2>
              <p className="text-slate-600 text-center text-lg mb-14 max-w-3xl mx-auto">
                Not all exterior painters in Toronto understand the unique challenges of Ontario's climate. At Arcan Painting, we've been navigating Toronto weather since 1995 — here's how we adapt our approach.
              </p>
              <div className="grid md:grid-cols-2 gap-8">
                {[
                  {
                    title: "Freeze-Thaw Cycle Protection",
                    desc: "Ontario's freeze-thaw cycles are brutal on exterior surfaces. We use flexible, breathable coatings that expand and contract with temperature changes, preventing cracking and peeling.",
                  },
                  {
                    title: "Optimal Painting Season",
                    desc: "We schedule exterior painting projects between May and October when temperatures consistently stay above 10°C. This ensures proper paint curing and adhesion for lasting results.",
                  },
                  {
                    title: "Moisture & Humidity Management",
                    desc: "Toronto's humid summers can affect paint adhesion. We monitor humidity levels and dew points, only painting when conditions are ideal to prevent bubbling and poor adhesion.",
                  },
                  {
                    title: "UV-Resistant Coatings",
                    desc: "Southern Ontario receives significant UV exposure in summer. We use UV-resistant exterior paints that maintain colour integrity and resist fading for years.",
                  },
                ].map((item, i) => (
                  <div key={i} className="bg-slate-50 rounded-2xl p-7 border border-slate-100 flex gap-4">
                    <span className="text-amber-400 font-extrabold text-2xl leading-tight">✓</span>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
                      <p className="text-slate-600 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Materials We Use */}
          <section className="py-20 bg-slate-50">
            <div className="max-w-5xl mx-auto px-6">
              <h2 className="text-4xl font-bold text-slate-900 text-center mb-4">
                Premium Materials We Use
              </h2>
              <p className="text-slate-600 text-center text-lg mb-14 max-w-2xl mx-auto">
                We only use top-tier products from Sherwin-Williams and Benjamin Moore — the same brands trusted by professional exterior painters across North America.
              </p>
              <div className="grid md:grid-cols-3 gap-8">
                {[
                  {
                    title: "Siding & Stucco",
                    desc: "We use 100% acrylic latex exterior paints designed for wood siding, stucco, and fibre cement. These coatings resist cracking, peeling, and fading for years in Ontario's climate.",
                  },
                  {
                    title: "Brick & Masonry",
                    desc: "For brick and masonry surfaces, we apply breathable mineral-based coatings that protect against moisture while allowing the substrate to release trapped water vapour.",
                  },
                  {
                    title: "Trim, Soffits & Fascia",
                    desc: "High-gloss and semi-gloss exterior trim paints provide a durable, cleanable finish for soffits, fascia, eaves, window trim, and doors.",
                  },
                  {
                    title: "Decks & Fences",
                    desc: "We use penetrating deck stains and solid-colour coatings that protect wood from UV rays, moisture, and foot traffic while enhancing the natural beauty of the wood grain.",
                  },
                  {
                    title: "Premium Primers",
                    desc: "Every exterior painting project includes proper priming with bonding primers for adhesion, stain-blocking primers for bleed-through, and rust-inhibiting primers for metal surfaces.",
                  },
                  {
                    title: "Caulking & Sealants",
                    desc: "We use premium exterior-grade caulking and sealants at all joints, gaps, and transitions to prevent water infiltration and ensure a clean, professional finish.",
                  },
                ].map((item, i) => (
                  <div key={i} className="bg-white rounded-2xl p-7 border border-slate-200">
                    <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                    <p className="text-slate-600 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Service Areas */}
          <section className="py-20 bg-white">
            <div className="max-w-5xl mx-auto px-6">
              <h2 className="text-4xl font-bold text-slate-900 text-center mb-4">
                Exterior Painting Service Areas Across the GTA
              </h2>
              <p className="text-slate-600 text-center text-lg mb-12 max-w-2xl mx-auto">
                Our exterior painting services extend throughout the Greater Toronto Area. We proudly serve:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
                {[
                  "Toronto", "Mississauga", "Brampton", "Markham", "Vaughan",
                  "Richmond Hill", "Oakville", "Burlington", "Milton", "Pickering", "Ajax", "Whitby",
                ].map((city, i) => (
                  <div key={i} className="bg-slate-50 rounded-xl p-4 text-center border border-slate-200">
                    <span className="text-slate-900 font-semibold">{city}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Pricing */}
          <section className="py-20 bg-slate-50">
            <div className="max-w-4xl mx-auto px-6">
              <h2 className="text-4xl font-bold text-slate-900 text-center mb-4">
                Exterior Painting Pricing in Toronto
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
                    items: ["Full exterior including trim", "Soffit & fascia painted", "Colour consultation", "5-year warranty"],
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

          {/* FAQ */}
          <section className="py-20 bg-white">
            <div className="max-w-3xl mx-auto px-6">
              <h2 className="text-4xl font-bold text-slate-900 text-center mb-12">
                Exterior Painting FAQ
              </h2>
              <div className="space-y-6">
                {[
                  {
                    q: "What is the best time of year for exterior painting in Toronto?",
                    a: "The ideal season for exterior painting in Toronto is late spring through early fall (May to October) when temperatures consistently stay above 10°C and humidity is moderate. We monitor weather forecasts closely to schedule your project during optimal conditions.",
                  },
                  {
                    q: "How long does exterior house painting last in Ontario?",
                    a: "With proper preparation and premium weather-resistant coatings, an exterior paint job in Ontario typically lasts 7-10 years. Factors like sun exposure, proximity to moisture, and surface material can affect longevity. All our exterior work is backed by a 5-year workmanship warranty.",
                  },
                  {
                    q: "Do you paint brick, stucco, and vinyl siding?",
                    a: "Yes. Our exterior painters in Toronto are experienced with all exterior surface types including wood siding, stucco, brick, masonry, vinyl, aluminum, and fibre cement. We use appropriate primers and coatings for each material to ensure optimal adhesion and durability.",
                  },
                  {
                    q: "How much does exterior painting cost in Toronto?",
                    a: "Exterior painting in Toronto starts from approximately $2,500 for townhouses and semi-detached homes, and from $4,000 for detached homes. Pricing depends on home size, surface condition, the number of storeys, and accessibility. Contact us for a free, detailed estimate.",
                  },
                  {
                    q: "Is power washing included in exterior painting?",
                    a: "Yes. Every exterior painting project includes thorough power washing of all surfaces at no extra charge. Power washing removes dirt, mildew, loose paint, and debris — creating a clean surface for optimal paint adhesion.",
                  },
                  {
                    q: "What warranty do you offer on exterior painting?",
                    a: "All exterior painting work comes with a 5-year workmanship warranty. If the paint peels, cracks, or fades prematurely due to our application, we will return and fix it at no cost. This is on top of the manufacturer's paint warranty.",
                  },
                ].map((faq, i) => (
                  <div key={i} className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-900 mb-2">{faq.q}</h3>
                    <p className="text-slate-600 leading-relaxed">{faq.a}</p>
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
                  href="tel:+14167272148"
                  className="bg-white/30 hover:bg-white/50 text-slate-900 font-bold px-10 py-4 rounded-xl text-xl transition-all duration-300 border border-slate-900/20"
                >
                  Call (416) 727-2148
                </a>
              </div>
              <p className="mt-6 text-slate-700">
                <a href="/" className="underline hover:text-slate-900 font-medium">← Back to Home</a>
              </p>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
}
