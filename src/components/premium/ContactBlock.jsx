import { Section, SectionHeading, ButtonLink } from "./primitives";
export default function ContactBlock() {
  return (
    <Section tone="ink" className="p-contact-banner">
      <SectionHeading
        eyebrow="Your next project"
        title={
          <>
            A considered space.
            <br />
            <em>An exceptional finish.</em>
          </>
        }
      >
        Share your plans, materials and preferred timing. Estimates are
        complimentary.
      </SectionHeading>
      <ButtonLink href="/contact">Discuss your project</ButtonLink>
    </Section>
  );
}
