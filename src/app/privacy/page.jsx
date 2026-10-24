import PremiumShell from "@/components/premium/PremiumShell";
import { Section } from "@/components/premium/primitives";

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
  return (
    <PremiumShell>
      <Section className="p-privacy">
        <h1 >Privacy Notice</h1>
        <p className="mt-6 text-lg text-slate-700 leading-relaxed">
          This notice explains how Arcan Painting uses information submitted through this website.
        </p>

        <div className="mt-10 space-y-8 text-slate-700 leading-relaxed">
          <section>
            <h2 >Information submitted through forms</h2>
            <p className="mt-3">
              Estimate and contact forms may ask for your name, preferred contact details, service needs,
              project description, town or city, and optional estimate timing and budget.
            </p>
          </section>

          <section>
            <h2 >How it is used</h2>
            <p className="mt-3">
              We use this information to respond to your request, prepare an estimate, and manage the related
              customer inquiry. Website enquiries are stored using Cloudflare. Information may be processed by providers that support website forms,
              communications, and business notifications.
            </p>
          </section>

          <section>
            <h2 >Website measurement</h2>
            <p className="mt-3">
              The website may record page visits, form progress, referral information, and campaign parameters to understand how the site is used and whether inquiries are completed. An analytics provider is loaded only when it has been configured for the website.
            </p>
          </section>

          <section>
            <h2 >Your choices</h2>
            <p className="mt-3">
              Please avoid sending sensitive financial information through website forms. For questions about an
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
