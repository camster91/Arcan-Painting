const STEPS = [
  {
    title: "Tell us about the space",
    text: "Share what needs painting, the condition it's in and any timing you're working around. Photos help.",
  },
  {
    title: "Scope and estimate",
    text: "We go through surfaces, repairs, colours and materials with you, then confirm the scope in writing before any work is booked.",
  },
  {
    title: "Prep, then paint",
    text: "Floors and furniture are covered, surfaces are cleaned, filled and sanded, and only then does the paint go on.",
  },
  {
    title: "Walkthrough together",
    text: "We walk the finished space with you, touch up anything that needs it and leave the room clean.",
  },
];

export default function ProcessSection() {
  return (
    <section id="process" className="tx-navy bg-ink text-paper">
      <div className="mx-auto max-w-[1440px] px-4 py-20 sm:px-6 md:px-10 lg:py-28">
        <div className="grid gap-6 lg:grid-cols-12">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand lg:col-span-3">
            How a project runs
          </p>
          <h2 className="font-display text-4xl leading-[1.08] tracking-[-0.015em] sm:text-5xl lg:col-span-8">
            Most of a good paint job happens before the paint.
          </h2>
        </div>

        <ol className="mt-14 grid gap-px overflow-hidden rounded-sm bg-white/15 sm:grid-cols-2 lg:mt-20 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <li key={step.title} className="bg-black/25 p-7 lg:p-8">
              <span className="font-display text-5xl text-brand">{i + 1}</span>
              <h3 className="mt-8 font-display text-2xl">{step.title}</h3>
              <p className="mt-3 leading-relaxed text-paper/70">{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
