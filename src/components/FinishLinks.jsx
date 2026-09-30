import { FINISH_PAGES, finishPath } from "../data/landingPages";
import { PHOTOS, photoSrc } from "../data/photos";

// Finish cards. Plaster, limewash and cabinets have no project photos yet, so they
// show a generated texture and say so; the others use real Arcan photos.
const CARD_VISUAL = {
  "venetian-plaster": { texture: "plaster-teal" },
  limewash: { texture: "limewash-ivory" },
  wallcoverings: { photo: PHOTOS.muralInstall },
  "dark-rooms": { photo: PHOTOS.wineBar },
  staircases: { photo: PHOTOS.staircaseLong },
  "ceilings-and-trim": { photo: PHOTOS.redBeams },
  "cabinet-painting": { texture: "greige" },
  "wallpaper-removal": { photo: PHOTOS.floralBedroom },
};

export default function FinishLinks({ exclude, title = "Finishes with depth, not just a coat of paint." }) {
  // On a finish page show four related finishes; elsewhere show them all.
  const all = Object.entries(FINISH_PAGES).filter(([slug]) => slug !== exclude);
  const entries = exclude ? all.slice(0, 4) : all;
  return (
    <section aria-labelledby="finish-links-heading" className="border-t border-line bg-paper">
      <div className="mx-auto max-w-[1440px] px-4 py-20 sm:px-6 md:px-10 lg:py-28">
        <p className="eyebrow">Finishes</p>
        <h2 id="finish-links-heading" className="mt-4 max-w-3xl font-display text-4xl leading-[1.08] tracking-[-0.015em] text-ink sm:text-5xl">
          {title}
        </h2>
        <ul className="mt-14 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
          {entries.map(([slug, page]) => {
            const visual = CARD_VISUAL[slug];
            return (
              <li key={slug}>
                <a href={finishPath(slug)} className="group block">
                  <div className="relative overflow-hidden arch">
                    {visual.photo ? (
                      <img src={photoSrc(visual.photo, 800)} alt={visual.photo.alt} loading="lazy" decoding="async" className="aspect-[3/4] w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
                    ) : (
                      <>
                        <div role="img" aria-label={`${page.service} texture, illustrative`} className="aspect-[3/4] w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-[1.04]" style={{ backgroundImage: `url(/luxury/${visual.texture}.webp)` }} />
                        <span className="absolute bottom-3 left-3 bg-paper/90 px-2 py-1 text-[11px] uppercase tracking-[0.14em] text-ink-soft">Illustrative</span>
                      </>
                    )}
                  </div>
                  <p className="mt-4 font-display text-2xl text-ink group-hover:text-brand-deep">{page.service}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{page.cardText}</p>
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
