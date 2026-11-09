import PremiumShell from "@/components/premium/PremiumShell";
import { Section, SectionHeading } from "@/components/premium/primitives";
import ProjectContact from "@/components/premium/ProjectContact";
import GoogleListing from "@/components/premium/GoogleListing";
import { googleListing } from "@/data/googleListing";
import { useRouteLoaderData } from "react-router";
export default function Contact() {
  const rootData = useRouteLoaderData("root");
  const enquiriesEnabled = rootData?.enquiriesEnabled !== false;
  return (
    <PremiumShell enquiryHref="#enquire">
      <Section className="p-two-column p-contact-layout">
        <div>
          <SectionHeading as="h1" eyebrow="Project enquiries" title="Request an estimate.">
            {enquiriesEnabled
              ? "Tell us about your space and how you would like us to respond. Our team will follow up to discuss the scope and arrange an estimate."
              : "Email or call our team to discuss your project, materials and preferred timing for an estimate."}
          </SectionHeading>
          {enquiriesEnabled && (
            <p>
              <a href="tel:+14167272148">416 727 2148</a>
              <br />
              <a href="mailto:info@arcanpainting.ca">info@arcanpainting.ca</a>
            </p>
          )}
        </div>
        <div className="p-contact-actions" id="enquire">
          <ProjectContact />
          <figure className="p-enquiry-review">
            <blockquote>“{googleListing.reviews[0].excerpt}”</blockquote>
            <figcaption>
              {googleListing.reviews[0].author} · Google review excerpt
              <br />
              <a href={googleListing.url} target="_blank" rel="noopener noreferrer">Read reviews on Google</a>
            </figcaption>
          </figure>
          <GoogleListing />
        </div>
      </Section>
    </PremiumShell>
  );
}
