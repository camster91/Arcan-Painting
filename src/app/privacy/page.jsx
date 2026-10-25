import PremiumShell from "@/components/premium/PremiumShell";
import { Section } from "@/components/premium/primitives";
import { useRouteLoaderData } from "react-router";

export function meta() {
  return [
    { title: "Privacy Notice | Arcan Painting" },
    {
      name: "description",
      content: "How Arcan Painting uses information submitted through this website.",
    },
  ];
}

export default function PrivacyPage() {
  const rootData = useRouteLoaderData("root");
  const enquiriesEnabled = rootData?.enquiriesEnabled !== false;
  return (
    <PremiumShell>
      <Section className="p-privacy">
        <h1 >Privacy Notice</h1>
        <p className="mt-6 text-lg text-slate-700 leading-relaxed">
          This notice explains how Arcan Painting uses information submitted through this website.
        </p>

        <div className="mt-10 space-y-8 text-slate-700 leading-relaxed">
          <section>
            <h2 >{enquiriesEnabled ? "Information submitted through forms" : "Information you provide"}</h2>
            <p className="mt-3">
              {enquiriesEnabled
                ? "Estimate and contact forms may ask for your name, preferred contact details, service needs, project description, town or city, and optional estimate timing and budget."
                : "When you email or call Arcan, you may share your name, contact details, project location, service needs and preferred timing. The public website currently provides email and telephone links rather than an enquiry form."}
            </p>
          </section>

          <section>
            <h2 >How it is used</h2>
            <p className="mt-3">
              We use this information to respond to your request, prepare an estimate, and manage the related
              customer inquiry. {enquiriesEnabled
                ? "Website enquiries are stored using Cloudflare. Information may be processed by providers that support website forms, communications, and business notifications."
                : "Information may be processed by providers that support our email, telephone communications and business administration."}
            </p>
          </section>

          <section>
            <h2 >Website measurement</h2>
            <p className="mt-3">
              The website may record page visits, {enquiriesEnabled ? "form progress, " : ""}referral information, and campaign parameters to understand how the site is used. An analytics provider is loaded only when it has been configured for the website.
            </p>
          </section>

          <section>
            <h2>Google Maps and reviews</h2>
            <p className="mt-3">
              Selected Google review excerpts and ratings are a dated snapshot.
              The embedded Google map loads only when you open the listing popup.
              At that point Google receives connection information, such as your
              IP address and browser details, under its own privacy policy.
              You can contact us without opening the map.
            </p>
          </section>

          <section>
            <h2 >Your choices</h2>
            <p className="mt-3">
              Please avoid sending sensitive financial information {enquiriesEnabled ? "through website forms" : "in an initial enquiry"}. For questions about an
              inquiry you submitted, or to request access, correction or deletion, contact us at{" "}
              <a className="underline" href="mailto:info@arcanpainting.ca">
                info@arcanpainting.ca
              </a>.
            </p>
          </section>
        </div>
      </Section>
    </PremiumShell>
  );
}
