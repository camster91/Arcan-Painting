import { isRouteErrorResponse, useParams, useRouteError } from "react-router";
import { useState } from "react";
import Footer from "../../../components/Footer";
import Header from "../../../components/Header";
import LeadFormPopup from "../../../components/LeadFormPopup";

// These routes are retained for existing links, but are noindexed and excluded
// from the sitemap until the client verifies service coverage and local content.
export const SERVICES = {
  "interior-painting": { name: "Interior Painting" },
  "exterior-painting": { name: "Exterior Painting" },
  "commercial-painting": { name: "Commercial Painting" },
  "wallpaper-services": { name: "Wallpaper Services" },
  "specialty-finishes": { name: "Specialty Finishes" },
};

export const SERVICE_SLUGS = Object.fromEntries(
  Object.keys(SERVICES).map((slug) => [slug, slug]),
);

export const CITIES = {
  toronto: { name: "Toronto" },
  mississauga: { name: "Mississauga" },
  brampton: { name: "Brampton" },
  oakville: { name: "Oakville" },
  burlington: { name: "Burlington" },
  milton: { name: "Milton" },
  pickering: { name: "Pickering" },
  ajax: { name: "Ajax" },
  whitby: { name: "Whitby" },
  oshawa: { name: "Oshawa" },
  newmarket: { name: "Newmarket" },
  aurora: { name: "Aurora" },
  "richmond-hill": { name: "Richmond Hill" },
  markham: { name: "Markham" },
  vaughan: { name: "Vaughan" },
  "king-city": { name: "King City" },
  stouffville: { name: "Stouffville" },
  georgina: { name: "Georgina" },
  "east-gwillimbury": { name: "East Gwillimbury" },
  barrie: { name: "Barrie" },
  orillia: { name: "Orillia" },
  innisfil: { name: "Innisfil" },
  bradford: { name: "Bradford" },
  alliston: { name: "Alliston" },
  collingwood: { name: "Collingwood" },
  "wasaga-beach": { name: "Wasaga Beach" },
  midland: { name: "Midland" },
  penetanguishene: { name: "Penetanguishene" },
};

export const CITY_SLUGS = Object.keys(CITIES);

export function loader({ params }) {
  if (!SERVICES[params.service] || !CITIES[params.city]) {
    throw new Response("Not Found", { status: 404 });
  }
  return null;
}

export function meta({ params }) {
  const service = SERVICES[params.service];
  if (!service || !CITIES[params.city]) {
    return [
      { title: "Page Not Found | Arcan Painting" },
      { name: "robots", content: "noindex, nofollow" },
    ];
  }

  const title = `${service.name} Project Inquiry | Arcan Painting`;
  const description = `Tell Arcan Painting about your ${service.name.toLowerCase()} project and a team member can review the details with you.`;
  const url = `https://arcanpainting.ca/${params.service}/${params.city}`;

  return [
    { title },
    { name: "description", content: description },
    { name: "robots", content: "noindex, follow" },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:url", content: url },
    { property: "og:type", content: "website" },
    { property: "og:site_name", content: "Arcan Painting" },
    { tagName: "link", rel: "canonical", href: url },
  ];
}

export function ErrorBoundary() {
  const error = useRouteError();
  if (isRouteErrorResponse(error) && error.status === 404) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 text-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-amber-700">404</p>
          <h1 className="mt-2 text-4xl font-bold text-slate-900">Page Not Found</h1>
          <p className="mt-4 text-slate-600">The project page you requested is not available.</p>
          <a href="/" className="mt-6 inline-block rounded-full bg-amber-500 px-6 py-3 font-semibold text-slate-900 hover:bg-amber-400">
            Back to Home
          </a>
        </div>
      </div>
    );
  }
  throw error;
}

export default function CityServicePage() {
  const { service: serviceSlug, city: citySlug } = useParams();
  const [isLeadFormOpen, setIsLeadFormOpen] = useState(false);
  const service = SERVICES[serviceSlug];

  if (!service || !CITIES[citySlug]) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Page Not Found</h1>
          <a href="/" className="text-amber-500 hover:underline">Back to Home</a>
        </div>
      </div>
    );
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Arcan Painting",
    url: "https://arcanpainting.ca",
    description: "Contact Arcan Painting to discuss a project.",
  };
  const projectSteps = [
    "Share the scope and condition of the space.",
    "Discuss the details, materials, and timing that matter to you.",
    "A team member can confirm the next steps after reviewing your request.",
  ];
  const faqItems = [
    {
      q: `How is a ${service.name.toLowerCase()} project planned?`,
      a: "Project details and suitable next steps depend on the space and the work requested. Share the information you have and the team can review it with you.",
    },
    {
      q: "How can I ask about pricing or timing?",
      a: "Use the contact form to describe the project. A team member can review the details before confirming pricing, timing, availability, or other project-specific information.",
    },
  ];
  const otherServices = Object.entries(SERVICES).filter(([slug]) => slug !== serviceSlug);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="min-h-screen bg-white">
        <Header />
        <main>
          <section className="bg-slate-900 py-24 text-white">
            <div className="max-w-5xl mx-auto px-6">
              <p className="text-amber-400 font-semibold tracking-wide uppercase text-sm mb-4">Arcan Painting</p>
              <h1 className="text-4xl lg:text-6xl font-extrabold leading-tight mb-6">{service.name} Project Inquiry</h1>
              <p className="text-xl lg:text-2xl text-slate-200 mb-8 max-w-2xl">Tell us about your space, goals, and project details to begin the conversation.</p>
              <button onClick={() => setIsLeadFormOpen(true)} className="bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold px-8 py-4 rounded-xl text-lg transition-all hover:scale-105 shadow-lg">
                Discuss Your Project
              </button>
            </div>
          </section>

          <section className="py-16 bg-white">
            <div className="max-w-5xl mx-auto px-6 grid lg:grid-cols-3 gap-12 items-start">
              <div className="lg:col-span-2">
                <h2 className="text-3xl font-bold text-slate-900 mb-6">Plan Your {service.name} Project</h2>
                <p className="text-slate-600 text-lg leading-relaxed mb-6">Every project has its own scope, surfaces, and priorities. Share the details that matter to you so the team can understand what you need.</p>
                <p className="text-slate-600 text-lg leading-relaxed">Questions about materials, preparation, timing, and next steps can be addressed once the project details have been reviewed.</p>
              </div>
              <div className="bg-amber-50 rounded-2xl p-8 border border-amber-100">
                <h3 className="font-bold text-slate-900 text-xl mb-6">Start with the details</h3>
                <ul className="space-y-3">
                  {projectSteps.map((item) => <li key={item} className="flex items-start gap-3 text-slate-700"><span className="text-amber-500 font-bold mt-0.5">✓</span><span>{item}</span></li>)}
                </ul>
                <button onClick={() => setIsLeadFormOpen(true)} className="mt-8 w-full bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold py-3 rounded-xl transition-all">Contact the Team</button>
              </div>
            </div>
          </section>

          <section className="py-16 bg-slate-50">
            <div className="max-w-5xl mx-auto px-6">
              <h2 className="text-3xl font-bold text-slate-900 text-center mb-4">Discuss Your {service.name} Project</h2>
              <p className="text-slate-600 text-center text-lg mb-12 max-w-2xl mx-auto">Share the details of your project and the team can discuss the appropriate next steps.</p>
              <div className="grid md:grid-cols-3 gap-6">
                {projectSteps.map((step, index) => <div key={step} className="flex items-start gap-4 bg-white rounded-xl p-5 border border-slate-100"><span className="bg-amber-400 text-slate-900 font-bold w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm">{index + 1}</span><p className="text-slate-700 leading-relaxed">{step}</p></div>)}
              </div>
            </div>
          </section>

          <section className="py-16 bg-white">
            <div className="max-w-3xl mx-auto px-6">
              <h2 className="text-3xl font-bold text-slate-900 text-center mb-10">{service.name} FAQ</h2>
              <div className="space-y-5">{faqItems.map((item) => <div key={item.q} className="bg-white rounded-2xl p-6 border border-slate-200"><h3 className="text-lg font-bold text-slate-900 mb-3">{item.q}</h3><p className="text-slate-600 leading-relaxed">{item.a}</p></div>)}</div>
            </div>
          </section>

          <section className="py-16 bg-slate-50">
            <div className="max-w-5xl mx-auto px-6">
              <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">Explore Painting Services</h2>
              <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">{otherServices.map(([slug, item]) => <a key={slug} href={`/${slug}`} className="group bg-white hover:bg-amber-50 rounded-xl p-5 border border-slate-200 hover:border-amber-300 transition-all text-center"><p className="font-bold text-slate-900 group-hover:text-amber-700">{item.name}</p></a>)}</div>
            </div>
          </section>

          <section className="py-20 bg-gradient-to-br from-amber-400 to-yellow-500">
            <div className="max-w-3xl mx-auto px-6 text-center">
              <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-4">Start a Project Conversation</h2>
              <p className="text-slate-800 text-xl mb-10">Tell us about your project and the team can review the details with you.</p>
              <button onClick={() => setIsLeadFormOpen(true)} className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-10 py-4 rounded-xl text-xl transition-all hover:scale-105 shadow-lg">Contact the Team</button>
              <p className="mt-6 text-slate-700"><a href="/" className="underline hover:text-slate-900 font-medium">Back to Home</a></p>
            </div>
          </section>
        </main>
        <Footer />
      </div>
      {isLeadFormOpen && <LeadFormPopup onClose={() => setIsLeadFormOpen(false)} />}
    </>
  );
}
