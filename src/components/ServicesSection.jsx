import { useState, useEffect } from "react";
import {
  Home,
  Building,
  Palette,
  Shield,
  Wallpaper,
  Star,
  Brush,
} from "lucide-react";
import { useTheme } from "@/utils/useTheme";
import LeadFormPopup from "./LeadFormPopup";

// ─── Reusable Service Card ────────────────────────────────────────────────────
function ServiceCard({ service, isFlipped, onQuote }) {
  if (service.isCTA) {
    return (
      <div className="relative h-full w-full rounded-3xl overflow-hidden">
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-500" />
        <div className="absolute inset-0 rounded-3xl bg-white/5" />
        <div className="absolute inset-0 rounded-3xl ring-1 ring-white/30" />
        <div className="absolute -bottom-10 -right-10 w-56 h-56 rounded-full blur-3xl opacity-40 bg-white/30" />
        <div className="absolute -top-8 -left-8 w-40 h-40 rounded-full blur-2xl opacity-40 bg-white/20" />
        <div className="relative z-10 h-full flex flex-col justify-between p-8">
          <div>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl shadow-xl mb-4 bg-white/20 backdrop-blur-sm">
              <service.icon size={30} className="text-white" />
            </div>
            <h3 className="text-3xl lg:text-4xl font-extrabold text-white leading-tight drop-shadow-sm">
              {service.title}
            </h3>
          </div>
          <button
            onClick={onQuote}
            className="w-full font-bold py-4 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl text-lg bg-white hover:bg-white/90 text-amber-700 hover:text-amber-800"
          >
            Discuss Your Project
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative h-full w-full"
      style={{ perspective: "1000px" }}
    >
      <div
        className="relative h-full w-full transition-transform duration-700"
        style={{
          transformStyle: "preserve-3d",
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* FRONT FACE */}
        <div
          className="absolute inset-0 transition-opacity duration-500"
          style={{
            backfaceVisibility: "hidden",
            opacity: isFlipped ? 0 : 1,
          }}
        >
          <div className="absolute inset-0">
            <img
              src={service.image}
              alt={service.title}
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
              width="600"
              height="400"
            />
            <div className={`absolute inset-0 bg-gradient-to-t ${service.gradient} via-slate-900/60 to-slate-900/90`} />
            <div className="absolute inset-0 bg-slate-900/40" />
          </div>
          <div className="relative z-10 h-full flex flex-col">
            <div className="p-6 lg:p-8">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-white to-white/90 backdrop-blur-sm rounded-2xl mb-5 shadow-xl">
                <service.icon size={26} className="text-amber-600" />
              </div>
              <div className="mb-3">
                <h3 className="text-2xl lg:text-3xl font-bold text-white mb-2">
                  {service.title}
                </h3>
                <p className="text-sm lg:text-base font-semibold text-amber-400 uppercase tracking-wider">
                  {service.subtitle}
                </p>
              </div>
            </div>
            <div className="flex-1 p-6 lg:p-8 pt-0">
              <p className="text-base lg:text-lg text-white/90 leading-relaxed">
                {service.description}
              </p>
            </div>
          </div>
        </div>

        {/* BACK FACE */}
        <div
          className="absolute inset-0 transition-opacity duration-500"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            opacity: isFlipped ? 1 : 0,
          }}
        >
          <div className="absolute inset-0">
            <img
              src={service.image}
              alt={service.title}
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
              width="600"
              height="400"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/70 to-slate-900/60" />
          </div>
          <div className="relative z-10 h-full flex flex-col p-6 lg:p-8">
            <div className="mb-5">
              <h3 className="text-2xl lg:text-3xl font-bold text-white mb-2">
                {service.title}
              </h3>
              <p className="text-sm lg:text-base font-semibold text-amber-400 uppercase tracking-wider">
                What's Included
              </p>
            </div>
            <div className="flex-1 mb-5">
              <ul className="space-y-3">
                {service.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-3 text-sm lg:text-base">
                    <span className="inline-block w-2 h-2 rounded-full bg-amber-400 mt-2 flex-shrink-0" />
                    <span className="text-white/90 leading-relaxed">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            <button
              onClick={onQuote}
              className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:-to-yellow-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl text-base lg:text-lg"
            >
              Discuss Your Project
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Mobile Carousel Card (no flip — simple tap) ──────────────────────────────
function ServiceCarouselCard({ service, onQuote }) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div
      className="relative overflow-hidden rounded-2xl cursor-pointer h-[420px]"
      onClick={() => !showDetails && setShowDetails(true)}
    >
      <img
        src={service.image}
        alt={service.title}
        className="absolute inset-0 w-full h-full object-cover"
        loading="lazy"
        decoding="async"
      />
      <div className={`absolute inset-0 bg-gradient-to-t ${service.gradient} via-slate-900/60 to-slate-900/90`} />
      <div className="absolute inset-0 bg-slate-900/40" />

      {!showDetails ? (
        <div className="relative z-10 h-full flex flex-col justify-end p-5">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-white/90 backdrop-blur-sm rounded-xl mb-3 shadow-lg">
            <service.icon size={22} className="text-amber-600" />
          </div>
          <h3 className="text-xl font-bold text-white mb-1">{service.title}</h3>
          <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
            {service.subtitle}
          </p>
          <p className="text-sm text-white/80 line-clamp-2 mb-3">{service.description}</p>
          <div className="flex gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); onQuote(); }}
              className="flex-1 bg-amber-400 hover:bg-amber-300 text-slate-900 font-semibold py-2.5 px-4 rounded-xl text-sm transition-colors"
            >
              Get Quote
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setShowDetails(true); }}
              className="flex-1 bg-white/20 hover:bg-white/30 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-colors backdrop-blur-sm border border-white/20"
            >
              Details
            </button>
          </div>
        </div>
      ) : (
        <div className="absolute inset-0 z-20 bg-slate-900/95 p-5 flex flex-col">
          <button
            onClick={(e) => { e.stopPropagation(); setShowDetails(false); }}
            className="self-end text-white/60 hover:text-white text-sm font-medium mb-3"
          >
            ✕ Close
          </button>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <service.icon size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{service.title}</h3>
              <p className="text-xs text-amber-400 uppercase tracking-wider">{service.subtitle}</p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto mb-4">
            <ul className="space-y-2">
              {service.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                  <span className="text-white/80">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onQuote(); }}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 px-6 rounded-xl text-sm transition-colors"
          >
            Discuss Your Project
          </button>
        </div>
      )}
    </div>
  );
}

export default function ServicesSection() {
  const [activeCard, setActiveCard] = useState(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [isVisible, setIsVisible] = useState(true);
  const [isLeadFormOpen, setIsLeadFormOpen] = useState(false);
  useTheme();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 },
    );

    const section = document.getElementById("services");
    if (section) observer.observe(section);

    return () => observer.disconnect();
  }, []);

  const services = [
    {
      icon: Home,
      title: "Interior Painting",
      subtitle: "Transform Living Spaces",
      description:
        "Tell us about the space and finish you have in mind.",
      features: [
        "Professional color consultation",
        "Premium paints & eco-friendly finishes",
        "Complete furniture protection",
        "Precision application & clean work",
      ],
      image:
        "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=600&h=400&fit=crop&q=80",
      gradient: "from-blue-500/20 to-purple-600/20",
    },
    {
      icon: Building,
      title: "Exterior Painting",
      subtitle: "Weather Protection",
      description:
        "Tell us about the exterior surfaces and project priorities.",
      features: [
        "Power washing & surface prep",
        "Professional surface repair & priming",
        "Weather-resistant protection coatings",
        "Project details reviewed with the team",
      ],
      image:
        "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop&q=80",
      gradient: "from-green-500/20 to-teal-600/20",
    },
    {
      icon: Palette,
      title: "Commercial Painting",
      subtitle: "Business Solutions",
      description:
        "Tell us about the commercial space and scheduling considerations.",
      features: [
        "Flexible after-hours scheduling",
        "Large-scale project expertise",
        "Commercial grade materials & tools",
        "Fast turnaround & minimal downtime",
      ],
      image:
        "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=600&h=400&fit=crop&q=80",
      gradient: "from-orange-500/20 to-red-600/20",
    },
    {
      icon: Wallpaper,
      title: "Wallpaper Services",
      subtitle: "High-End Wallpaper Installation",
      description:
        "Tell us about the wallcovering project and the details you want to discuss.",
      features: [
        "Luxury & designer wallpaper specialists",
        "Precise pattern matching & alignment",
        "Professional installation & safe removal",
        "Custom design consultation services",
      ],
      image:
        "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=600&h=400&fit=crop&q=80",
      gradient: "from-purple-500/20 to-pink-600/20",
    },
    {
      icon: Shield,
      title: "Specialty Finishes",
      subtitle: "Custom Artistry",
      description:
        "Tell us about the finish, surface, and project goals you have in mind.",
      features: [
        "Custom texture applications & techniques",
        "Decorative faux finishing artistry",
        "Industrial protective coating systems",
        "Specialized artistic expertise & consultation",
      ],
      image:
        "https://images.unsplash.com/photo-1541123437800-1bb1317badc2?w=600&h=400&fit=crop&q=80",
      gradient: "from-amber-500/20 to-yellow-600/20",
    },
    {
      icon: Star,
      title: "Ready to Discuss Your Space?",
      subtitle: "Share Your Project Details",
      // description removed per request
      features: [
        "Share the project scope and condition of the space",
        "Discuss questions about materials and timing",
        "Ask the team to review your project details",
        "Confirm next steps after the review",
      ],
      image:
        "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=600&h=400&fit=crop&q=80",
      gradient: "from-amber-400/40 to-yellow-500/40",
      isCTA: true,
    },
  ];

  return (
    <section
      id="services"
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
              <Brush size={18} className="text-white" />
            </div>
            <span className="text-white/90 text-base lg:text-lg font-medium">
              Complete Painting Solutions for Every Need
            </span>
          </div>

          {/* Main Headline */}
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-8">
            Discuss Your Painting Project
          </h2>

          {/* Subtitle */}
          <p className="text-2xl lg:text-3xl text-slate-300 max-w-4xl mx-auto leading-relaxed mb-12">
            From a single room to a larger space, tell us about the details
            that matter to you. We can review your priorities with
            <span className="text-amber-400 font-semibold">
              {" "}
              attention to detail
            </span>{" "}
            in mind and discuss the next step.
          </p>
        </div>

        {/* Enhanced Services Grid */}
        {/* Mobile: snap-scroll carousel */}
        <div className="lg:hidden mb-8 -mx-4 px-4">
          <div
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4"
            style={{
              WebkitOverflowScrolling: "touch",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            {services.map((service, index) => (
              <div
                key={index}
                className="flex-shrink-0 w-[85vw] snap-center"
                style={{ scrollSnapAlign: "center" }}
              >
                <ServiceCarouselCard
                  service={service}
                  index={index}
                  onQuote={() => setIsLeadFormOpen(true)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Desktop: grid layout */}
        <div className="hidden lg:grid grid-cols-2 xl:grid-cols-3 gap-8 mb-12">
          {services.map((service, index) => {
            const isFlipped = hoveredIndex === index || activeCard === index;
            return (
              <div
                key={index}
                className="group relative overflow-hidden rounded-3xl transition-all duration-700 cursor-pointer h-[360px]"
                style={{
                  animation: isVisible
                    ? `fadeInUp 0.8s ease-out ${index * 0.1}s both`
                    : "none",
                }}
                onMouseEnter={() => !service.isCTA && setHoveredIndex(index)}
                onMouseLeave={() => !service.isCTA && setHoveredIndex(null)}
                onClick={() => !service.isCTA && setActiveCard(isFlipped ? null : index)}
              >
                <ServiceCard
                  service={service}
                  index={index}
                  isVisible={isVisible}
                  isFlipped={isFlipped}
                  onQuote={() => setIsLeadFormOpen(true)}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Lead Form Popup */}
      <LeadFormPopup
        isOpen={isLeadFormOpen}
        onClose={() => setIsLeadFormOpen(false)}
      />

      {/* CSS Animations */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}
