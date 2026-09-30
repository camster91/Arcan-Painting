import { useEffect, useState } from "react";
import { CheckCircle, Calendar } from "lucide-react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import SchedulerSection from "../../components/SchedulerSection";

export default function ThankYouPage() {
  const [details, setDetails] = useState({
    name: "",
    serviceType: "",
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    setDetails({
      name: params.get("name") || "",
      serviceType: params.get("serviceType") || "",
    });
  }, []);

  return (
    <div className="min-h-screen h-dvh overflow-y-auto bg-paper text-ink">
      <Header />

      <main id="main" tabIndex={-1} className="max-w-2xl mx-auto px-4 sm:px-6 py-10 pb-24">
        {/* Thank You Section */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="text-green-600" size={32} />
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-normal text-ink mb-4">
            Thank you{details.name ? `, ${details.name}` : ""}!
          </h1>
          <p className="text-xl text-muted mb-2">
            Your request has been received.
          </p>
          {details.serviceType && (
            <p className="text-muted">
              Service: {toTitle(details.serviceType)}
            </p>
          )}
        </div>

        {/* Next Step - Book Appointment */}
        <div className="bg-white border border-line rounded-sm shadow-sm p-4 sm:p-8">
          {/* Scheduler */}
          <SchedulerSection />
        </div>
      </main>

      <Footer />
    </div>
  );
}

function toTitle(str) {
  try {
    if (!str) return "";
    return String(str)
      .split(/[_\-\s]+/)
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(" ");
  } catch {
    return str;
  }
}
