import PremiumShell from "@/components/premium/PremiumShell";
import { Section, SectionHeading } from "@/components/premium/primitives";
import ContactBlock from "@/components/premium/ContactBlock";
export default function About() {
  return (
    <PremiumShell>
      <Section tone="ink">
        <SectionHeading
          as="h1"
          eyebrow="Our approach"
          title="A considered finish. From the beginning."
        >
          Arcan brings painting, wallpaper and luxury finishes into one
          conversation about your space.
        </SectionHeading>
      </Section>
      <Section className="p-two-column">
        <SectionHeading title="Details that belong together." />
        <div className="p-copy">
          <p>
            Colour, texture and light shape how a room feels. We begin with your
            plans and references, then work through the surfaces, preparation
            and finish choices that bring the interior together.
          </p>
          <p>
            Our team coordinates the scope and next steps with homeowners,
            designers and project teams. Clear requirements, considered
            materials and a practical schedule give each project a sound
            starting point.
          </p>
        </div>
      </Section>
      <Section tone="stone" className="p-two-column">
        <SectionHeading eyebrow="The process" title="From preparation to final review." />
        <div className="p-copy">
          <p>Begin with the scope, colour references, materials and access. Discuss
            surface repairs and how furniture, floors and nearby finishes will be
            protected before work begins.</p>
          <p>Preparation and application are planned around the surfaces and the
            agreed finish. Review the work with the team at the end and discuss
            final details and care of the finished surfaces.</p>
        </div>
      </Section>
      <ContactBlock />
    </PremiumShell>
  );
}
