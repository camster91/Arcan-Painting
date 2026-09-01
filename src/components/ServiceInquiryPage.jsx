import { useState } from "react";
import Footer from "./Footer";
import Header from "./Header";
import LeadFormPopup from "./LeadFormPopup";
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

export default function ServiceInquiryPage({ serviceName }) {
  const [isLeadFormOpen, setIsLeadFormOpen] = useState(false);
  const content = { ...SERVICE_CONTENT[serviceName], faqs: SERVICE_FAQS[serviceName] };
  return <div className="min-h-screen bg-white">
    <Header />
    <main id="main" tabIndex={-1}>
      <section className="bg-slate-900 py-20 lg:py-24 text-white"><div className="max-w-5xl mx-auto px-6">
        <p className="text-amber-400 font-semibold tracking-wide uppercase text-sm mb-4">Arcan Painting service</p>
        <h1 className="text-4xl lg:text-6xl font-extrabold leading-tight mb-6">{serviceName}</h1>
        <p className="text-xl lg:text-2xl text-slate-200 mb-8 max-w-3xl">{content.intro}</p>
        <button onClick={() => setIsLeadFormOpen(true)} className="bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold px-8 py-4 rounded-xl text-lg transition-all">Discuss Your Project</button>
      </div></section>
      <section className="py-16 lg:py-20 bg-white"><div className="max-w-5xl mx-auto px-6 grid gap-12 lg:grid-cols-[1.15fr_.85fr]">
        <div><h2 className="text-3xl font-bold text-slate-900 mb-5">Plan the scope before the next step</h2><p className="text-slate-700 text-lg leading-relaxed">{content.overview}</p><p className="text-slate-700 text-lg leading-relaxed mt-5">The inquiry form is a starting point, not a project quote or booking confirmation. A team member can review what you send and discuss what information or site review may be needed next.</p></div>
        <aside className="bg-slate-50 border border-slate-200 rounded-2xl p-7" aria-labelledby="project-details-heading"><h2 id="project-details-heading" className="text-2xl font-bold text-slate-900 mb-5">Details worth sharing</h2><ul className="space-y-4 text-slate-700">{content.considerations.map((item) => <li key={item} className="flex gap-3"><span aria-hidden="true" className="text-amber-600 font-bold">✓</span><span>{item}</span></li>)}</ul></aside>
      </div></section>
      <section className="py-16 bg-slate-50 border-y border-slate-200"><div className="max-w-4xl mx-auto px-6"><h2 className="text-3xl font-bold text-slate-900 mb-8">Questions about {serviceName.toLowerCase()}</h2><div className="space-y-8">{content.faqs.map(([question, answer]) => <article key={question}><h3 className="text-xl font-bold text-slate-900 mb-2">{question}</h3><p className="text-slate-700 text-lg leading-relaxed">{answer}</p></article>)}</div></div></section>
      <section className="py-16 lg:py-20 bg-amber-400"><div className="max-w-3xl mx-auto px-6 text-center"><h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">Start a project conversation</h2><p className="text-slate-800 text-xl mb-8">Share the scope you know today. The team can review it before confirming next steps.</p><button onClick={() => setIsLeadFormOpen(true)} className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-10 py-4 rounded-xl text-xl transition-all">Contact the Team</button></div></section>
    </main>
    <Footer />
    {isLeadFormOpen && <LeadFormPopup onClose={() => setIsLeadFormOpen(false)} />}
  </div>;
}
