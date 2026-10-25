import { useRouteLoaderData } from "react-router";
import PremiumInquiry from "./PremiumInquiry";
import { ButtonLink } from "./primitives";

export default function ProjectContact(props) {
  const rootData = useRouteLoaderData("root");
  if (rootData?.enquiriesEnabled !== false) return <PremiumInquiry {...props} />;
  return (
    <div className="p-form p-contact-options">
      <ButtonLink href="mailto:info@arcanpainting.ca">Email Arcan</ButtonLink>
      <ButtonLink href="tel:+14167272148" subtle>Call 416 727 2148</ButtonLink>
    </div>
  );
}
