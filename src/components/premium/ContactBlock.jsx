import { Section, SectionHeading, ButtonLink } from "./primitives";
export default function ContactBlock({ enquiryHref = "/contact" }) {
  return (
    <Section tone="ink" className="p-contact-banner" id="contact">
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
        Share your plans, materials and preferred timing.
      </SectionHeading>
      <div className="p-cta-actions">
        <ButtonLink href={enquiryHref} accent>
          Request an estimate
        </ButtonLink>
        <a className="p-button p-button--line" href="tel:+14167272148">
          Call 416 727 2148
        </a>
      </div>
    </Section>
  );
}
