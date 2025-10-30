import { Clock, Gift, ArrowRight, X } from "lucide-react";
import { useState, useEffect } from "react";

export default function SeasonalPromotionPopup() {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [hasShown, setHasShown] = useState(false);

  useEffect(() => {
    // Check if user has already seen and closed the popup in this session
    const hasClosedPopup = sessionStorage.getItem("promo-popup-closed");
    if (hasClosedPopup) return;

    const handleScroll = () => {
      if (hasShown) return;

      const scrollTop =
        window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      // Show popup when user scrolls halfway down the page
      const halfwayPoint = (documentHeight - windowHeight) / 2;

      if (scrollTop >= halfwayPoint) {
        setIsVisible(true);
        setHasShown(true);
        window.removeEventListener("scroll", handleScroll);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hasShown]);

  const closePopup = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsClosing(false);
    }, 300);
    // Remember that user closed popup for this session
    sessionStorage.setItem("promo-popup-closed", "true");
  };

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

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop - subtle and non-intrusive */}
      <div
        className={`fixed inset-0 bg-black/10 backdrop-blur-[1px] z-40 transition-opacity duration-300 ${isClosing ? "opacity-0" : "opacity-100"}`}
        onClick={closePopup}
      />

      {/* Popup Panel */}
      <div
        className={`fixed left-0 top-1/2 -translate-y-1/2 z-50 transition-all duration-500 ease-out ${
          isClosing
            ? "-translate-x-full opacity-0"
            : "translate-x-0 opacity-100"
        }`}
        role="dialog"
        aria-labelledby="promo-title"
        aria-modal="true"
      >
        <div className="bg-white rounded-r-2xl shadow-2xl border border-slate-200/50 overflow-hidden max-w-sm w-[320px] ml-4">
          {/* Header with close button */}
          <div className="flex items-center justify-between p-4 border-b border-slate-100">
            <div className="inline-flex items-center gap-2 bg-slate-100 rounded-full px-3 py-1">
              <Gift
                size={14}
                className={`${promotion.gradient.includes("emerald") ? "text-emerald-600" : promotion.gradient.includes("amber") ? "text-amber-600" : promotion.gradient.includes("orange") ? "text-orange-600" : "text-blue-600"}`}
              />
              <span className="text-xs font-medium uppercase tracking-wider text-slate-600">
                {promotion.season} Special
              </span>
            </div>
            <button
              onClick={closePopup}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Close promotion"
            >
              <X size={16} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Visual accent */}
            <div
              className={`w-12 h-12 bg-gradient-to-br ${promotion.gradient} rounded-xl flex items-center justify-center mb-4`}
            >
              <span className="text-2xl" aria-hidden="true">
                {promotion.icon}
              </span>
            </div>

            <h3
              id="promo-title"
              className="font-bold text-xl text-slate-900 mb-2"
            >
              {promotion.title}
            </h3>
            <p className="font-semibold text-lg text-slate-700 mb-4">
              {promotion.offer}
            </p>

            {/* Urgency */}
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
              <Clock size={14} />
              <span>{promotion.urgency}</span>
            </div>

            {/* CTA */}
            <button
              className={`w-full bg-gradient-to-r ${promotion.gradient} text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 hover:shadow-lg hover:scale-105 flex items-center justify-center gap-2`}
              onClick={() => {
                const contactSection = document.getElementById("contact");
                if (contactSection) {
                  contactSection.scrollIntoView({ behavior: "smooth" });
                }
                closePopup();
              }}
              aria-label="Claim seasonal offer"
            >
              Claim Offer
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
