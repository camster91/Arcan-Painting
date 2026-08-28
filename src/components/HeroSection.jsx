import { useState, useRef, lazy, Suspense, useEffect } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";
import { trackEvent } from "@/utils/analytics";

// LeadFormPopup is only shown on CTA click — lazy load to keep hero bundle lean
const LeadFormPopup = lazy(() => import("./LeadFormPopup"));

const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=1920&q=80",
  "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1920&q=80",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=80",
  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920&q=80",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1920&q=80",
];

export default function HeroSection() {
  const [isLeadFormOpen, setIsLeadFormOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const shouldReduceMotion = useReducedMotion();
  const containerRef = useRef(null);

  // Auto-advance slideshow
  useEffect(() => {
    if (shouldReduceMotion) return;
    const interval = setInterval(() => {
      setCurrentSlide(s => (s + 1) % HERO_IMAGES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [shouldReduceMotion]);

  // Parallax scroll effect on background
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);

  // Theme colors
  const themeColors = {
    bg: "#0f172a",
    text: "#ffffff",
    textSecondary: "#cbd5e1",
    textMuted: "#64748b",
  };

  return (
    <section
      id="home"
      ref={containerRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{ backgroundColor: themeColors.bg }}
    >
      {/* Background Slideshow with parallax — <img> for better mobile support */}
      <motion.div
        className="absolute inset-0 z-0"
        style={shouldReduceMotion ? {} : { y: bgY, willChange: "transform" }}
      >
          <picture key={HERO_IMAGES[currentSlide]} style={{
            position: "absolute",
            inset: 0,
            opacity: 1,
          }}>
            <source
              media="(min-width: 768px)"
              srcSet={`${HERO_IMAGES[currentSlide].replace("w=1920","w=1600")} 1600w, ${HERO_IMAGES[currentSlide].replace("w=1920","w=1280")} 1280w, ${HERO_IMAGES[currentSlide].replace("w=1920","w=768")} 768w`}
              sizes="100vw"
            />
            <source
              media="(max-width: 767px)"
              srcSet={`${HERO_IMAGES[currentSlide].replace("w=1920","w=900")} 900w, ${HERO_IMAGES[currentSlide].replace("w=1920","w=600")} 600w`}
              sizes="100vw"
            />
            <img
              src={HERO_IMAGES[currentSlide].replace("w=1920","w=900")}
              alt=""
              aria-hidden="true"
              loading={currentSlide === 0 ? "eager" : "lazy"}
              fetchpriority={currentSlide === 0 ? "high" : "low"}
              decoding="async"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "center",
                display: "block",
              }}
            />
          </picture>
        {/* Gradient Overlays */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to right, ${themeColors.bg}e6, ${themeColors.bg}cc, ${themeColors.bg}99)`,
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to top, ${themeColors.bg}cc, transparent, transparent)`,
          }}
        />
      </motion.div>

      {/* Dot Indicators */}
      <div
        className="absolute left-1/2 -translate-x-1/2 z-20 flex items-center gap-2"
        style={{ bottom: "4.5rem" }}
      >
        {HERO_IMAGES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentSlide(i)}
            aria-label={`Go to slide ${i + 1}`}
            className="transition-all duration-300 rounded-full flex items-center justify-center"
            style={{
              width: "44px",
              height: "44px",
              backgroundColor: "transparent",
              border: "none",
              padding: 0,
              cursor: "pointer",
            }}
          ><span aria-hidden="true" className="block rounded-full" style={{ width: i === currentSlide ? "24px" : "8px", height: "8px", backgroundColor: i === currentSlide ? "#fbbf24" : "rgba(255,255,255,0.4)" }} /></button>
        ))}
      </div>

      {/* Content Container */}
      <div className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Column */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 backdrop-blur-sm border px-4 py-2 rounded-full text-sm font-medium mb-6"
              style={{
                backgroundColor: "#fbbf2433",
                borderColor: "#fbbf2466",
                color: "#fbbf24",
              }}
            >
              <div
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: "#fbbf24" }}
              />
              Project conversations start here
            </div>

            {/* Main Headline */}
            <h1
              className="font-bold leading-[1.1] mb-6"
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
                  backgroundImage: "linear-gradient(to right, #fbbf24, #fde047)",
                }}
              >
                Professional Painting
              </span>
            </h1>

            {/* Description */}
            <p
              className="text-lg leading-relaxed mb-8 max-w-xl mx-auto lg:mx-0"
              style={{ color: themeColors.textSecondary }}
            >
              Tell us about your space, priorities, and project details. A team
              member can review the information with you.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              {/* Primary CTA */}
              <div className="flex flex-col items-center sm:items-start gap-1 w-full sm:w-auto">
                <motion.button
                  className="btn-primary w-full sm:w-auto font-semibold text-lg rounded-xl shadow-xl relative overflow-hidden"
                  style={{
                    background: "linear-gradient(135deg, #fbbf24 0%, #fde047 50%, #fbbf24 100%)",
                    backgroundSize: "200% 200%",
                    color: "#0f172a",
                    boxShadow: "0 10px 40px rgba(251, 191, 36, 0.35)",
                  }}
                  whileHover={
                    shouldReduceMotion
                      ? {}
                      : {
                          scale: 1.05,
                          boxShadow: "0 15px 50px rgba(251, 191, 36, 0.55)",
                          backgroundPosition: "right center",
                        }
                  }
                  whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => {
                    trackEvent("cta_click", {
                      event_category: "Hero",
                       event_label: "Discuss Your Project",
                      value: 1,
                    });
                    setIsLeadFormOpen(true);
                  }}
                >
                   Discuss Your Project
                </motion.button>
                <span
                  className="text-xs font-medium"
                  style={{ color: "#fbbf2499" }}
                >
                   Share your project details
                </span>
              </div>

              <motion.button
                className="btn-primary w-full sm:w-auto font-semibold text-lg rounded-xl border transition-colors"
                style={{
                  backgroundColor: "rgba(255,255,255,0.1)",
                  color: themeColors.text,
                  borderColor: "rgba(255,255,255,0.2)",
                }}
                whileHover={
                  shouldReduceMotion
                    ? {}
                    : {
                        backgroundColor: "rgba(255,255,255,0.18)",
                        borderColor: "rgba(255,255,255,0.35)",
                      }
                }
                whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}
                onClick={() => {
                  const portfolioSection = document.getElementById("portfolio");
                  if (portfolioSection) {
                    portfolioSection.scrollIntoView({ behavior: "smooth" });
                  }
                }}
              >
                View Our Work
              </motion.button>
            </div>

            {/* Keep the primary conversion path factual until client proof
                points have been verified for publication. */}
            <div
              className="mt-10 pt-8 border-t"
              style={{ borderColor: "rgba(255,255,255,0.1)" }}
            >
              <p
                className="text-sm sm:text-base"
                style={{ color: themeColors.textSecondary }}
              >
                Tell us about your space and we&apos;ll help you plan the next step.
              </p>
            </div>
          </div>

          {/* Right Column - Visual with Floating Bubbles */}
          <div className="hidden lg:block">
            {/* Image Card */}
            <div
              className="relative rounded-3xl overflow-hidden border shadow-2xl"
              style={{
                borderColor: "rgba(255,255,255,0.2)",
                backgroundColor: "rgba(255,255,255,0.05)",
              }}
            >
              <picture>
                <source
                  type="image/webp"
                  srcSet="https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=600&q=80&fm=webp 600w, https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=1200&q=80&fm=webp 1200w, https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=1920&q=80&fm=webp 1920w"
                  sizes="(max-width: 640px) 600px, (max-width: 1280px) 1200px, 1920px"
                />
                <source
                  type="image/jpeg"
                  srcSet="https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=600&q=80 600w, https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=1200&q=80 1200w, https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=1920&q=80 1920w"
                  sizes="(max-width: 640px) 600px, (max-width: 1280px) 1200px, 1920px"
                />
                <img
                  src="https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=1200&q=80"
                  alt="Professional painters working on a bright interior wall"
                  className="w-full h-[520px] object-cover"
                  width="800"
                  height="520"
                  loading="lazy"
                  fetchpriority="low"
                  decoding="async"
                />
              </picture>

              {/* Floating Bubbles */}
              <div className="absolute inset-0 pointer-events-none">
                {[
                   { label: "Project planning", top: 24, left: 24, delay: 0 },
                   { label: "Your priorities", top: "40%", right: 24, delay: 0.3 },
                   { label: "Next steps", bottom: 24, left: 28, delay: 0.6 },
                ].map(({ label, delay, ...pos }) => (
                  <motion.div
                    key={label}
                    className="pointer-events-auto backdrop-blur-lg rounded-2xl shadow-xl border ring-1 px-4 py-3 flex items-center gap-3 max-w-[280px] absolute"
                    style={{
                      ...pos,
                      backgroundColor: "rgba(15, 23, 42, 0.75)",
                      borderColor: "rgba(251, 191, 36, 0.4)",
                      color: themeColors.text,
                      willChange: "transform",
                    }}
                    animate={
                      shouldReduceMotion
                        ? {}
                        : {
                            y: [0, -10, 0],
                            transition: {
                              duration: 4 + delay,
                              delay,
                              repeat: Infinity,
                              ease: "easeInOut",
                            },
                          }
                    }
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: "#fbbf24" }}
                    >
                      <span className="text-sm font-bold" style={{ color: "#0f172a" }}>✓</span>
                    </div>
                    <h4 className="font-semibold leading-tight">{label}</h4>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <div
          className="flex flex-col items-center gap-2"
          style={{ color: `${themeColors.textMuted}99` }}
        >
          <span className="text-xs font-medium">Scroll to explore</span>
          <div
            className="w-6 h-10 border-2 rounded-full flex justify-center"
            style={{ borderColor: `${themeColors.textMuted}66` }}
          >
            <motion.div
              className="w-1 h-3 rounded-full mt-2"
              style={{ backgroundColor: `${themeColors.textMuted}99` }}
              animate={shouldReduceMotion ? {} : { y: [0, 6, 0] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        </div>
      </div>

      {/* Lead Form Popup - lazy loaded, only rendered when open */}
      {isLeadFormOpen && (
        <Suspense fallback={null}>
          <LeadFormPopup
            isOpen={isLeadFormOpen}
            onClose={() => setIsLeadFormOpen(false)}
          />
        </Suspense>
      )}
    </section>
  );
}
