import { useRouteLoaderData } from "react-router";
import PremiumInquiry from "./PremiumInquiry";
import { SectionHeading, ButtonLink } from "./primitives";

export default function ProjectContact(props) {
  const rootData = useRouteLoaderData("root");
  if (rootData?.enquiriesEnabled !== false) return <PremiumInquiry {...props} />;
  return (
    <div className="p-form p-contact-options">
      <SectionHeading title="Let’s discuss your project.">
        Tell us about the space, the work you have in mind and your preferred timing.
      </SectionHeading>
      <ButtonLink href="mailto:info@arcanpainting.ca">Email Arcan</ButtonLink>
      <ButtonLink href="tel:+14167272148" subtle>Call 416 727 2148</ButtonLink>
    </div>
  );
}
