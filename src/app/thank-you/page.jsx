import { redirect } from "react-router";
import { CheckCircle } from "lucide-react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import SchedulerSection from "../../components/SchedulerSection";

// Old bookmarks may contain contact details. Redirect before rendering or
// loading page analytics, without forwarding the query as a referrer.
export function loader({ request }) {
  if (new URL(request.url).search) {
    return redirect("/thank-you", {
      headers: { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" },
    });
  }
  return null;
}

export default function ThankYouPage() {
  return (
    <div className="min-h-screen h-dvh overflow-y-auto bg-white">
      <Header />

      <main id="main" tabIndex={-1} className="max-w-2xl mx-auto px-4 sm:px-6 py-10 pb-24">
        {/* Thank You Section */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="text-green-600" size={32} />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Thank you!
          </h1>
          <p className="text-xl text-slate-600 mb-2">
            Your request has been received.
          </p>
        </div>

        {/* Next Step - Book Appointment */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 sm:p-8">
          {/* Scheduler */}
          <SchedulerSection />
        </div>
      </main>

      <Footer />
    </div>
  );
}
