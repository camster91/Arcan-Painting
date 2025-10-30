import { useState, useEffect } from "react";
import {
  Calendar,
  FileText,
  Palette,
  CheckCircle,
  Settings,
  ArrowRight,
} from "lucide-react";
import LeadFormPopup from "./LeadFormPopup"; // ADD

export default function ProcessSection() {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeadFormOpen, setIsLeadFormOpen] = useState(false); // ADD

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 },
    );

    const section = document.getElementById("process");
    if (section) observer.observe(section);

    return () => observer.disconnect();
  }, []);

  const steps = [
    {
      icon: Calendar,
      title: "Free Consultation",
      description:
        "We visit your property to assess the project and discuss your vision",
      features: [
        "On-site property assessment",
        "Color consultation & recommendations",
        "Project scope & timeline discussion",
        "No obligation estimate",
      ],
      gradient: "from-blue-500/20 to-cyan-500/20",
    },
    {
      icon: FileText,
      title: "Detailed Estimate",
      description:
        "Receive a comprehensive quote with materials, timeline, and costs",
      features: [
        "Itemized cost breakdown",
        "Material specifications & quality",
        "Timeline & scheduling details",
        "Warranty & guarantee information",
      ],
      gradient: "from-purple-500/20 to-pink-500/20",
    },
    {
      icon: Palette,
      title: "Professional Painting",
      description:
        "Our skilled team transforms your space with quality materials",
      features: [
        "Premium paint & materials",
        "Meticulous surface preparation",
        "Clean & organized work area",
        "Daily progress updates",
      ],
      gradient: "from-amber-500/20 to-orange-500/20",
    },
    {
      icon: CheckCircle,
      title: "Final Walkthrough",
      description:
        "We ensure every detail meets our high standards and your satisfaction",
      features: [
        "Quality inspection checklist",
        "Client satisfaction review",
        "Touch-up completion",
        "Maintenance recommendations",
      ],
      gradient: "from-green-500/20 to-emerald-500/20",
    },
  ];

  return (
    <section
      id="process"
      className="relative py-20 lg:py-32 overflow-hidden"
      style={{
        fontFamily:
          'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        background:
          "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 25%, #e2e8f0 75%, #cbd5e1 100%)",
      }}
    >
      {/* Enhanced Background Effects */}
      <div className="absolute inset-0">
        {/* Animated gradient orbs */}
        <div className="absolute top-20 right-10 w-96 h-96 bg-gradient-to-r from-blue-400/10 to-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 left-10 w-80 h-80 bg-gradient-to-r from-amber-400/10 to-yellow-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>

        {/* Geometric pattern */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23334155' fill-opacity='0.4'%3E%3Cpath d='M30 30c16.569 0 30-13.431 30-30H30v30z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              backgroundSize: "60px 60px",
            }}
          ></div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Enhanced Section Header */}
        <div
          className={`text-center mb-16 lg:mb-24 transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-md border border-slate-200/50 rounded-full px-6 py-3 mb-8 shadow-lg">
            <div className="bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full p-1.5">
              <Settings size={16} className="text-white" />
            </div>
            <span className="text-slate-700 text-sm font-medium">
              Streamlined Process, Exceptional Results
            </span>
          </div>

          {/* Main Headline with Gradient */}
          <h2
            className="font-bold leading-tight mb-6"
            style={{
              fontSize: "clamp(36px, 8vw, 64px)",
              letterSpacing: "-0.02em",
              background:
                "linear-gradient(135deg, #1e293b 0%, #475569 50%, #64748b 100%)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Our Proven Process
          </h2>

          {/* Subtitle */}
          <p className="text-slate-600 text-xl lg:text-2xl max-w-4xl mx-auto leading-relaxed mb-12">
            From initial consultation to final walkthrough, we make professional
            painting
            <span className="text-amber-600 font-semibold">
              {" "}
              simple and stress-free
            </span>
          </p>
        </div>

        {/* Enhanced Process Steps */}
        <div className="mb-16">
          {/* Desktop Grid Layout */}
          <div className="hidden lg:grid lg:grid-cols-4 gap-8">
            {steps.map((step, index) => {
              const IconComponent = step.icon;

              return (
                <div
                  key={index}
                  className="relative group"
                  style={{
                    animation: isVisible
                      ? `fadeInUp 0.8s ease-out ${index * 0.2}s both`
                      : "none",
                  }}
                >
                  {/* Connection Line - Enhanced */}
                  {index < steps.length - 1 && (
                    <div className="absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-amber-300 to-amber-400 transform translate-x-4 z-0 opacity-60">
                      <div className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-1">
                        <ArrowRight size={16} className="text-amber-500" />
                      </div>
                    </div>
                  )}

                  <div
                    className={`bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 relative z-10 h-full border border-white/50`}
                  >
                    {/* Step Header */}
                    <div className="flex items-center justify-between mb-6">
                      {/* Step Number - Enhanced */}
                      <div className="relative">
                        <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-yellow-500 text-white rounded-2xl flex items-center justify-center font-bold text-lg shadow-lg">
                          {index + 1}
                        </div>
                        <div className="absolute -inset-1 bg-gradient-to-br from-amber-400 to-yellow-400 rounded-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
                      </div>

                      {/* Icon - Enhanced */}
                      <div
                        className={`w-14 h-14 bg-gradient-to-br ${step.gradient} backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/50 shadow-lg`}
                      >
                        <IconComponent className="w-7 h-7 text-slate-700" />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="space-y-4">
                      <h3 className="text-xl lg:text-2xl font-bold text-slate-900 leading-tight">
                        {step.title}
                      </h3>

                      <p className="text-slate-600 leading-relaxed">
                        {step.description}
                      </p>

                      {/* Static feature preview (no hover expand) */}
                      <div className="mt-6 space-y-3">
                        {step.features
                          .slice(0, 2)
                          .map((feature, featureIndex) => (
                            <div
                              key={featureIndex}
                              className="text-sm text-slate-600 leading-relaxed"
                            >
                              {feature}
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mobile/Tablet Carousel Layout */}
          <div className="lg:hidden">
            <div
              className="flex gap-6 overflow-x-auto pb-6 px-4 -mx-4 snap-x snap-mandatory"
              style={{
                scrollbarWidth: "none",
                msOverflowStyle: "none",
                WebkitScrollbar: { display: "none" },
              }}
            >
              {steps.map((step, index) => {
                const IconComponent = step.icon;

                return (
                  <div
                    key={index}
                    className="flex-shrink-0 w-[85vw] max-w-[320px] snap-center"
                    style={{
                      animation: isVisible
                        ? `fadeInUp 0.8s ease-out ${index * 0.1}s both`
                        : "none",
                    }}
                  >
                    <div
                      className={`bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 h-full border border-white/50`}
                    >
                      {/* Step Header */}
                      <div className="flex items-center justify-between mb-6">
                        {/* Step Number - Enhanced */}
                        <div className="relative">
                          <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-yellow-500 text-white rounded-2xl flex items-center justify-center font-bold text-base shadow-lg">
                            {index + 1}
                          </div>
                          <div className="absolute -inset-1 bg-gradient-to-br from-amber-400 to-yellow-400 rounded-2xl opacity-20 transition-opacity duration-300"></div>
                        </div>

                        {/* Icon - Enhanced */}
                        <div
                          className={`w-12 h-12 bg-gradient-to-br ${step.gradient} backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/50 shadow-lg`}
                        >
                          <IconComponent className="w-6 h-6 text-slate-700" />
                        </div>
                      </div>

                      {/* Content */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-bold text-slate-900 leading-tight">
                          {step.title}
                        </h3>

                        <p className="text-slate-600 leading-relaxed text-sm">
                          {step.description}
                        </p>

                        {/* Features - Always show first two (no hover/expand) */}
                        <div className="mt-4 space-y-2">
                          {step.features
                            .slice(0, 2)
                            .map((feature, featureIndex) => (
                              <div
                                key={featureIndex}
                                className="text-xs text-slate-600 leading-relaxed"
                              >
                                {feature}
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mobile Scroll Indicator */}
            <div className="flex justify-center gap-2 mt-6">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className="w-2 h-2 rounded-full bg-slate-300 transition-all duration-300"
                  style={{
                    backgroundColor: index === 0 ? "#f59e0b" : "#cbd5e1",
                  }}
                ></div>
              ))}
            </div>

            {/* Mobile Helper Text */}
            <p className="text-center text-slate-500 text-sm mt-4">
              Swipe to explore our complete process
            </p>
          </div>
        </div>

        {/* Enhanced CTA Section */}
        <div
          className={`text-center transition-all duration-1000 delay-500 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-8 lg:p-12 relative overflow-hidden shadow-2xl">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M20 20c0-11.046-8.954-20-20-20v40c11.046 0 20-8.954 20-20z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}
              ></div>
            </div>

            <div className="relative z-10 max-w-4xl mx-auto">
              <h3 className="text-white text-3xl lg:text-5xl font-bold mb-6 leading-tight">
                Ready to Experience Our Process?
              </h3>
              <p className="text-white/90 text-lg lg:text-xl leading-relaxed mb-8 max-w-2xl mx-auto">
                Start with a free consultation and see why Toronto homeowners
                trust our proven approach to transform their spaces.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <button
                  className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-900 font-bold px-8 py-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 min-w-[200px]"
                  onClick={() => setIsLeadFormOpen(true)}
                >
                  Schedule Free Consultation
                </button>
                <button
                  className="bg-transparent border-2 border-white hover:bg-white hover:text-slate-900 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-300 min-w-[200px]"
                  onClick={() => {
                    const servicesSection = document.getElementById("services");
                    if (servicesSection) {
                      servicesSection.scrollIntoView({ behavior: "smooth" });
                    }
                  }}
                >
                  View Our Services
                </button>
              </div>
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
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  );
}
