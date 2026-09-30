import { ArrowUpRight } from "lucide-react";
import { FINISH_PAGES, finishPath } from "../data/landingPages";

const CARD_TEXTURE = { "venetian-plaster": "navy", limewash: "terracotta", wallcoverings: "burgundy", "dark-rooms": "charcoal", staircases: "plaster-teal" };

// Cards linking to the finish pages, each on its own texture.
export default function FinishLinks({ exclude }) {
  const entries = Object.entries(FINISH_PAGES).filter(([slug]) => slug !== exclude);
  return (
    <section aria-labelledby="finish-links-heading" className="bg-paper">
      <div className="mx-auto max-w-[1440px] px-4 py-20 sm:px-6 md:px-10 lg:py-28">
        <p className="eyebrow">Finishes</p>
        <h2 id="finish-links-heading" className="mt-4 max-w-3xl font-display text-4xl leading-[1.08] tracking-[-0.015em] text-ink sm:text-5xl">
          Explore the finishes.
        </h2>
        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {entries.map(([slug, page]) => (
            <li key={slug}>
              <a
                href={finishPath(slug)}
                className="group relative flex min-h-[220px] flex-col justify-end overflow-hidden p-7 text-paper transition-transform duration-300 hover:-translate-y-1"
                style={{ backgroundImage: `linear-gradient(rgba(6,12,14,.15), rgba(6,12,14,.7)), url(/luxury/${CARD_TEXTURE[slug]}.webp)`, backgroundSize: "cover", backgroundPosition: "center" }}
              >
                <ArrowUpRight className="absolute right-5 top-5 opacity-70 transition group-hover:opacity-100" size={22} aria-hidden="true" />
                <span className="font-display text-3xl">{page.service}</span>
                <span className="mt-2 text-sm text-paper/80">{page.intro.split(" — ")[0]}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
