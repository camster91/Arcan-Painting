import PremiumShell from "@/components/premium/PremiumShell";
import { Section, SectionHeading } from "@/components/premium/primitives";
import PremiumInquiry from "@/components/premium/PremiumInquiry";
export default function Contact() {
  return (
    <PremiumShell>
      <Section tone="ink">
        <SectionHeading
          as="h1"
          eyebrow="Project enquiries"
          title="Tell us what you have in mind."
        >
          Premium painting, wallpaper and luxury finishes for spaces with a
          point of view.
        </SectionHeading>
      </Section>
      <Section className="p-two-column">
        <div>
          <SectionHeading title="Start with a conversation.">
            Share your contact details and preferred timing for an estimate. We
            will follow up to discuss the scope and arrange a suitable time.
          </SectionHeading>
          <p>
            Estimates are complimentary. Your requested date is a preference; an
            appointment is confirmed directly with our team.
          </p>
          <p>
            <a href="tel:+14167272148">416 727 2148</a>
            <br />
            <a href="mailto:info@arcanpainting.ca">info@arcanpainting.ca</a>
          </p>
        </div>
        <PremiumInquiry />
      </Section>
    </PremiumShell>
  );
}
