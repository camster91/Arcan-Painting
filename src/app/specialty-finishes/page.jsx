import Header from "../../components/Header";
import Footer from "../../components/Footer";
import LeadFormPopup from "../../components/LeadFormPopup";
import { useState } from "react";

export const metadata = {
  title: "Specialty Finishes Toronto | Venetian Plaster, Faux Finishes & Decorative Painting GTA | Arcan Painting",
  description:
    "Luxury specialty painting finishes in Toronto and the GTA. Venetian plaster, faux finishes, metallic paints, decorative stenciling. Custom artistry for your home. Free estimates.",
  keywords:
    "specialty finishes toronto, venetian plaster toronto, faux finishes toronto, decorative painting toronto, specialty painting GTA",
  alternates: { canonical: "https://arcanpainting.ca/specialty-finishes" },
  openGraph: {
    title: "Specialty Finishes Toronto | Arcan Painting",
    description: "Luxury specialty painting finishes in Toronto: Venetian plaster, faux finishes, metallic, decorative painting. Free estimates.",
    url: "https://arcanpainting.ca/specialty-finishes",
    siteName: "Arcan Painting",
    type: "website",
    locale: "en_CA",
    images: [{ url: "https://arcanpainting.ca/og-image.png", width: 1200, height: 630, alt: "Specialty Finishes Toronto" }],
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
      telephone: "+14167272148",
      address: { "@type": "PostalAddress", addressLocality: "Toronto", addressRegion: "ON", addressCountry: "CA" },
      areaServed: ["Toronto", "GTA", "Ontario"],
      priceRange: "$$$",
    },
    {
      "@type": "Service",
      "@id": "https://arcanpainting.ca/specialty-finishes#service",
      name: "Specialty Painting Finishes Toronto",
      serviceType: "Specialty Finishes",
      provider: { "@id": "https://arcanpainting.ca/#business" },
      description: "Luxury decorative painting finishes including Venetian plaster, faux finishes, metallic paints, and custom artistry for Toronto and GTA properties.",
    },
  ],
};

export default function SpecialtyFinishesPage() {
  const [isLeadFormOpen, setIsLeadFormOpen] = useState(false);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <div className="min-h-screen bg-white">
        <Header />
        <main>
          {/* Hero */}
          <section
            className="relative min-h-[480px] flex items-center"
            style={{ background: "linear-gradient(135deg, rgba(15,23,42,0.88) 0%, rgba(15,23,42,0.65) 100%), url(https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1400&q=80) center/cover no-repeat" }}
          >
            <div className="relative z-10 max-w-5xl mx-auto px-6 py-24 text-white">
              <p className="text-amber-400 font-semibold tracking-wide uppercase text-sm mb-4">Greater Toronto Area · Ontario</p>
              <h1 className="text-4xl lg:text-6xl font-extrabold leading-tight mb-6">Specialty Finishes in Toronto, Ontario</h1>
              <p className="text-xl text-slate-200 mb-8 max-w-2xl">Custom Artistry — Venetian plaster, faux finishes, metallic paints & decorative painting. Transform your Toronto space with one-of-a-kind finishes.</p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button onClick={() => setIsLeadFormOpen(true)} className="bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold px-8 py-4 rounded-xl text-lg transition-all hover:scale-105 shadow-lg">
                  Get Free Estimate
                </button>
                <a href="tel:+14167272148" className="bg-white/20 hover:bg-white/30 text-white font-bold px-8 py-4 rounded-xl text-lg border border-white/30">
                  Call (416) 727-2148
                </a>
              </div>
            </div>
          </section>

          {/* Content */}
          <section className="py-16 bg-white">
            <div className="max-w-5xl mx-auto px-6">
              <div className="grid lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2">
                  <h2 className="text-3xl font-bold text-slate-900 mb-6">Luxury Decorative Painting Finishes — Toronto & GTA</h2>
                  <p className="text-slate-600 text-lg leading-relaxed mb-4">
                    Arcan Painting's decorative artisans bring Old World techniques and contemporary design sensibility to Toronto and GTA homes and businesses. Our specialty finishes team creates bespoke walls, ceilings, and surfaces that standard painting simply cannot achieve — from authentic Italian Venetian plaster applied in multiple hand-burnished layers to custom metallic, faux stone, and limewash finishes that add depth, texture, and character to any space.
                  </p>
                  <p className="text-slate-600 text-lg leading-relaxed mb-8">
                    Whether you're designing a luxury condo in Yorkville, a feature wall in an Aurora executive home, or a statement lobby in a Mississauga commercial building, our artisans deliver one-of-a-kind results backed by decades of experience.
                  </p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {["Venetian plaster (authentic multi-layer technique)", "Limewash & mineral wash finishes", "Faux wood, stone, marble & brick effects", "Metallic, gold, silver & copper finishes", "Decorative stenciling & pattern painting", "Ombre, colour-wash & glazing effects", "Textured paint finishes", "1-year artisan warranty on all specialty work"].map((f, i) => (
                      <div key={i} className="flex items-start gap-3 bg-slate-50 rounded-xl p-4 border border-slate-100">
                        <span className="text-amber-500 font-bold mt-0.5">✓</span>
                        <span className="text-slate-700 text-sm">{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-amber-50 rounded-2xl p-8 border border-amber-100 h-fit">
                  <h3 className="font-bold text-slate-900 text-xl mb-6">Specialty Finishes</h3>
                  <ul className="space-y-3 mb-8">
                    {["From $8/sq ft", "Venetian plaster specialists", "Custom colour matching", "Commercial & residential", "Free design consultation", "1-year artisan warranty"].map((i, k) => (
                      <li key={k} className="flex items-start gap-3 text-slate-700">
                        <span className="text-amber-500 font-bold">✓</span> {i}
                      </li>
                    ))}
                  </ul>
                  <button onClick={() => setIsLeadFormOpen(true)} className="w-full bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold py-3 rounded-xl transition-all">
                    Get Free Consultation
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* City links */}
          <section className="py-16 bg-slate-50">
            <div className="max-w-5xl mx-auto px-6">
              <h2 className="text-3xl font-bold text-slate-900 text-center mb-4">Specialty Finishes Across Ontario</h2>
              <p className="text-slate-600 text-center mb-10">Find specialty decorative painting in your city:</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {["toronto","mississauga","brampton","oakville","burlington","milton","pickering","ajax","whitby","oshawa","newmarket","aurora","richmond-hill","markham","vaughan","king-city","stouffville","georgina","east-gwillimbury","barrie","orillia","innisfil","bradford","alliston","collingwood","wasaga-beach","midland","penetanguishene"].map((city) => (
                  <a key={city} href={`/specialty-finishes/${city}`} className="bg-white hover:bg-amber-50 rounded-xl p-3 text-center border border-slate-200 hover:border-amber-300 transition-all text-sm font-medium text-slate-700 hover:text-amber-700">
                    {city.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                  </a>
                ))}
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="py-20 bg-gradient-to-br from-amber-400 to-yellow-500">
            <div className="max-w-3xl mx-auto px-6 text-center">
              <h2 className="text-4xl font-bold text-slate-900 mb-4">Commission Your Custom Finish</h2>
              <p className="text-slate-800 text-xl mb-10">Serving Toronto and the GTA since 1995. Free design consultation for all specialty finish projects.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button onClick={() => setIsLeadFormOpen(true)} className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-10 py-4 rounded-xl text-xl transition-all hover:scale-105">
                  Get Free Consultation
                </button>
                <a href="tel:+14167272148" className="bg-white/30 hover:bg-white/50 text-slate-900 font-bold px-10 py-4 rounded-xl text-xl border border-slate-900/20">
                  Call (416) 727-2148
                </a>
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </div>
      {isLeadFormOpen && <LeadFormPopup onClose={() => setIsLeadFormOpen(false)} />}
    </>
  );
}
