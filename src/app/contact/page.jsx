import PremiumShell from "@/components/premium/PremiumShell";
import { Section, SectionHeading } from "@/components/premium/primitives";
import ProjectContact from "@/components/premium/ProjectContact";
import { useRouteLoaderData } from "react-router";
export default function Contact() {
  const rootData = useRouteLoaderData("root");
  const enquiriesEnabled = rootData?.enquiriesEnabled !== false;
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
            {enquiriesEnabled
              ? "Share your contact details and preferred timing for an estimate. We will follow up to discuss the scope and arrange a suitable time."
              : "Email or call our team to discuss your project, materials and preferred timing for an estimate."}
          </SectionHeading>
          <p>
            Estimate appointments are confirmed directly with our team.
          </p>
          {enquiriesEnabled && (
            <p>
              <a href="tel:+14167272148">416 727 2148</a>
              <br />
              <a href="mailto:info@arcanpainting.ca">info@arcanpainting.ca</a>
            </p>
          )}
        </div>
        <ProjectContact />
      </Section>
    </PremiumShell>
  );
}
