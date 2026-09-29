import Header from "../../components/Header";
import Footer from "../../components/Footer";

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
    <div className="min-h-screen bg-paper text-ink text-ink">
      <Header />
      <main id="main" tabIndex={-1} className="max-w-3xl mx-auto px-4 sm:px-6 pt-28 pb-16">
        <h1 className="font-display text-5xl font-normal tracking-tight">Privacy Notice</h1>
        <p className="mt-6 text-lg text-ink-soft leading-relaxed">
          This notice explains how Arcan Painting uses information submitted through this website.
        </p>

        <div className="mt-10 space-y-8 text-ink-soft leading-relaxed">
          <section>
            <h2 className="text-2xl font-semibold text-ink">Information submitted through forms</h2>
            <p className="mt-3">
              Estimate and contact forms may ask for your name, preferred contact details, service needs,
              project description, and address when you choose to provide it.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-ink">How it is used</h2>
            <p className="mt-3">
              We use this information to respond to your request, prepare an estimate, and manage the related
              customer inquiry. Information may be processed by providers that support website forms,
              communications, and business notifications.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-ink">Website measurement</h2>
            <p className="mt-3">
              The website may record page visits, form progress, referral information, and campaign parameters to understand how the site is used and whether inquiries are completed. An analytics provider is loaded only when it has been configured for the website.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-ink">Your choices</h2>
            <p className="mt-3">
              Please avoid sending sensitive financial information through website forms. For questions about an
              inquiry you submitted, or to request an update to it, contact us at{" "}
              <a className="text-brand-deep underline hover:text-brand-deep" href="mailto:info@arcanpainting.ca">
                info@arcanpainting.ca
              </a>.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
