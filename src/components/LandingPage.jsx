import { useState } from "react";
import { ArrowRight, Phone } from "lucide-react";
import Footer from "./Footer";
import Header from "./Header";
import LeadFormPopup from "./LeadFormPopup";
import FinishLinks from "./FinishLinks";
import ContactSection from "./ContactSection";
import { FINISH_PAGES } from "../data/landingPages";
import { photoSrc, photoSrcSet } from "../data/photos";

// Data-driven landing page for the luxury GTA page, finish pages and market pages
// (src/data/landingPages.js, src/data/markets.js). Every hero uses the same teal
// plaster ground; colour comes from the photography.
export default function LandingPage({ page }) {
  const [isLeadFormOpen, setIsLeadFormOpen] = useState(false);
  const finishSlug = Object.keys(FINISH_PAGES).find((k) => FINISH_PAGES[k] === page);

  return (
    <div className="min-h-screen bg-paper text-ink">
      <Header />
      <main id="main" tabIndex={-1}>
        <section className="texture-plaster bg-ink text-paper">
          <div className="mx-auto grid max-w-[1440px] gap-12 px-4 pb-20 pt-12 sm:px-6 md:px-10 lg:grid-cols-12 lg:gap-12 lg:pb-28 lg:pt-20">
            <div className="flex flex-col justify-center lg:col-span-6">
              <p className="eyebrow-light mb-6">{page.eyebrow}</p>
              <h1 className="display-h1">{page.headline} {page.headlineEm}</h1>
              <p className="mt-7 max-w-lg text-lg leading-relaxed text-paper/80">{page.intro}</p>
              <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4">
                <button type="button" className="btn-brand" onClick={() => setIsLeadFormOpen(true)}>
                  Discuss your project <ArrowRight size={16} aria-hidden="true" />
                </button>
                <a href="tel:+14167272148" className="link-underline text-paper">
                  <Phone size={15} aria-hidden="true" /> (416) 727-2148
                </a>
              </div>
            </div>
            <figure className="lg:col-span-6">
              <div className="frame-brass mx-auto max-w-[520px] pr-3.5">
                {page.heroTexture ? (
                  <div role="img" aria-label={`${page.service} texture, illustrative`} className="arch aspect-[4/5] w-full bg-cover bg-center" style={{ backgroundImage: `url(/luxury/${page.heroTexture}.webp)` }} />
                ) : (
                  <img
                    src={photoSrc(page.heroPhoto, 1400)}
                    srcSet={photoSrcSet(page.heroPhoto)}
                    sizes="(min-width: 1024px) 40vw, 100vw"
                    alt={page.heroPhoto.alt}
                    width="1400"
                    height="1750"
                    loading="eager"
                    fetchpriority="high"
                    decoding="async"
                    className="arch aspect-[4/5] w-full object-cover"
                  />
                )}
              </div>
              <figcaption className="mx-auto mt-6 max-w-[520px] text-sm text-paper/70">
                {page.heroTexture ? "Illustrative texture, not a project photo. Samples are made for your space." : `Arcan project: ${page.heroPhoto.alt.charAt(0).toLowerCase()}${page.heroPhoto.alt.slice(1)}.`}
              </figcaption>
            </figure>
          </div>
        </section>

        {page.context && (
          <section className="mx-auto max-w-[1440px] px-4 pt-20 sm:px-6 md:px-10 lg:pt-24">
            <p className="max-w-[60ch] font-display text-2xl leading-snug text-ink sm:text-[1.75rem]">{page.context}</p>
            {page.architecture && <p className="mt-6 max-w-[65ch] text-lg leading-relaxed text-ink-soft">{page.architecture}</p>}
          </section>
        )}

        <section className="mx-auto max-w-[1440px] px-4 py-20 sm:px-6 md:px-10 lg:py-24">
          <h2 className="display-h2 max-w-3xl">{page.finishesTitle}</h2>
          <ul className="mt-12 grid gap-px overflow-hidden border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
            {page.finishes.map((item) => (
              <li key={item.title} className="bg-paper p-7 lg:p-9">
                <h3 className="font-display text-2xl">{item.title}</h3>
                <p className="mt-3 leading-relaxed text-ink-soft">{item.text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="border-y border-line bg-paper-deep">
          <div className="mx-auto grid max-w-[1440px] gap-10 px-4 py-20 sm:px-6 md:px-10 lg:grid-cols-12 lg:py-24">
            <h2 className="display-h2 lg:col-span-5">{page.principlesTitle}</h2>
            <ul className="space-y-6 text-lg leading-relaxed text-ink-soft lg:col-span-7">
              {page.principles.map((line) => (
                <li key={line} className="border-l-2 border-brand pl-5">{line}</li>
              ))}
            </ul>
          </div>
        </section>

        <FinishLinks exclude={finishSlug} title="Explore the finishes." />

        <section className="border-t border-line bg-paper">
          <div className="mx-auto max-w-[1440px] px-4 py-20 sm:px-6 md:px-10 lg:py-24">
            <h2 className="font-display text-3xl sm:text-4xl">{page.areasTitle}</h2>
            <ul className="mt-8 flex flex-wrap gap-3">
              {page.areas.map((area) => {
                const href = page.areaLinks?.[area];
                const cls = "inline-flex items-center gap-1.5 border border-line px-4 py-2 text-[15px] text-ink-soft";
                return <li key={area}>{href ? <a className={`${cls} hover:border-ink hover:text-ink`} href={href}>{area} <ArrowRight size={14} aria-hidden="true" /></a> : <span className={cls}>{area}</span>}</li>;
              })}
            </ul>
            <p className="mt-6 text-muted">{page.areasNote}</p>
          </div>
        </section>

        <section className="border-t border-line bg-paper-deep">
          <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:py-24">
            <h2 className="display-h2">Questions, answered.</h2>
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

        <ContactSection />
      </main>
      <Footer />
      {isLeadFormOpen && <LeadFormPopup onClose={() => setIsLeadFormOpen(false)} />}
    </div>
  );
}
