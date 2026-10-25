import PremiumShell from "@/components/premium/PremiumShell";
import ProjectContact from "@/components/premium/ProjectContact";
import { useRouteLoaderData } from "react-router";
import {
  Section,
  SectionHeading,
  ButtonLink,
} from "@/components/premium/primitives";
export default function ThankYouPage() {
  const rootData = useRouteLoaderData("root");
  const enquiriesEnabled = rootData?.enquiriesEnabled !== false;
  return (
    <PremiumShell>
      <Section>
        <SectionHeading
          as="h1"
          eyebrow={enquiriesEnabled ? "Project enquiry" : "Your next project"}
          title={enquiriesEnabled
            ? "Thank you for getting in touch."
            : "Start a conversation with Arcan."}
        >
          {enquiriesEnabled
            ? "Our team will review your enquiry and follow up using your preferred contact method to discuss the project and estimate timing."
            : "Email or call our team to discuss your space, the work you have in mind and your preferred timing."}
        </SectionHeading>
        <p>
          {enquiriesEnabled
            ? <>An appointment is confirmed directly with our team. For anything further, call <a href="tel:+14167272148">416 727 2148</a>.</>
            : "Estimate appointments are confirmed directly with our team."}
        </p>
        {enquiriesEnabled
          ? <ButtonLink href="/projects">Explore selected work</ButtonLink>
          : <ProjectContact />}
      </Section>
    </PremiumShell>
  );
}
