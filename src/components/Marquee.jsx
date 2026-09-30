const WORDS = ["Venetian plaster", "Limewash", "Wallcoverings", "Murals", "Deep colour", "Painted ceilings", "Sharp lines", "Staircases", "Millwork"];

// Slow scrolling band. Motion stops for visitors who prefer reduced motion.
export default function Marquee() {
  const row = [...WORDS, ...WORDS];
  return (
    <div className="overflow-hidden border-y border-white/10 bg-ink py-5 text-paper/90" aria-hidden="true">
      <div className="marquee-track flex w-max gap-10 whitespace-nowrap font-display text-2xl italic sm:text-3xl">
        {row.map((w, i) => (
          <span key={i} className="flex items-center gap-10">{w}<span className="text-brand">✦</span></span>
        ))}
      </div>
    </div>
  );
}
