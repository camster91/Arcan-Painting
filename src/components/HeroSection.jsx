import { useState, useEffect } from "react";
import LeadFormPopup from "./LeadFormPopup";

export default function HeroSection() {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeadFormOpen, setIsLeadFormOpen] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Always use dark mode colors
  const themeColors = {
    bg: "#0f172a",
    text: "#ffffff",
    textSecondary: "#cbd5e1",
    textMuted: "#64748b",
  };

  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center justify-center overflow-hidden transition-colors duration-300"
      style={{
        backgroundColor: themeColors.bg,
      }}
    >
      {/* Background Image */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage:
            "url('https://raw.createusercontent.com/bf59fc7f-c2f3-4eee-adaa-a7482b62994f/')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Gradient Overlay - always dark mode */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to right, ${themeColors.bg}e6, ${themeColors.bg}cc, ${themeColors.bg}99)`,
          }}
        ></div>
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to top, ${themeColors.bg}cc, transparent, transparent)`,
          }}
        ></div>
      </div>

      {/* Content Container */}
      <div className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Column - Main Content */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <div
              className={`inline-flex items-center gap-2 backdrop-blur-sm border px-4 py-2 rounded-full text-sm font-medium mb-6 transform transition-all duration-1000 delay-200 ${
                isVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-8 opacity-0"
              }`}
              style={{
                backgroundColor: "#fbbf2433",
                borderColor: "#fbbf2466",
                color: "#fbbf24",
              }}
            >
              <div
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: "#fbbf24" }}
              ></div>
              Toronto's Trusted Painting Experts
            </div>

            {/* Main Headline */}
            <h1
              className={`font-bold leading-[1.1] mb-6 transform transition-all duration-1000 delay-400 ${
                isVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-8 opacity-0"
              }`}
              style={{
                fontSize: "clamp(32px, 6vw, 72px)",
                letterSpacing: "-0.02em",
                color: themeColors.text,
              }}
            >
              Transform Your Space with{" "}
              <span
                className="bg-gradient-to-r bg-clip-text text-transparent"
                style={{
                  backgroundImage:
                    "linear-gradient(to right, #fbbf24, #fde047)",
                }}
              >
                Professional Painting
              </span>
            </h1>

            {/* Description */}
            <p
              className={`text-lg leading-relaxed mb-8 max-w-xl mx-auto lg:mx-0 transform transition-all duration-1000 delay-600 ${
                isVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-8 opacity-0"
              }`}
              style={{ color: themeColors.textSecondary }}
            >
              From residential homes to commercial spaces across the GTA. Expert
              craftsmanship, premium materials, and guaranteed satisfaction on
              every project.
            </p>

            {/* CTA Buttons */}
            <div
              className={`flex flex-col sm:flex-row gap-4 justify-center lg:justify-start transform transition-all duration-1000 delay-800 ${
                isVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-8 opacity-0"
              }`}
            >
              <button
                className="font-semibold text-lg px-8 py-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-xl"
                style={{
                  background: "linear-gradient(to right, #fbbf24, #fde047)",
                  color: "#0f172a",
                  boxShadow: "0 10px 40px rgba(251, 191, 36, 0.3)",
                }}
                onClick={() => setIsLeadFormOpen(true)}
              >
                Get Free Estimate
              </button>

              <button
                className="font-semibold text-lg px-8 py-4 rounded-xl border transition-all duration-300"
                style={{
                  backgroundColor: "rgba(255,255,255,0.1)",
                  color: themeColors.text,
                  borderColor: "rgba(255,255,255,0.2)",
                }}
                onClick={() => {
                  const portfolioSection = document.getElementById("portfolio");
                  if (portfolioSection) {
                    portfolioSection.scrollIntoView({ behavior: "smooth" });
                  }
                }}
              >
                View Our Work
              </button>
            </div>

            {/* Trust Indicators */}
            <div
              className={`flex flex-wrap items-center justify-center lg:justify-start gap-6 mt-8 pt-8 border-t transform transition-all duration-1000 delay-1000 ${
                isVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-8 opacity-0"
              }`}
              style={{
                borderColor: "rgba(255,255,255,0.1)",
              }}
            >
              <div
                className="flex items-center gap-2"
                style={{ color: themeColors.textSecondary }}
              >
                <div style={{ color: "#fbbf24" }}>★★★★★</div>
                <span className="text-sm">500+ Happy Clients</span>
              </div>
              <div
                className="text-sm"
                style={{ color: themeColors.textSecondary }}
              >
                ✓ Fully Insured & Licensed
              </div>
              <div
                className="text-sm"
                style={{ color: themeColors.textSecondary }}
              >
                ✓ 2-Year Warranty
              </div>
            </div>
          </div>

          {/* Right Column - Visual with Floating Bubbles */}
          <div
            className={`hidden lg:block transform transition-all duration-1000 delay-1200 ${
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-8 opacity-0"
            }`}
          >
            {/* Image Card */}
            <div
              className="relative rounded-3xl overflow-hidden border shadow-2xl"
              style={{
                borderColor: "rgba(255,255,255,0.2)",
                backgroundColor: "rgba(255,255,255,0.05)",
              }}
            >
              <img
                src="https://ucarecdn.com/8549198e-0903-4f02-a80c-424ffc8e2dc9/-/format/auto/"
                alt="Professional painters working on a bright interior wall"
                className="w-full h-[520px] object-cover"
              />

              {/* Floating Bubbles Container */}
              <div className="absolute inset-0 pointer-events-none">
                {/* Bubble 1 - Top Left */}
                <div
                  className="pointer-events-auto backdrop-blur-lg rounded-2xl shadow-xl border ring-1 px-4 py-3 flex items-center gap-3 max-w-[280px] animate-float"
                  style={{
                    top: 24,
                    left: 24,
                    position: "absolute",
                    animationDuration: "6s",
                    animationDelay: "0s",
                    backgroundColor: "rgba(255,255,255,0.15)",
                    borderColor: "rgba(255,255,255,0.2)",
                    color: themeColors.text,
                  }}
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "#fbbf24" }}
                  >
                    <span
                      className="text-sm font-bold"
                      style={{ color: "#0f172a" }}
                    >
                      ✓
                    </span>
                  </div>
                  <h4 className="font-semibold leading-tight">
                    Fast & Reliable
                  </h4>
                </div>

                {/* Bubble 2 - Middle Right */}
                <div
                  className="pointer-events-auto backdrop-blur-lg rounded-2xl shadow-xl border ring-1 px-4 py-3 flex items-center gap-3 max-w-[280px] animate-float"
                  style={{
                    top: "40%",
                    right: 24,
                    position: "absolute",
                    transform: "translateY(-50%)",
                    animationDuration: "7s",
                    animationDelay: "0.3s",
                    backgroundColor: "rgba(255,255,255,0.15)",
                    borderColor: "rgba(255,255,255,0.2)",
                    color: themeColors.text,
                  }}
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "#fbbf24" }}
                  >
                    <span
                      className="text-sm font-bold"
                      style={{ color: "#0f172a" }}
                    >
                      ✓
                    </span>
                  </div>
                  <h4 className="font-semibold leading-tight">
                    Premium Quality
                  </h4>
                </div>

                {/* Bubble 3 - Bottom Left */}
                <div
                  className="pointer-events-auto backdrop-blur-lg rounded-2xl shadow-xl border ring-1 px-4 py-3 flex items-center gap-3 max-w-[280px] animate-float"
                  style={{
                    bottom: 24,
                    left: 28,
                    position: "absolute",
                    animationDuration: "8s",
                    animationDelay: "0.6s",
                    backgroundColor: "rgba(255,255,255,0.15)",
                    borderColor: "rgba(255,255,255,0.2)",
                    color: themeColors.text,
                  }}
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "#fbbf24" }}
                  >
                    <span
                      className="text-sm font-bold"
                      style={{ color: "#0f172a" }}
                    >
                      ✓
                    </span>
                  </div>
                  <h4 className="font-semibold leading-tight">Clean & Tidy</h4>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div
        className={`absolute bottom-8 left-1/2 transform -translate-x-1/2 transition-all duration-1000 delay-1400 ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
        }`}
      >
        <div
          className="flex flex-col items-center gap-2"
          style={{ color: `${themeColors.textMuted}99` }}
        >
          <span className="text-xs font-medium">Scroll to explore</span>
          <div
            className="w-6 h-10 border-2 rounded-full flex justify-center"
            style={{ borderColor: `${themeColors.textMuted}66` }}
          >
            <div
              className="w-1 h-3 rounded-full mt-2 animate-bounce"
              style={{ backgroundColor: `${themeColors.textMuted}99` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Lead Form Popup */}
      <LeadFormPopup
        isOpen={isLeadFormOpen}
        onClose={() => setIsLeadFormOpen(false)}
      />

      {/* CSS Animations */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .animate-shimmer {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }
      `}</style>
    </section>
  );
}
