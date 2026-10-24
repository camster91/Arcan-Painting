import PremiumShell from "@/components/premium/PremiumShell";
import {
  Section,
  SectionHeading,
  ButtonLink,
} from "@/components/premium/primitives";
export default function ThankYouPage() {
  return (
    <PremiumShell>
      <Section>
        <SectionHeading
          as="h1"
          eyebrow="Project enquiry"
          title="Thank you for getting in touch."
        >
          Our team will review your enquiry and follow up using your preferred
          contact method to discuss the project and estimate timing.
        </SectionHeading>
        <p>
          An appointment is confirmed directly with our team. For anything
          further, call <a href="tel:+14167272148">416 727 2148</a>.
        </p>
        <ButtonLink href="/projects">Explore selected work</ButtonLink>
      </Section>
    </PremiumShell>
  );
}
