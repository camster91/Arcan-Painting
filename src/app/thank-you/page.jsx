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
    <div className="min-h-screen bg-white">
      <Header />

      <main className="max-w-7xl mx-auto px-6 sm:px-4 py-16">
        {/* Thank You Section */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="text-green-600" size={32} />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Thank you{details.name ? `, ${details.name}` : ""}!
          </h1>
          <p className="text-xl text-slate-600 mb-2">
            Your request has been received.
          </p>
          {details.serviceType && (
            <p className="text-slate-500">
              Service: {toTitle(details.serviceType)}
            </p>
          )}
        </div>

        {/* Next Step - Book Appointment */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
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
