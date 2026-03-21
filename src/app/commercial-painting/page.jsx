import Header from "../../components/Header";
import Footer from "../../components/Footer";

export const metadata = {
  title: "Commercial Painting Toronto | Professional Commercial Painters GTA | Arcan Painting",
  description:
    "Expert commercial painting services in Toronto and the GTA. Office buildings, retail, warehouses & more. Minimal disruption, large crews, premium finishes. Licensed & insured. Free estimates.",
  keywords:
    "commercial painting toronto, commercial painters toronto, office painting toronto, commercial painting GTA, retail painting Toronto, industrial painting Toronto, commercial building painters",
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
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "Can you paint our office without disrupting business operations?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Absolutely. We specialize in minimal-disruption commercial painting in Toronto. We offer evening, overnight, and weekend scheduling so your business operates normally during the project.",
          },
        },
        {
          "@type": "Question",
          name: "What types of commercial properties do you paint?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "We paint offices, retail stores, restaurants, warehouses, condos, schools, healthcare facilities, and new construction across the GTA. No commercial project is too large or too small.",
          },
        },
        {
          "@type": "Question",
          name: "Are you licensed and insured for commercial painting?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. Arcan Painting carries full commercial liability insurance and WSIB coverage. We provide proof of insurance before any work begins.",
          },
        },
        {
          "@type": "Question",
          name: "How quickly can you complete a commercial painting project?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Timeline depends on scope, but we can mobilize large crews to meet tight deadlines. We've completed 10,000+ sq ft projects in a single weekend. Contact us with your timeline and we'll build a plan.",
          },
        },
      ],
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
                <span className="text-amber-400 font-semibold text-sm uppercase tracking-wider">Commercial Painting Toronto</span>
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6">
                Professional Commercial Painting<br />
                <span className="text-amber-400">Services Toronto</span>
              </h1>
              <p className="text-xl lg:text-2xl text-slate-300 max-w-3xl mx-auto leading-relaxed mb-10">
                Keep your business looking its best. Our commercial painting crews in Toronto deliver fast, professional results with minimal disruption to your operations.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="/#contact"
                  className="inline-block bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold px-10 py-4 rounded-xl text-xl transition-all duration-300 hover:scale-105 shadow-lg"
                >
                  Get a Commercial Quote
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

          {/* Industries We Serve */}
          <section className="py-20 bg-white">
            <div className="max-w-5xl mx-auto px-6">
              <h2 className="text-4xl font-bold text-slate-900 text-center mb-4">
                Industries We Serve
              </h2>
              <p className="text-slate-600 text-center text-lg mb-14 max-w-3xl mx-auto">
                From small offices to large commercial properties — our commercial painters in Toronto have completed projects across every industry in the GTA. Whatever your space, we have the experience and equipment to deliver professional results on time and on budget.
              </p>
              <div className="grid md:grid-cols-3 gap-8">
                {[
                  {
                    title: "Office Buildings",
                    desc: "Professional office environments painted during off-hours to avoid disrupting your team. We handle everything from single-floor refreshes to full multi-storey office painting projects across Toronto.",
                  },
                  {
                    title: "Retail Spaces",
                    desc: "Brand-matching colours, feature walls, and high-traffic durable finishes for retail stores, restaurants, and hospitality venues. We work around your business hours so you never lose a day of sales.",
                  },
                  {
                    title: "Warehouses & Industrial",
                    desc: "Heavy-duty coatings, epoxy floor paint, safety markings, and industrial-grade finishes for warehouses, manufacturing facilities, and distribution centres across the GTA.",
                  },
                  {
                    title: "Strata & Condominiums",
                    desc: "Common areas, hallways, lobbies, parkades, and exterior corridors for strata corporations and property management companies. We coordinate with building management to minimize resident disruption.",
                  },
                  {
                    title: "Healthcare & Education",
                    desc: "Low-odour, antimicrobial paint options for hospitals, clinics, schools, and daycares. We understand the strict requirements of these environments and use only certified, safe products.",
                  },
                  {
                    title: "New Construction",
                    desc: "Full painting packages for builders and developers in Toronto — from prime to final coat across every unit, common space, and exterior. We scale our crews to meet your construction timeline.",
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

          {/* Minimal Disruption Approach */}
          <section className="py-20 bg-slate-50">
            <div className="max-w-5xl mx-auto px-6">
              <h2 className="text-4xl font-bold text-slate-900 text-center mb-4">
                Our Minimal Disruption Approach
              </h2>
              <p className="text-slate-600 text-center text-lg mb-14 max-w-3xl mx-auto">
                We understand that downtime costs money. That's why our commercial painting services in Toronto are designed around your business schedule — not ours.
              </p>
              <div className="grid md:grid-cols-2 gap-8">
                {[
                  {
                    title: "Evening & Weekend Scheduling",
                    desc: "We schedule commercial painting work around your business hours. Evenings, overnight shifts, and weekends — your team arrives to freshly painted walls without missing a beat.",
                  },
                  {
                    title: "Phased Project Execution",
                    desc: "For large commercial spaces, we work in phases — section by section — so only a small portion of your facility is affected at any time. Your operations continue while we work.",
                  },
                  {
                    title: "Low-Odour Products",
                    desc: "We use low-VOC and zero-VOC commercial paints that produce minimal odour. This is essential for office painting in Toronto where employees and customers occupy the space during or shortly after painting.",
                  },
                  {
                    title: "Dedicated Project Manager",
                    desc: "Every commercial painting project gets a dedicated project manager. You'll have a single point of contact who coordinates scheduling, manages crews, and keeps you updated on progress.",
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
            </div>
          </section>

          {/* Our Process */}
          <section className="py-20 bg-white">
            <div className="max-w-5xl mx-auto px-6">
              <h2 className="text-4xl font-bold text-slate-900 text-center mb-4">
                Our Commercial Painting Process
              </h2>
              <p className="text-slate-600 text-center text-lg mb-14 max-w-2xl mx-auto">
                A structured, professional approach to every commercial painting project in Toronto and the GTA.
              </p>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { step: "1", title: "Site Assessment", desc: "We visit your property, measure surfaces, assess conditions, and discuss your requirements including colours, finishes, timeline, and access constraints." },
                  { step: "2", title: "Detailed Proposal", desc: "You receive a comprehensive, itemized quote covering all labour, materials, scheduling, and project milestones — typically within 48 hours of our site visit." },
                  { step: "3", title: "Professional Execution", desc: "Our commercial painting crews execute the project on schedule, using commercial-grade products and equipment. We protect all fixtures, furniture, and flooring." },
                  { step: "4", title: "Final Walkthrough", desc: "We conduct a detailed inspection with you, handle any touch-ups, and leave your space immaculate. We don't consider the job done until you're completely satisfied." },
                ].map((item, i) => (
                  <div key={i} className="bg-slate-50 rounded-2xl p-6 border border-slate-100 text-center">
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

          {/* Why Businesses Choose Arcan */}
          <section className="py-20 bg-slate-50">
            <div className="max-w-4xl mx-auto px-6">
              <h2 className="text-4xl font-bold text-slate-900 text-center mb-12">
                Why Businesses Choose Arcan Painting
              </h2>
              <div className="grid md:grid-cols-2 gap-8">
                {[
                  {
                    title: "Large, Experienced Crews",
                    desc: "Need 10,000 sq ft done in a weekend? Our commercial painters in Toronto can mobilize large teams to hit tight deadlines without sacrificing quality.",
                  },
                  {
                    title: "Fully Licensed & WSIB Insured",
                    desc: "We carry full commercial liability insurance and WSIB coverage. You'll receive proof of insurance before any work begins — a requirement for most commercial properties.",
                  },
                  {
                    title: "Commercial-Grade Products",
                    desc: "We use Sherwin-Williams and Benjamin Moore commercial and industrial coatings — formulated for durability in high-traffic environments.",
                  },
                  {
                    title: "Competitive Tendering",
                    desc: "We provide detailed, itemized quotes for RFP processes and work regularly with property managers, general contractors, and facility managers across the GTA.",
                  },
                  {
                    title: "Family-Owned Accountability",
                    desc: "Unlike large painting corporations, every commercial project is overseen by a member of the Cañabate family. You get personal accountability and consistent quality.",
                  },
                  {
                    title: "Serving Toronto Since 1995",
                    desc: "With nearly 30 years of commercial painting experience in Toronto, we've built lasting relationships with businesses, property managers, and general contractors across the GTA.",
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
            </div>
          </section>

          {/* Service Areas */}
          <section className="py-20 bg-white">
            <div className="max-w-5xl mx-auto px-6">
              <h2 className="text-4xl font-bold text-slate-900 text-center mb-4">
                Commercial Painting Service Areas
              </h2>
              <p className="text-slate-600 text-center text-lg mb-12 max-w-2xl mx-auto">
                Our commercial painting services cover the entire Greater Toronto Area.
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

              {/* Pricing note */}
              <div className="mt-16 bg-slate-50 border border-amber-200 rounded-2xl p-8 text-center max-w-2xl mx-auto">
                <h3 className="text-2xl font-bold text-slate-900 mb-3">Commercial Pricing</h3>
                <p className="text-slate-600 text-lg leading-relaxed">
                  Commercial painting projects are priced based on scope, surface area, access requirements, and timeline. Contact us for a free on-site assessment and detailed quote — typically delivered within 48 hours.
                </p>
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section className="py-20 bg-slate-50">
            <div className="max-w-3xl mx-auto px-6">
              <h2 className="text-4xl font-bold text-slate-900 text-center mb-12">
                Commercial Painting FAQ
              </h2>
              <div className="space-y-6">
                {[
                  {
                    q: "Can you paint our office without disrupting business operations?",
                    a: "Absolutely. We specialize in minimal-disruption commercial painting in Toronto. We offer evening, overnight, and weekend scheduling, and can work in phased sections so your business operates normally throughout the project.",
                  },
                  {
                    q: "What types of commercial properties do you paint?",
                    a: "We paint offices, retail stores, restaurants, warehouses, condominiums, schools, healthcare facilities, and new construction across the GTA. No commercial painting project is too large or too small for our team.",
                  },
                  {
                    q: "Are you licensed and insured for commercial painting work?",
                    a: "Yes. Arcan Painting carries full commercial liability insurance and WSIB coverage. We provide proof of insurance before any work begins — meeting the requirements of property managers and general contractors across Toronto.",
                  },
                  {
                    q: "How quickly can you complete a commercial painting project?",
                    a: "Timeline depends on scope, but we can mobilize large crews to meet tight deadlines. We've completed 10,000+ sq ft commercial painting projects in a single weekend. Contact us with your timeline and we'll build a plan that works.",
                  },
                  {
                    q: "Do you provide quotes for RFP and tendering processes?",
                    a: "Yes. We regularly provide detailed, itemized quotes for RFP processes and competitive tendering. We work with property managers, general contractors, and facility managers across the GTA.",
                  },
                  {
                    q: "What commercial painting products do you use?",
                    a: "We use Sherwin-Williams and Benjamin Moore commercial-grade coatings. These include low-VOC options, antimicrobial finishes for healthcare settings, and high-durability coatings for high-traffic commercial environments.",
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
                Let's Talk About Your Project
              </h2>
              <p className="text-slate-800 text-xl mb-10 leading-relaxed">
                We work with property managers, business owners, and general contractors across the GTA. Tell us about your commercial painting project and we'll get you a quote within 48 hours.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="/#contact"
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-10 py-4 rounded-xl text-xl transition-all duration-300 hover:scale-105 shadow-lg"
                >
                  Request a Quote
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
