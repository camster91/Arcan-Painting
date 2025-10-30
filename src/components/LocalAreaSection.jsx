import { MapPin, Car, Home, Brush, Star } from "lucide-react";
import { useState, useEffect } from "react";
import LeadFormPopup from "./LeadFormPopup";

export default function LocalAreaSection() {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeadFormOpen, setIsLeadFormOpen] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 },
    );

    const section = document.getElementById("local-area");
    if (section) observer.observe(section);

    return () => observer.disconnect();
  }, []);

  const serviceAreas = [
    "Toronto",
    "Mississauga",
    "Brampton",
    "Markham",
    "Vaughan",
    "Richmond Hill",
    "Oakville",
    "Burlington",
    "Milton",
    "Pickering",
    "Ajax",
    "Whitby",
  ];

  return (
    <section
      id="local-area"
      className="relative py-20 lg:py-32 overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700"
    >
      {/* Enhanced Background Effects */}
      <div className="absolute inset-0">
        {/* Animated gradient orbs */}
        <div className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-r from-amber-400/10 to-yellow-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-gradient-to-r from-blue-400/10 to-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>

        {/* Geometric pattern */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.3'%3E%3Cpath d='M40 0L0 40L40 80L80 40Z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              backgroundSize: "80px 80px",
            }}
          ></div>
        </div>
      </div>

      <div className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Enhanced Section Header */}
        <div
          className={`text-center mb-16 lg:mb-24 transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-6 py-3 mb-8">
            <div className="bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full p-1.5">
              <MapPin size={18} className="text-white" />
            </div>
            <span className="text-white/90 text-base lg:text-lg font-medium">
              Proudly Serving Toronto Since 1995
            </span>
          </div>

          {/* Main Headline */}
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-8">
            Your Local Painting Experts
          </h2>

          {/* Subtitle */}
          <p className="text-2xl lg:text-3xl text-slate-300 max-w-4xl mx-auto leading-relaxed mb-12">
            Deep roots in Toronto with
            <span className="text-amber-400 font-semibold"> 25+ years </span>
            of experience in your community
          </p>
        </div>

        {/* Service Areas Grid */}
        <div
          className={`mb-16 transition-all duration-1000 delay-200 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          <h3 className="text-3xl font-bold text-white text-center mb-8">
            Areas We Serve
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {serviceAreas.map((area, index) => (
              <div
                key={index}
                className="group relative bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 text-center hover:bg-white/20 transition-all duration-300 hover:scale-105"
                style={{
                  animation: isVisible
                    ? `fadeInUp 0.6s ease-out ${index * 0.05}s both`
                    : "none",
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-amber-400/10 to-yellow-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="relative text-white font-medium text-lg">
                  {area}
                </span>
              </div>
            ))}
          </div>
          <p className="text-slate-300 text-center mt-8 text-lg">
            Don't see your area?{" "}
            <button
              className="text-amber-400 hover:text-amber-300 font-semibold underline decoration-amber-400/50 hover:decoration-amber-300 transition-colors duration-200"
              onClick={() => setIsLeadFormOpen(true)}
            >
              Contact us
            </button>{" "}
            - we may still be able to help!
          </p>
        </div>

        {/* Enhanced CTA */}
        <div
          className={`mt-16 transition-all duration-1000 delay-400 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          <div className="relative bg-gradient-to-br from-amber-400 to-yellow-500 rounded-3xl p-8 md:p-12 text-center max-w-4xl mx-auto shadow-2xl overflow-hidden">
            {/* Background effects */}
            <div className="absolute -bottom-10 -right-10 w-56 h-56 bg-white/30 rounded-full blur-3xl opacity-60"></div>
            <div className="absolute -top-8 -left-8 w-40 h-40 bg-white/20 rounded-full blur-2xl opacity-60"></div>

            <div className="relative z-10">
              <h3 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-6 leading-tight">
                Ready to Transform Your Space?
              </h3>
              <p className="text-slate-800 text-xl lg:text-2xl mb-8 leading-relaxed max-w-2xl mx-auto">
                Join hundreds of satisfied neighbors who trust us for their
                painting needs
              </p>
              <button
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-8 py-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 text-xl"
                onClick={() => setIsLeadFormOpen(true)}
              >
                Get Your Local Quote
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ADD: LeadFormPopup */}
      <LeadFormPopup
        isOpen={isLeadFormOpen}
        onClose={() => setIsLeadFormOpen(false)}
      />

      {/* CSS Animations */}
      <style jsx global>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}
