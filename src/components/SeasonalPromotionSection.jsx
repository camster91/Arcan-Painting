import { Clock, Gift, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";

export default function SeasonalPromotionSection() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 },
    );

    const section = document.getElementById("promotion");
    if (section) observer.observe(section);

    return () => observer.disconnect();
  }, []);

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth(); // 0-11
  const currentYear = currentDate.getFullYear();

  // Determine season and promotion
  const getSeasonalPromotion = () => {
    // Spring (March-May): months 2-4
    if (currentMonth >= 2 && currentMonth <= 4) {
      return {
        season: "Spring",
        title: "Spring Special",
        offer: "15% off exterior painting",
        urgency: "Book by May 31st",
        gradient: "from-emerald-500 to-green-600",
        icon: "🌸",
      };
    }
    // Summer (June-August): months 5-7
    else if (currentMonth >= 5 && currentMonth <= 7) {
      return {
        season: "Summer",
        title: "Summer Deal",
        offer: "Free consultation + 10% off",
        urgency: "Limited summer slots",
        gradient: "from-amber-500 to-yellow-500",
        icon: "☀️",
      };
    }
    // Fall (September-November): months 8-10
    else if (currentMonth >= 8 && currentMonth <= 10) {
      return {
        season: "Fall",
        title: "Pre-Winter Special",
        offer: "12% off + free touch-up warranty",
        urgency: "Before winter hits",
        gradient: "from-orange-500 to-red-500",
        icon: "🍂",
      };
    }
    // Winter (December-February): months 11, 0, 1
    else {
      return {
        season: "Winter",
        title: "Interior Special",
        offer: "20% off interior painting",
        urgency: `Plan for spring ${currentYear + 1}`,
        gradient: "from-blue-500 to-indigo-600",
        icon: "❄️",
      };
    }
  };

  const promotion = getSeasonalPromotion();

  return (
    <section
      id="promotion"
      className="py-8 lg:py-12"
      style={{
        fontFamily:
          'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={`bg-white rounded-2xl shadow-lg border border-slate-200/50 overflow-hidden transition-all duration-700 hover:shadow-xl hover:scale-[1.02] ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          role="region"
          aria-labelledby="promotion-title"
        >
          {/* Mobile: Single compact card layout */}
          <div className="lg:hidden">
            <div
              className={`bg-gradient-to-r ${promotion.gradient} p-7 text-white relative overflow-hidden`}
            >
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-10">
                <div
                  className="absolute top-0 right-0 text-7xl transform rotate-12 select-none"
                  aria-hidden
                >
                  {promotion.icon}
                </div>
              </div>

              <div className="relative z-10">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5 mb-4">
                  <Gift size={12} className="text-white" />
                  <span className="text-xs font-medium uppercase tracking-wider">
                    {promotion.season} Offer
                  </span>
                </div>

                {/* Main content */}
                <h3 id="promotion-title" className="font-bold text-2xl mb-2">
                  {promotion.title}
                </h3>
                <p className="font-semibold text-xl mb-4">{promotion.offer}</p>

                {/* Urgency */}
                <div className="flex items-center gap-2 text-sm text-white/90 mb-5">
                  <Clock size={14} />
                  <span>{promotion.urgency}</span>
                </div>

                {/* CTA */}
                <button
                  className="w-full bg-white text-slate-900 font-semibold py-3 px-4 rounded-xl text-base transition-all duration-300 hover:bg-slate-100 flex items-center justify-center gap-2"
                  onClick={() => {
                    const contactSection = document.getElementById("contact");
                    if (contactSection) {
                      contactSection.scrollIntoView({ behavior: "smooth" });
                    }
                  }}
                  aria-label="Claim seasonal offer"
                >
                  Claim Offer
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Desktop: Horizontal layout */}
          <div className="hidden lg:block">
            <div className="flex items-stretch">
              {/* Left: Visual */}
              <div
                className={`bg-gradient-to-br ${promotion.gradient} text-white flex-shrink-0 w-64 xl:w-72 relative overflow-hidden flex items-center justify-center`}
              >
                {/* Background icon */}
                <div className="absolute inset-0 opacity-10" aria-hidden>
                  <div className="absolute -top-6 -right-4 text-8xl rotate-12 select-none">
                    {promotion.icon}
                  </div>
                </div>
                <div className="relative z-10 text-center py-10">
                  <div className="text-5xl mb-2" aria-hidden>
                    {promotion.icon}
                  </div>
                  <div className="text-sm font-medium">
                    {promotion.season} {currentYear}
                  </div>
                </div>
              </div>

              {/* Right: Content */}
              <div className="flex-1 p-8">
                <div className="flex items-start justify-between gap-6 flex-wrap">
                  <div className="flex-1 min-w-[260px]">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 bg-slate-100 rounded-full px-3 py-1 mb-4">
                      <Gift
                        size={14}
                        className={`${promotion.gradient.includes("emerald") ? "text-emerald-600" : promotion.gradient.includes("amber") ? "text-amber-600" : promotion.gradient.includes("orange") ? "text-orange-600" : "text-blue-600"}`}
                      />
                      <span className="text-xs font-medium uppercase tracking-wider text-slate-600">
                        {promotion.season} Special
                      </span>
                    </div>

                    <h3 className="font-bold text-3xl text-slate-900 mb-2">
                      {promotion.title}
                    </h3>
                    <p className="font-semibold text-xl text-slate-700 mb-4">
                      {promotion.offer}
                    </p>

                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Clock size={14} />
                      <span>{promotion.urgency}</span>
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="self-center">
                    <button
                      className={`min-w-[180px] bg-gradient-to-r ${promotion.gradient} text-white font-semibold px-6 py-3 rounded-xl transition-all duration-300 hover:shadow-lg hover:scale-105 flex items-center justify-center gap-2`}
                      onClick={() => {
                        const contactSection =
                          document.getElementById("contact");
                        if (contactSection) {
                          contactSection.scrollIntoView({ behavior: "smooth" });
                        }
                      }}
                      aria-label="Claim seasonal offer"
                    >
                      Claim Offer
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
