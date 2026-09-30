import { useState } from "react";
import Footer from "./Footer";
import Header from "./Header";
import LeadFormPopup from "./LeadFormPopup";
import { ArrowRight, Phone } from "lucide-react";
import ContactSection from "./ContactSection";
import FinishLinks from "./FinishLinks";
import { PHOTOS, photoSrc, photoSrcSet } from "@/data/photos";
import { SERVICE_FAQS } from "@/utils/publicSeo";

const SERVICE_CONTENT = {
  "Interior Painting": {
    intro: "Plan an interior painting project around the rooms, surfaces, finishes, access, and timing that matter to you.",
    overview: "An interior project starts with a clear picture of the existing surfaces and the result you want. Include the rooms involved, approximate dimensions, current colours, preferred colours or references, and any visible damage or repairs you want reviewed.",
    considerations: ["Walls, ceilings, trim, doors, cabinetry, or other surfaces", "Furniture access, occupied rooms, and preferred work sequence", "Existing coatings, stains, cracks, peeling, or water marks", "Colour references, sheen preferences, and target timing"],
  },
  "Exterior Painting": {
    intro: "Plan an exterior painting project with the building surfaces, current condition, access, materials, and weather exposure in view.",
    overview: "Exterior scope depends on what is being coated and what condition it is in. Photos of each elevation and close-ups of peeling, cracking, staining, gaps, or damaged areas help identify what needs an in-person review.",
    considerations: ["Siding, trim, doors, railings, decks, fences, or other surfaces", "Surface material and any known previous coating", "Height, landscaping, neighbouring property, and access constraints", "Visible deterioration, moisture concerns, and preferred timing"],
  },
  "Commercial Painting": {
    intro: "Discuss a commercial painting project with its operating requirements, access, surfaces, sequencing, and decision process clearly defined.",
    overview: "Commercial inquiries are easier to review when the site type, areas involved, operating hours, access rules, desired sequence, and target dates are included. Note whether drawings, specifications, building contacts, or site procedures are available.",
    considerations: ["Site type, occupied areas, public access, and operating hours", "Drawings, finish schedules, specifications, or brand colour references", "Phasing, floor or room sequence, and target completion window", "Site access, parking, loading, security, and contact requirements"],
  },
  "Wallpaper Services": {
    intro: "Plan wallpaper installation or removal by documenting the wall condition, material, dimensions, pattern, access, and desired timing.",
    overview: "Wallpaper scope varies with the wall surface and the product being removed or installed. Share the manufacturer and pattern details when available, plus room dimensions and photos of corners, openings, and any surface damage.",
    considerations: ["Installation, removal, or both", "Wall dimensions, ceiling height, openings, corners, and obstacles", "Wallpaper manufacturer, pattern, roll dimensions, and repeat", "Existing wall covering, wall condition, repairs, and access"],
  },
  "Specialty Finishes": {
    intro: "Discuss a specialty-finish idea using visual references, sample expectations, surfaces, room conditions, and the intended effect.",
    overview: "Specialty finishes are best defined visually. Include reference images, colours, texture preferences, sheen, the surfaces involved, and the viewing conditions. A sample or test area may be useful to align on appearance before a larger scope is confirmed.",
    considerations: ["Reference images and the visual qualities you want to reproduce", "Surface type, dimensions, condition, and existing coating", "Colour, texture, sheen, lighting, and viewing distance", "Sample expectations, adjacent finishes, and project timing"],
  },
};

// Real project photos for each service hero.
const SERVICE_PHOTOS = {
  "Interior Painting": PHOTOS.blueAccent,
  "Exterior Painting": PHOTOS.blackWindow,
  "Commercial Painting": PHOTOS.wineBar,
  "Wallpaper Services": PHOTOS.muralInstall,
  "Specialty Finishes": PHOTOS.rugRoom,
};

export default function ServiceInquiryPage({ serviceName }) {
  const [isLeadFormOpen, setIsLeadFormOpen] = useState(false);
  const content = { ...SERVICE_CONTENT[serviceName], faqs: SERVICE_FAQS[serviceName] };
  const photo = SERVICE_PHOTOS[serviceName];
  return <div className="min-h-screen bg-paper text-ink">
    <Header />
    <main id="main" tabIndex={-1}>
      <section className="texture-plaster bg-ink text-paper">
        <div className="mx-auto grid max-w-[1440px] gap-12 px-4 pb-20 pt-12 sm:px-6 md:px-10 lg:grid-cols-12 lg:gap-12 lg:pb-28 lg:pt-20">
          <div className="flex flex-col justify-center lg:col-span-6">
            <p className="eyebrow-light mb-6">Arcan Painting service</p>
            <h1 className="display-h1">{serviceName}</h1>
            <p className="mt-7 max-w-lg text-lg leading-relaxed text-paper/80">{content.intro}</p>
            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4">
              <button type="button" className="btn-brand" onClick={() => setIsLeadFormOpen(true)}>Discuss your project <ArrowRight size={16} aria-hidden="true" /></button>
              <a href="tel:+14167272148" className="link-underline text-paper"><Phone size={15} aria-hidden="true" /> (416) 727-2148</a>
            </div>
          </div>
          <figure className="lg:col-span-6">
            <div className="frame-brass mx-auto max-w-[520px] pr-3.5">
              <img src={photoSrc(photo, 1400)} srcSet={photoSrcSet(photo)} sizes="(min-width: 1024px) 40vw, 100vw" alt={photo.alt} width="1400" height="1750" loading="eager" fetchpriority="high" decoding="async" className="arch aspect-[4/5] w-full object-cover" />
            </div>
          </figure>
        </div>
      </section>
      <section className="mx-auto grid max-w-[1440px] gap-12 px-4 py-20 sm:px-6 md:px-10 lg:grid-cols-[1.15fr_.85fr] lg:py-24">
        <div>
          <h2 className="display-h2">Plan the scope before the next step</h2>
          <p className="mt-6 text-lg leading-relaxed text-ink-soft">{content.overview}</p>
          <p className="mt-5 text-lg leading-relaxed text-ink-soft">The inquiry form is a starting point, not a project quote or booking confirmation. A team member can review what you send and discuss what information or site review may be needed next.</p>
        </div>
        <aside className="border border-line bg-paper-deep p-8" aria-labelledby="project-details-heading">
          <h2 id="project-details-heading" className="font-display text-3xl">Details worth sharing</h2>
          <ul className="mt-6 space-y-4 text-ink-soft">{content.considerations.map((item) => <li key={item} className="border-l-2 border-brand pl-4">{item}</li>)}</ul>
        </aside>
      </section>
      <section className="border-y border-line bg-paper-deep"><div className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:py-24">
        <h2 className="display-h2">Questions about {serviceName.toLowerCase()}</h2>
        <div className="mt-10 divide-y divide-line border-y border-line">{content.faqs.map(([question, answer]) => <article key={question} className="py-7"><h3 className="font-display text-2xl">{question}</h3><p className="mt-3 text-lg leading-relaxed text-ink-soft">{answer}</p></article>)}</div>
      </div></section>
      <FinishLinks title="Looking for a finish with more depth?" />
      <ContactSection />
    </main>
    <Footer />
    {isLeadFormOpen && <LeadFormPopup onClose={() => setIsLeadFormOpen(false)} />}
  </div>;
}
