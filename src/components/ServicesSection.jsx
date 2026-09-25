import { ArrowUpRight } from "lucide-react";

const SERVICES = [
  {
    title: "Interior painting",
    href: "/interior-painting",
    text: "Walls, ceilings, trim, doors and staircases — rooms emptied, covered and patched before the first coat goes on.",
    image: "PXL_20250217_224338011_MP.webp",
    alt: "Freshly painted living room with white walls and dark hardwood floors",
  },
  {
    title: "Exterior painting",
    href: "/exterior-painting",
    text: "Front doors, garage doors, trim, window frames and siding, planned around the weather and the surfaces involved.",
    image: "20251012_165336.webp",
    alt: "Brick house with a freshly painted front door and garage door",
  },
  {
    title: "Commercial painting",
    href: "/commercial-painting",
    text: "Restaurants, bars, offices and retail spaces, with scheduling that works around the people using them.",
    image: "IMG-20260217-WA0021.webp",
    alt: "Commercial bar with a dark painted ceiling and patterned wallcovering",
  },
  {
    title: "Wallpaper installation",
    href: "/wallpaper-services",
    text: "Feature walls, murals and full-room wallcoverings, from surface preparation through to the final seam.",
    image: "PXL_20260213_210915996.webp",
    alt: "Bedroom wall finished with a soft floral wallpaper",
  },
  {
    title: "Specialty finishes",
    href: "/specialty-finishes",
    text: "Accent colours, high-contrast staircases and decorative finishes for spaces that need more than a single colour.",
    image: "PXL_20210109_221844861.webp",
    alt: "Living room with a deep blue accent wall behind a white fireplace mantel",
  },
];

export default function ServicesSection() {
  return (
    <section id="services" className="border-t border-line bg-paper">
      <div className="mx-auto max-w-[1440px] px-4 py-20 sm:px-6 md:px-10 lg:py-28">
        <div className="grid gap-6 lg:grid-cols-12">
          <p className="eyebrow lg:col-span-3">What we do</p>
          <h2 className="font-display text-4xl leading-[1.08] tracking-[-0.015em] text-ink sm:text-5xl lg:col-span-9">
            Five kinds of work, one standard of preparation.
          </h2>
        </div>

        <ol className="mt-14 border-t border-line lg:mt-20">
          {SERVICES.map((service, i) => (
            <li key={service.href} className="border-b border-line">
              <a
                href={service.href}
                className="group grid items-center gap-5 py-7 sm:grid-cols-12 sm:gap-8 lg:py-9"
              >
                <span className="font-display text-lg text-muted sm:col-span-1">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="sm:col-span-6 lg:col-span-6">
                  <h3 className="font-display text-3xl text-ink transition-colors group-hover:text-brand-deep lg:text-4xl">
                    {service.title}
                  </h3>
                  <p className="mt-3 max-w-md leading-relaxed text-ink-soft">{service.text}</p>
                </div>
                <div className="overflow-hidden rounded-sm sm:col-span-4 lg:col-span-4">
                  <img
                    src={`/gallery/images/${service.image}`}
                    alt={service.alt}
                    loading="lazy"
                    decoding="async"
                    className="aspect-[3/2] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    style={{ imageOrientation: "from-image" }}
                  />
                </div>
                <ArrowUpRight
                  size={26}
                  aria-hidden="true"
                  className="hidden text-ink transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 sm:col-span-1 sm:block sm:justify-self-end"
                />
              </a>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
