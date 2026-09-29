import { isRouteErrorResponse, useParams, useRouteError } from "react-router";
import ServiceInquiryPage from "../../../components/ServiceInquiryPage";

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
      <div className="min-h-screen flex items-center justify-center bg-paper text-ink px-4 text-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-deep">404</p>
          <h1 className="mt-2 font-display text-5xl font-normal">Page Not Found</h1>
          <p className="mt-4 text-ink-soft">The project page you requested is not available.</p>
          <a href="/" className="btn-brand mt-6">
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
  const service = SERVICES[serviceSlug];

  if (!service || !CITIES[citySlug]) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper text-ink">
        <div className="text-center">
          <h1 className="font-display text-4xl mb-4">Page Not Found</h1>
          <a href="/" className="underline">Back to Home</a>
        </div>
      </div>
    );
  }

  // Location routes stay noindexed (see meta) and share the service page design.
  return <ServiceInquiryPage serviceName={service.name} />;
}
