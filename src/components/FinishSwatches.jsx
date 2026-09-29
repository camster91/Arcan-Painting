// Illustrative finish swatches (generated textures in public/luxury). They show
// colour and surface character only, not completed Arcan projects.
const SWATCHES = [
  { name: "Midnight plaster", note: "Deep, polished, quietly dramatic", tx: "navy" },
  { name: "Sage limewash", note: "Soft, chalky, calm", tx: "sage" },
  { name: "Oxblood", note: "Rich colour with a metallic glint", tx: "burgundy" },
  { name: "Terracotta", note: "Warm clay tones", tx: "terracotta" },
  { name: "Charcoal", note: "Sharp lines against light trim", tx: "charcoal" },
  { name: "Blush plaster", note: "Luminous and delicate", tx: "blush" },
];

export default function FinishSwatches() {
  return (
    <section aria-labelledby="swatches-heading" className="bg-paper">
      <div className="mx-auto max-w-[1440px] px-4 py-20 sm:px-6 md:px-10 lg:py-28">
        <div className="grid gap-6 lg:grid-cols-12">
          <p className="eyebrow lg:col-span-3">Colour and finish</p>
          <h2 id="swatches-heading" className="font-display text-4xl leading-[1.08] tracking-[-0.015em] text-ink sm:text-5xl lg:col-span-9">
            Colour with depth, not just a coat of paint.
          </h2>
        </div>
        <ul className="mt-14 grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:mt-20 lg:grid-cols-6">
          {SWATCHES.map((s) => (
            <li key={s.name}>
              <div
                role="img"
                aria-label={`${s.name} texture swatch`}
                className="arch aspect-[3/4] w-full bg-cover bg-center shadow-lg"
                style={{ backgroundImage: `url(/luxury/${s.tx}.webp)` }}
              />
              <p className="mt-4 font-display text-xl text-ink">{s.name}</p>
              <p className="mt-1 text-sm text-muted">{s.note}</p>
            </li>
          ))}
        </ul>
        <p className="mt-10 text-sm text-muted">
          Illustrative textures. Colours, finishes and samples are agreed for your space and lighting.
        </p>
      </div>
    </section>
  );
}
