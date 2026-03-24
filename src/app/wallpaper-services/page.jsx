import Header from "../../components/Header";
import Footer from "../../components/Footer";
import LeadFormPopup from "../../components/LeadFormPopup";
import { useState } from "react";

export const metadata = {
  title: "Wallpaper Services Toronto | Professional Wallpaper Installation & Removal GTA | Arcan Painting",
  description:
    "Expert wallpaper installation and removal in Toronto and the GTA. All wallpaper types: vinyl, fabric, grasscloth, murals. Residential & commercial. Free estimates.",
  keywords:
    "wallpaper installation toronto, wallpaper removal toronto, wallpaper services GTA, wallpaper installer toronto, feature wall wallpaper toronto",
  alternates: { canonical: "https://arcanpainting.ca/wallpaper-services" },
  openGraph: {
    title: "Wallpaper Services Toronto | Arcan Painting",
    description: "Professional wallpaper installation and removal in Toronto and the GTA. All wallpaper types, residential & commercial. Free estimates.",
    url: "https://arcanpainting.ca/wallpaper-services",
    siteName: "Arcan Painting",
    type: "website",
    locale: "en_CA",
    images: [{ url: "https://arcanpainting.ca/og-image.png", width: 1200, height: 630, alt: "Wallpaper Services Toronto" }],
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
      areaServed: ["Toronto", "Mississauga", "Brampton", "Markham", "Vaughan", "Richmond Hill", "Oakville", "Burlington"],
      priceRange: "$$",
    },
    {
      "@type": "Service",
      "@id": "https://arcanpainting.ca/wallpaper-services#service",
      name: "Wallpaper Installation & Removal Toronto",
      serviceType: "Wallpaper Services",
      provider: { "@id": "https://arcanpainting.ca/#business" },
      description: "Professional wallpaper installation and removal for residential and commercial properties in Toronto and the GTA.",
    },
  ],
};

export default function WallpaperServicesPage() {
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
            style={{ background: "linear-gradient(135deg, rgba(15,23,42,0.88) 0%, rgba(15,23,42,0.65) 100%), url(https://images.unsplash.com/photo-1615876234886-fd9a39fda97f?w=1400&q=80) center/cover no-repeat" }}
          >
            <div className="relative z-10 max-w-5xl mx-auto px-6 py-24 text-white">
              <p className="text-amber-400 font-semibold tracking-wide uppercase text-sm mb-4">Greater Toronto Area · Ontario</p>
              <h1 className="text-4xl lg:text-6xl font-extrabold leading-tight mb-6">Wallpaper Services in Toronto, Ontario</h1>
              <p className="text-xl text-slate-200 mb-8 max-w-2xl">High-End Wallpaper Installation — professional installation & removal for every wallpaper type. 1-year installation warranty included.</p>
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
                  <h2 className="text-3xl font-bold text-slate-900 mb-6">Professional Wallpaper Installation & Removal — GTA</h2>
                  <p className="text-slate-600 text-lg leading-relaxed mb-4">
                    Arcan Painting's wallpaper specialists serve Toronto and the Greater Toronto Area with expert installation of all wallpaper types — from classic vinyl and fabric wallcoverings to grasscloth, textured wallpapers, and custom panoramic murals. Whether you're refreshing a single feature wall or wallpapering an entire commercial space, our team delivers flawless results with invisible seams and perfect pattern matching.
                  </p>
                  <p className="text-slate-600 text-lg leading-relaxed mb-8">
                    We also provide professional wallpaper removal using steam and safe chemical methods that protect your walls from damage. Our wall prep service ensures surfaces are perfectly smooth and primed before new wallpaper is installed.
                  </p>
                  <div className="grid sm:grid-cols-2 gap-4 mb-8">
                    {["All wallpaper types: vinyl, fabric, grasscloth, peel-and-stick", "Pattern matching & invisible seam expertise", "Wallpaper removal with zero wall damage", "Wall sizing & surface prep included", "Custom murals & panoramic feature walls", "Residential & commercial wallcovering installation", "1-year installation warranty", "Free wallpaper consultation"].map((f, i) => (
                      <div key={i} className="flex items-start gap-3 bg-slate-50 rounded-xl p-4 border border-slate-100">
                        <span className="text-amber-500 font-bold mt-0.5">✓</span>
                        <span className="text-slate-700 text-sm">{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-amber-50 rounded-2xl p-8 border border-amber-100 h-fit">
                  <h3 className="font-bold text-slate-900 text-xl mb-6">Wallpaper Services</h3>
                  <ul className="space-y-3 mb-8">
                    {["Installation from $12/sq ft", "Removal from $4/sq ft", "All wallpaper types", "Pattern matching expertise", "Free consultation", "1-year warranty"].map((i, k) => (
                      <li key={k} className="flex items-start gap-3 text-slate-700">
                        <span className="text-amber-500 font-bold">✓</span> {i}
                      </li>
                    ))}
                  </ul>
                  <button onClick={() => setIsLeadFormOpen(true)} className="w-full bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold py-3 rounded-xl transition-all">
                    Get Free Quote
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* City links */}
          <section className="py-16 bg-slate-50">
            <div className="max-w-5xl mx-auto px-6">
              <h2 className="text-3xl font-bold text-slate-900 text-center mb-4">Wallpaper Services Across the GTA & Ontario</h2>
              <p className="text-slate-600 text-center mb-10">Find wallpaper installation and removal in your city:</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {["toronto","mississauga","brampton","oakville","burlington","milton","pickering","ajax","whitby","oshawa","newmarket","aurora","richmond-hill","markham","vaughan","king-city","stouffville","georgina","east-gwillimbury","barrie","orillia","innisfil","bradford","alliston","collingwood","wasaga-beach","midland","penetanguishene"].map((city) => (
                  <a key={city} href={`/wallpaper-services/${city}`} className="bg-white hover:bg-amber-50 rounded-xl p-3 text-center border border-slate-200 hover:border-amber-300 transition-all text-sm font-medium text-slate-700 hover:text-amber-700">
                    {city.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                  </a>
                ))}
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="py-20 bg-gradient-to-br from-amber-400 to-yellow-500">
            <div className="max-w-3xl mx-auto px-6 text-center">
              <h2 className="text-4xl font-bold text-slate-900 mb-4">Ready for Beautiful Wallpaper?</h2>
              <p className="text-slate-800 text-xl mb-10">Professional installation in Toronto and the GTA. Free consultation, 1-year warranty.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button onClick={() => setIsLeadFormOpen(true)} className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-10 py-4 rounded-xl text-xl transition-all hover:scale-105">
                  Get Free Estimate
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
