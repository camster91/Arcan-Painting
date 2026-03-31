import Header from "../../components/Header";
import Footer from "../../components/Footer";

export const metadata = {
  title: "Create a Home You Love | Beautiful Interior Painting Toronto | Arcan Painting",
  description:
    "Transform your Toronto home into a space you love. Beautiful painting for comfortable living, happy families, and homes that feel like home. Family-owned since 1995. Free design consultation.",
  keywords:
    "home painting toronto, beautiful homes toronto, comfortable living spaces, happy family home, interior design painting, home transformation toronto, dream home painting, emotional home design",
  alternates: {
    canonical: "https://arcanpainting.ca/interior-painting",
  },
  openGraph: {
    title: "Create a Home You Love | Arcan Painting Toronto",
    description:
      "Beautiful spaces for beautiful moments. Transform your Toronto home into a space you love with our family-owned painting services since 1995.",
    url: "https://arcanpainting.ca/interior-painting",
    siteName: "Arcan Painting",
    type: "website",
    locale: "en_CA",
    images: [
      {
        url: "https://arcanpainting.ca/og-image.png",
        width: 1200,
        height: 630,
        alt: "Beautiful Home Transformation Toronto - Arcan Painting",
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
      "@id": "https://arcanpainting.ca/interior-painting#service",
      name: "Interior Painting Services Toronto",
      serviceType: "Interior Painting",
      provider: { "@id": "https://arcanpainting.ca/#business" },
      areaServed: ["Toronto", "GTA", "Ontario"],
      description:
        "Professional interior painting services for residential and commercial properties in Toronto and the GTA. Premium low-VOC paints, 2-year workmanship warranty, and free estimates.",
      offers: {
        "@type": "Offer",
        priceSpecification: {
          "@type": "PriceSpecification",
          priceCurrency: "CAD",
          description: "Starting from $350 per room; full home quotes available",
        },
      },
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "How long does interior painting take in Toronto?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "A single room typically takes 1 day, while a full home interior takes 3-5 days depending on size and prep work needed. We work efficiently to minimize disruption.",
          },
        },
        {
          "@type": "Question",
          name: "What paints do you use for interior painting?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "We exclusively use premium Sherwin-Williams and Benjamin Moore low-VOC paints. These are safe for families and pets while delivering beautiful, long-lasting finishes.",
          },
        },
        {
          "@type": "Question",
          name: "Do you offer a warranty on interior painting?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes, all interior painting work comes with a 2-year workmanship warranty. If any peeling, bubbling, or defects occur due to our work, we will fix it at no cost.",
          },
        },
        {
          "@type": "Question",
          name: "What areas do you serve for interior painting?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "We serve the entire Greater Toronto Area including Toronto, Mississauga, Brampton, Markham, Vaughan, Richmond Hill, Oakville, Burlington, Milton, Pickering, Ajax, and Whitby.",
          },
        },
      ],
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
                <span className="text-amber-400 font-semibold text-sm uppercase tracking-wider">Create the Home You Love</span>
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6">
                Beautiful Spaces for<br />
                <span className="text-amber-400">Beautiful Moments</span>
              </h1>
              <p className="text-xl lg:text-2xl text-slate-300 max-w-3xl mx-auto leading-relaxed mb-10">
                Transform your Toronto home into a space you love. Comfortable living, happy families, and homes that feel like home. Family-owned since 1995.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="/#contact"
                  className="inline-block bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold px-10 py-4 rounded-xl text-xl transition-all duration-300 hover:scale-105 shadow-lg"
                >
                  Start Creating Your Dream Home
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

          {/* Why Choose Arcan */}
          <section className="py-20 bg-white">
            <div className="max-w-5xl mx-auto px-6">
              <h2 className="text-4xl font-bold text-slate-900 text-center mb-4">
                Create a Home You Love Coming Home To
              </h2>
              <p className="text-slate-600 text-center text-lg mb-14 max-w-3xl mx-auto">
                Your home should be your favorite place. A space for comfort, happiness, and beautiful moments. For three generations, our family has helped Toronto families create homes they love — where every room feels just right.
              </p>
              <div className="grid md:grid-cols-3 gap-8">
                {[
                  {
                    title: "Homes You Love",
                    desc: "Transform your space into somewhere you can't wait to come home to. Beautiful painting creates the perfect backdrop for family gatherings, quiet evenings, and daily life.",
                  },
                  {
                    title: "Comfort & Safety First",
                    desc: "We use premium low-VOC paints that are safe for your family and pets. Create a healthy, beautiful home where everyone can breathe easy and feel comfortable.",
                  },
                  {
                    title: "Peace of Mind Guarantee",
                    desc: "Every project is backed by our 2-year warranty. If any issues appear due to our work, we'll fix it — completely free. Your happiness is our priority.",
                  },
                  {
                    title: "Family Care for Your Family",
                    desc: "Family-owned since 1995, we treat your home with the same care we'd treat our own. Three generations of the Cañabate family ensuring your home feels just right.",
                  },
                  {
                    title: "Attention to Every Detail",
                    desc: "From wainscotting to accent walls, every detail matters. We prepare surfaces meticulously because beautiful spaces start with proper preparation.",
                  },
                  {
                    title: "Your Vision, Realized",
                    desc: "We listen to create spaces that reflect your style and bring you joy. Start with a free design consultation to bring your dream home to life.",
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

          {/* Our Interior Painting Process */}
          <section className="py-20 bg-slate-50">
            <div className="max-w-5xl mx-auto px-6">
              <h2 className="text-4xl font-bold text-slate-900 text-center mb-4">
                Our Interior Painting Process
              </h2>
              <p className="text-slate-600 text-center text-lg mb-14 max-w-2xl mx-auto">
                From initial consultation to final walkthrough, our interior painters in Toronto follow a proven process for flawless results every time.
              </p>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { step: "1", title: "Free Consultation", desc: "We visit your Toronto home, assess surfaces, discuss colour preferences, and provide a detailed written estimate — all at no cost." },
                  { step: "2", title: "Surface Preparation", desc: "Furniture is covered, floors are protected, and all surfaces are cleaned, sanded, patched, and primed. Proper prep ensures paint adhesion and a smooth finish." },
                  { step: "3", title: "Professional Application", desc: "We apply two coats of premium paint using brushes, rollers, and sprayers as appropriate. Trim, ceilings, and baseboards are cut in with precision." },
                  { step: "4", title: "Final Walkthrough", desc: "We do a thorough inspection with you, address any touch-ups, and leave your space spotless. All work is backed by our 2-year warranty." },
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

          {/* Types of Interior Painting */}
          <section className="py-20 bg-white">
            <div className="max-w-5xl mx-auto px-6">
              <h2 className="text-4xl font-bold text-slate-900 text-center mb-4">
                Types of Interior Painting We Offer
              </h2>
              <p className="text-slate-600 text-center text-lg mb-14 max-w-2xl mx-auto">
                Whether you need a single accent wall or a complete home repaint, our interior painting services in Toronto cover every need.
              </p>
              <div className="grid md:grid-cols-3 gap-8">
                {[
                  {
                    title: "Wall & Ceiling Painting",
                    desc: "Full rooms, hallways, and ceilings in any finish from matte to semi-gloss. We prepare all surfaces before painting and apply two coats for even, lasting coverage.",
                  },
                  {
                    title: "Trim, Doors & Baseboards",
                    desc: "Crisp, clean lines on all trim work including doors, crown moulding, baseboards, and window frames. We tape precisely and use premium trim paint for a durable finish.",
                  },
                  {
                    title: "Cabinet Painting & Refinishing",
                    desc: "Refresh kitchen or bathroom cabinets with a smooth, durable factory-style finish. A fraction of the cost of replacement, with transformative results.",
                  },
                  {
                    title: "Colour Consultation",
                    desc: "Not sure what colour to choose? Our interior painters in Toronto offer complimentary colour consultation. We can apply sample patches before you commit to help you find the perfect shade.",
                  },
                  {
                    title: "Feature Walls & Accent Walls",
                    desc: "Make a statement with bold accent walls, faux finishes, or textured effects. Our team creates feature walls that add character and visual interest to any room.",
                  },
                  {
                    title: "Specialty Finishes",
                    desc: "From Venetian plaster to limewash and faux textures, we offer specialty interior finishes that bring unique depth and sophistication to your Toronto home.",
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

          {/* Service Areas */}
          <section className="py-20 bg-slate-50">
            <div className="max-w-5xl mx-auto px-6">
              <h2 className="text-4xl font-bold text-slate-900 text-center mb-4">
                Interior Painting Service Areas Across the GTA
              </h2>
              <p className="text-slate-600 text-center text-lg mb-12 max-w-2xl mx-auto">
                Our interior painting services extend throughout the Greater Toronto Area. We proudly serve homeowners and businesses in:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
                {[
                  "Toronto", "Mississauga", "Brampton", "Markham", "Vaughan",
                  "Richmond Hill", "Oakville", "Burlington", "Milton", "Pickering", "Ajax", "Whitby",
                ].map((city, i) => (
                  <div key={i} className="bg-white rounded-xl p-4 text-center border border-slate-200">
                    <span className="text-slate-900 font-semibold">{city}</span>
                  </div>
                ))}
              </div>
              <p className="text-slate-500 text-center mt-8 text-sm">
                Don't see your city? Contact us — we likely serve your area too. We provide interior painting across the GTA and beyond.
              </p>
            </div>
          </section>

          {/* Pricing */}
          <section className="py-20 bg-white">
            <div className="max-w-4xl mx-auto px-6">
              <h2 className="text-4xl font-bold text-slate-900 text-center mb-4">
                Interior Painting Pricing in Toronto
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
                    items: ["All rooms & hallways", "Volume discount applied", "Colour consultation included", "2-year workmanship warranty"],
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
                    className={`rounded-2xl p-8 ${plan.highlight ? "bg-amber-400 text-slate-900 shadow-xl" : "bg-slate-50 border border-slate-200"}`}
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
          <section className="py-20 bg-slate-50">
            <div className="max-w-3xl mx-auto px-6">
              <h2 className="text-4xl font-bold text-slate-900 text-center mb-12">
                Interior Painting FAQ
              </h2>
              <div className="space-y-6">
                {[
                  {
                    q: "How long does interior painting take in Toronto?",
                    a: "A single room typically takes 1 day, while a full home interior takes 3-5 days depending on size, the number of rooms, and the amount of prep work needed. We work efficiently to minimize disruption to your daily routine.",
                  },
                  {
                    q: "What paints do you use for residential interior painting?",
                    a: "We exclusively use premium Sherwin-Williams and Benjamin Moore low-VOC paints. These paints are safe for families and pets, produce minimal odour, and deliver beautiful, long-lasting finishes with excellent coverage.",
                  },
                  {
                    q: "Do you offer a warranty on interior painting work?",
                    a: "Yes. All interior painting work comes with a 2-year workmanship warranty. If any peeling, bubbling, or defects appear due to our application, we will return and fix it at no cost to you.",
                  },
                  {
                    q: "How much does interior painting cost in Toronto?",
                    a: "Interior painting in Toronto starts from approximately $350 for a single room, which includes surface prep, priming, two coats of premium paint, and trim. Full home interior projects are quoted based on the number of rooms, ceiling heights, and condition of surfaces. Contact us for a free estimate.",
                  },
                  {
                    q: "Do I need to move furniture before interior painting?",
                    a: "No. Our interior painters handle all furniture moving and protection. We cover floors, furniture, and fixtures with drop cloths and plastic sheeting. Everything is returned to its original position after painting.",
                  },
                  {
                    q: "What areas in the GTA do you serve for interior painting?",
                    a: "We serve the entire Greater Toronto Area including Toronto, Mississauga, Brampton, Markham, Vaughan, Richmond Hill, Oakville, Burlington, Milton, Pickering, Ajax, and Whitby. Contact us if you're outside these areas — we may still be able to help.",
                  },
                ].map((faq, i) => (
                  <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200">
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
