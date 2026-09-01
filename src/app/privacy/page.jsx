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
    <div className="min-h-screen bg-white text-slate-900">
      <Header />
      <main id="main" tabIndex={-1} className="max-w-3xl mx-auto px-4 sm:px-6 pt-28 pb-16">
        <h1 className="text-4xl font-bold tracking-tight">Privacy Notice</h1>
        <p className="mt-6 text-lg text-slate-700 leading-relaxed">
          This notice explains how Arcan Painting uses information submitted through this website.
        </p>

        <div className="mt-10 space-y-8 text-slate-700 leading-relaxed">
          <section>
            <h2 className="text-2xl font-semibold text-slate-900">Information submitted through forms</h2>
            <p className="mt-3">
              Estimate and contact forms may ask for your name, preferred contact details, service needs,
              project description, and address when you choose to provide it.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900">How it is used</h2>
            <p className="mt-3">
              We use this information to respond to your request, prepare an estimate, and manage the related
              customer inquiry. Information may be processed by providers that support website forms,
              communications, and business notifications.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900">Website measurement</h2>
            <p className="mt-3">
              The website may record page visits, form progress, referral information, and campaign parameters to understand how the site is used and whether inquiries are completed. An analytics provider is loaded only when it has been configured for the website.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900">Your choices</h2>
            <p className="mt-3">
              Please avoid sending sensitive financial information through website forms. For questions about an
              inquiry you submitted, or to request an update to it, contact us at{" "}
              <a className="text-amber-700 underline hover:text-amber-800" href="mailto:info@arcanpainting.ca">
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
