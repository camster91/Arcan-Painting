import { ArrowUpRight } from "lucide-react";
import { PHOTOS, photoSrc } from "../data/photos";

const SERVICES = [
  {
    title: "Interior painting",
    href: "/interior-painting",
    text: "Walls, ceilings, trim, doors and staircases, with rooms covered and patched before the first coat.",
    photo: PHOTOS.blueAccent,
  },
  {
    title: "Exterior painting",
    href: "/exterior-painting",
    text: "Front doors, trim, window frames and siding, planned around the weather and the surfaces involved.",
    photo: PHOTOS.blackWindow,
  },
  {
    title: "Commercial painting",
    href: "/commercial-painting",
    text: "Restaurants, bars, offices and retail, scheduled around the people using the space.",
    photo: PHOTOS.wineBar,
  },
  {
    title: "Wallpaper installation",
    href: "/wallpaper-services",
    text: "Feature walls, murals and full-room wallcoverings, from preparation to the final seam.",
    photo: PHOTOS.muralInstall,
  },
  {
    title: "Specialty finishes",
    href: "/specialty-finishes",
    text: "Painted ceilings, high-contrast details and decorative finishes for rooms that need more than one colour.",
    photo: PHOTOS.rugRoom,
  },
  {
    title: "Luxury finishes",
    href: "/luxury-painting-gta",
    text: "Venetian plaster, limewash and statement wallcoverings for homes across the GTA.",
    photo: PHOTOS.muralRoom,
  },
];

export default function ServicesSection() {
  return (
    <section id="services" className="border-t border-line bg-paper">
      <div className="mx-auto max-w-[1440px] px-4 py-20 sm:px-6 md:px-10 lg:py-28">
        <div className="grid gap-6 lg:grid-cols-12">
          <p className="eyebrow lg:col-span-3">What we do</p>
          <h2 className="display-h2 text-ink lg:col-span-9">Six kinds of work, one standard of preparation.</h2>
        </div>

        <ul className="mt-14 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:mt-20 lg:grid-cols-3">
          {SERVICES.map((service, i) => (
            <li key={service.href}>
              <a href={service.href} className="group block">
                <div className="overflow-hidden">
                  <img
                    src={photoSrc(service.photo, 900)}
                    alt={service.photo.alt}
                    loading="lazy"
                    decoding="async"
                    className="aspect-[4/5] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="mt-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="font-display text-sm text-muted">{String(i + 1).padStart(2, "0")}</p>
                    <h3 className="mt-1 font-display text-3xl text-ink transition-colors group-hover:text-brand-deep">{service.title}</h3>
                    <p className="mt-3 max-w-sm leading-relaxed text-ink-soft">{service.text}</p>
                  </div>
                  <ArrowUpRight size={24} aria-hidden="true" className="mt-6 shrink-0 text-ink transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </div>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
