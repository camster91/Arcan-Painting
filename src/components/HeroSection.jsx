import { useState, lazy, Suspense } from "react";
import { ArrowRight, Phone } from "lucide-react";

// LeadFormPopup is only shown on CTA click — lazy load to keep hero bundle lean
const LeadFormPopup = lazy(() => import("./LeadFormPopup"));

// Arcan's own project photos (originals in public/gallery). The first one is the LCP image,
// so it loads eagerly; the others only load once a visitor picks them.
const HERO_SLIDES = [
  {
    file: "PXL_20251018_142500065.webp",
    alt: "Restaurant dining room finished with a patterned wallcovering and a dark painted ceiling",
    caption: "Restaurant dining room — wallcovering and ceiling",
  },
  {
    file: "PXL_20251009_180850831.webp",
    alt: "Painter installing a botanical mural wallcovering from a ladder",
    caption: "Botanical mural wallcovering, mid-installation",
  },
  {
    file: "IMG-20260212-WA0016.webp",
    alt: "Staircase refinished with black treads, white risers and white balusters",
    caption: "Staircase refinish — black treads, white risers",
  },
];

// Resized copies of the gallery originals (public/hero/<name>-800|1400.webp).
// The originals are full camera resolution (up to 7 MB), far too heavy for the
// first photo on the page. Regenerate these if a slide changes.
const heroSrc = (file, width) => `/hero/${file.replace(/\.webp$/, "")}-${width}.webp`;

const SERVICE_LINE = ["Interior", "Exterior", "Commercial", "Wallpaper", "Specialty finishes", "Luxury finishes"];

export default function HeroSection() {
  const [isLeadFormOpen, setIsLeadFormOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const slide = HERO_SLIDES[currentSlide];

  return (
    <section id="home" className="bg-ink text-paper">
      <div className="mx-auto grid max-w-[1440px] gap-10 px-4 pb-16 pt-8 sm:px-6 md:px-10 lg:grid-cols-12 lg:gap-12 lg:pb-24 lg:pt-14">
        {/* Copy */}
        <div className="flex flex-col justify-center lg:col-span-5">
          <p className="mb-6 text-xs font-semibold uppercase tracking-[0.18em] text-brand">Painting, plaster &amp; wallcoverings · Greater Toronto Area</p>

          <h1 className="font-display text-[2.6rem] font-normal leading-[1.04] tracking-[-0.02em] text-paper sm:text-6xl lg:text-[4.4rem]">
            Walls, considered as part of the{" "}
            <em className="font-normal italic text-brand">architecture.</em>
          </h1>

          <p className="mt-7 max-w-md text-lg leading-relaxed text-paper/75">
            Refined interior painting, wallpaper installation and specialty
            finishes — scoped with you, prepared properly and finished cleanly.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-4">
            <button type="button" className="btn-brand" onClick={() => setIsLeadFormOpen(true)}>
              Discuss your project <ArrowRight size={17} aria-hidden="true" />
            </button>
            <a href="tel:+14167272148" className="link-underline text-paper">
              <Phone size={15} aria-hidden="true" /> (416) 727-2148
            </a>
          </div>

          <ul className="mt-12 flex flex-wrap gap-x-5 gap-y-2 border-t border-white/15 pt-6 text-sm text-paper/60">
            {SERVICE_LINE.map((service) => (
              <li key={service}>{service}</li>
            ))}
          </ul>
        </div>

        {/* Photo */}
        <figure className="lg:col-span-7">
          <div className="relative aspect-[4/5] overflow-hidden  bg-white/5 sm:aspect-[5/4] lg:aspect-[6/7] xl:aspect-[7/7]">
            <img
              key={slide.file}
              src={heroSrc(slide.file, 1400)}
              srcSet={`${heroSrc(slide.file, 800)} 800w, ${heroSrc(slide.file, 1400)} 1400w`}
              sizes="(min-width: 1024px) 55vw, 100vw"
              alt={slide.alt}
              width="1400"
              height="1860"
              loading="eager"
              fetchpriority={currentSlide === 0 ? "high" : "auto"}
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover"
              style={{ imageOrientation: "from-image" }}
            />
          </div>
          <figcaption className="mt-4 flex flex-wrap items-center justify-between gap-4">
            <span className="text-sm text-paper/60">{slide.caption}</span>
            <div className="flex gap-2" role="group" aria-label="Choose a project photo">
              {HERO_SLIDES.map((item, i) => (
                <button
                  key={item.file}
                  type="button"
                  onClick={() => setCurrentSlide(i)}
                  aria-label={`Show photo ${i + 1}: ${item.caption}`}
                  aria-pressed={currentSlide === i}
                  className={`h-12 w-12 overflow-hidden  ring-offset-2 ring-offset-ink transition ${currentSlide === i ? "ring-2 ring-brand" : "opacity-70 hover:opacity-100"}`}
                >
                  <img
                    src={`/gallery/thumbnails/${item.file.replace(".webp", "_thumb.webp")}`}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          </figcaption>
        </figure>
      </div>

      {/* Lead Form Popup - lazy loaded, only rendered when open */}
      {isLeadFormOpen && (
        <Suspense fallback={null}>
          <LeadFormPopup
            isOpen={isLeadFormOpen}
            onClose={() => setIsLeadFormOpen(false)}
          />
        </Suspense>
      )}
    </section>
  );
}
