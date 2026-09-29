import { useState } from "react";
import { ArrowRight, Phone } from "lucide-react";
import Footer from "./Footer";
import Header from "./Header";
import LeadFormPopup from "./LeadFormPopup";

// Only some photos have 800/1400px copies in public/hero; the rest have a 900px copy.
const RESPONSIVE = ["PXL_20251018_142500065", "PXL_20251009_180850831", "IMG-20260212-WA0016"];
const base = (file) => file.replace(/\.webp$/, "");
const heroSrc = (file, width) => `/hero/${base(file)}-${width}.webp`;
const hasResponsive = (file) => RESPONSIVE.includes(base(file));

// Data-driven landing page (see src/data/landingPages.js).
export default function LandingPage({ page }) {
  const [isLeadFormOpen, setIsLeadFormOpen] = useState(false);
  const openForm = () => setIsLeadFormOpen(true);

  return (
    <div className="min-h-screen bg-paper text-ink">
      <Header />
      <main id="main" tabIndex={-1}>
        <section className="texture-plaster bg-ink text-paper">
          <div className="mx-auto grid max-w-[1440px] gap-10 px-4 pb-16 pt-10 sm:px-6 md:px-10 lg:grid-cols-12 lg:gap-12 lg:pb-24 lg:pt-16">
            <div className="flex flex-col justify-center lg:col-span-6">
              <p className="mb-6 text-xs font-semibold uppercase tracking-[0.18em] text-brand">{page.eyebrow}</p>
              <h1 className="font-display text-[2.4rem] font-normal leading-[1.06] tracking-[-0.02em] sm:text-6xl">
                {page.headline} <em className="font-normal italic text-brand">{page.headlineEm}</em>
              </h1>
              <p className="mt-7 max-w-lg text-lg leading-relaxed text-paper/75">{page.intro}</p>
              <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-4">
                <button type="button" className="btn-brand" onClick={openForm}>
                  Discuss your project <ArrowRight size={16} aria-hidden="true" />
                </button>
                <a href="tel:+14167272148" className="link-underline text-paper">
                  <Phone size={15} aria-hidden="true" /> (416) 727-2148
                </a>
              </div>
            </div>
            <figure className="lg:col-span-6">
              <img
                src={heroSrc(page.heroImage, hasResponsive(page.heroImage) ? 1400 : 900)}
                srcSet={hasResponsive(page.heroImage) ? `${heroSrc(page.heroImage, 800)} 800w, ${heroSrc(page.heroImage, 1400)} 1400w` : undefined}
                sizes="(min-width: 1024px) 50vw, 100vw"
                alt={page.heroAlt}
                width="1400"
                height="1400"
                loading="eager"
                fetchpriority="high"
                decoding="async"
                className="aspect-[4/5] w-full object-cover sm:aspect-[5/4] lg:aspect-[6/7]"
                style={{ imageOrientation: "from-image" }}
              />
            </figure>
          </div>
        </section>

        {page.context && (
          <section className="mx-auto max-w-[1440px] px-4 pt-20 sm:px-6 md:px-10 lg:pt-28">
            <p className="max-w-3xl text-xl leading-relaxed text-ink-soft">{page.context}</p>
          </section>
        )}

        <section className="mx-auto max-w-[1440px] px-4 py-20 sm:px-6 md:px-10 lg:py-28">
          <h2 className="max-w-3xl font-display text-4xl leading-[1.08] tracking-[-0.015em] sm:text-5xl">{page.finishesTitle}</h2>
          <ul className="mt-14 grid gap-px overflow-hidden border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
            {page.finishes.map((item) => (
              <li key={item.title} className="bg-paper p-7 lg:p-9">
                <h3 className="font-display text-2xl">{item.title}</h3>
                <p className="mt-3 leading-relaxed text-ink-soft">{item.text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="texture-limewash border-y border-line bg-paper-deep">
          <div className="mx-auto grid max-w-[1440px] gap-10 px-4 py-20 sm:px-6 md:px-10 lg:grid-cols-12 lg:py-24">
            <h2 className="font-display text-4xl leading-[1.08] tracking-[-0.015em] lg:col-span-5">{page.principlesTitle}</h2>
            <ul className="space-y-6 text-lg leading-relaxed text-ink-soft lg:col-span-7">
              {page.principles.map((line) => (
                <li key={line} className="border-l-2 border-brand pl-5">{line}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mx-auto max-w-[1440px] px-4 py-20 sm:px-6 md:px-10 lg:py-24">
          <h2 className="font-display text-3xl sm:text-4xl">{page.areasTitle}</h2>
          <ul className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-lg text-ink-soft">
            {page.areas.map((area) => (
              <li key={area}>{page.areaLinks?.[area] ? <a className="link-underline" href={page.areaLinks[area]}>{area}</a> : area}</li>
            ))}
          </ul>
          <p className="mt-6 text-muted">{page.areasNote}</p>
        </section>

        <section className="border-t border-line">
          <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:py-24">
            <h2 className="font-display text-4xl sm:text-5xl">Questions, answered.</h2>
            <div className="mt-10 divide-y divide-line border-y border-line">
              {page.faqs.map(([q, a]) => (
                <article key={q} className="py-7">
                  <h3 className="font-display text-2xl">{q}</h3>
                  <p className="mt-3 text-lg leading-relaxed text-ink-soft">{a}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="texture-brass bg-ink text-paper">
          <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
            <h2 className="font-display text-4xl sm:text-5xl">Have a room in mind?</h2>
            <p className="mt-5 text-lg text-paper/75">Share the rooms, the finish and any reference images. The team reviews the details before confirming next steps.</p>
            <button type="button" className="btn-brand mt-9" onClick={openForm}>Discuss your project</button>
          </div>
        </section>
      </main>
      <Footer />
      {isLeadFormOpen && <LeadFormPopup onClose={() => setIsLeadFormOpen(false)} />}
    </div>
  );
}
