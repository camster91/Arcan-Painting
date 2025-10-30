"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Calculator,
  DollarSign,
  Home,
  Building,
  Building2,
  Palette,
  CheckCircle2,
  AlertCircle,
  Star,
  Shield,
  Clock,
  ArrowRight,
} from "lucide-react";
import LeadFormPopup from "./LeadFormPopup"; // ADD

export default function PricingSection() {
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState("calculator");
  const [isLeadFormOpen, setIsLeadFormOpen] = useState(false); // ADD

  // Calculator state
  const [type, setType] = useState("interior");
  const [squareFeet, setSquareFeet] = useState(600);
  const [rooms, setRooms] = useState(3);
  const [quality, setQuality] = useState("standard");
  const [ceilings, setCeilings] = useState(false);
  const [trim, setTrim] = useState(true);
  const [coats, setCoats] = useState(2);
  const [error, setError] = useState(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 },
    );

    const section = document.getElementById("pricing");
    if (section) observer.observe(section);

    return () => observer.disconnect();
  }, []);

  const fmt = (n) => n.toLocaleString(undefined, { maximumFractionDigits: 0 });

  const estimate = useMemo(() => {
    setError(null);
    const sf = Number(squareFeet) || 0;
    const rm = Number(rooms) || 0;
    const ct = Number(coats) || 1;

    if (sf <= 0 || rm <= 0 || ct <= 0) {
      return { low: 0, high: 0 };
    }

    // Base rates (rough heuristics for quick ballpark)
    const baseRatePerSf = type === "interior" ? 2.3 : 3.2; // USD per sq ft
    const roomAdj = 1 + Math.min(Math.max((rm - 3) * 0.05, -0.15), 0.25); // +/- 15-25%
    const coatsAdj = 1 + (ct - 2) * 0.18; // each extra/less coat ~18%

    const qualityAdj =
      quality === "premium" ? 1.22 : quality === "deluxe" ? 1.38 : 1;
    const ceilingsAdj = ceilings ? 1.1 : 1; // +10%
    const trimAdj = trim ? 1.12 : 1; // +12%

    let base = sf * baseRatePerSf;
    let total = base * roomAdj * coatsAdj * qualityAdj * ceilingsAdj * trimAdj;

    // Exterior complexity buffer
    if (type === "exterior") {
      total *= 1.08; // ladders, weather windows, masking
    }

    const low = Math.max(250, total * 0.9);
    const high = total * 1.15;

    return { low: Math.round(low), high: Math.round(high) };
  }, [type, squareFeet, rooms, quality, ceilings, trim, coats]);

  const handleNumber = (setter) => (e) => {
    const v = e.target.value;
    if (v === "") {
      setter("");
      return;
    }
    const num = Number(v);
    if (Number.isNaN(num)) {
      setError("Please enter a valid number");
    } else {
      setter(Math.max(0, num));
    }
  };

  const pricingTiers = [
    {
      icon: Home,
      title: "Interior Rooms",
      subtitle: "Single room projects",
      priceRange: "$400 - $1,200",
      features: [
        "Up to 12x12 room",
        "Walls and trim",
        "Premium paint included",
        "Furniture protection",
        "1-2 day completion",
      ],
      popular: false,
    },
    {
      icon: Building,
      title: "Whole Home Interior",
      subtitle: "Complete interior makeover",
      priceRange: "$3,500 - $8,500",
      features: [
        "All rooms and hallways",
        "Ceilings available",
        "Color consultation",
        "Professional prep work",
        "3-7 day completion",
      ],
      popular: true,
    },
    {
      icon: Palette,
      title: "Exterior Painting",
      subtitle: "Full exterior refresh",
      priceRange: "$4,500 - $12,000",
      features: [
        "All exterior surfaces",
        "Power washing included",
        "Weather-resistant paint",
        "5-year warranty",
        "4-8 day completion",
      ],
      popular: false,
    },
  ];

  return (
    <section
      id="pricing"
      className="relative py-20 lg:py-32 overflow-hidden bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200"
    >
      {/* Enhanced Background Effects */}
      <div className="absolute inset-0">
        {/* Animated gradient orbs */}
        <div className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-r from-amber-400/10 to-yellow-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-gradient-to-r from-green-400/10 to-emerald-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>

        {/* Geometric pattern */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.2'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              backgroundSize: "60px 60px",
            }}
          ></div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Enhanced Section Header */}
        <div
          className={`text-center mb-16 lg:mb-20 transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-3 bg-white/70 backdrop-blur-md border border-slate-200 rounded-full px-6 py-3 mb-8 shadow-lg">
            <div className="bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full p-1.5">
              <DollarSign size={16} className="text-white" />
            </div>
            <span className="text-slate-700 text-sm font-medium">
              Transparent Pricing & Quick Estimates
            </span>
          </div>

          {/* Main Headline */}
          <h2 className="text-2xl md:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight mb-6">
            Fair, Honest Pricing You Can Trust
          </h2>

          {/* Subtitle */}
          <p className="text-xl lg:text-2xl text-slate-600 max-w-4xl mx-auto leading-relaxed mb-12">
            Get a
            <span className="text-amber-600 font-semibold">
              {" "}
              quick ballpark estimate
            </span>{" "}
            in 30 seconds, or explore our transparent pricing tiers below
          </p>

          {/* Tab Navigation */}
          <div className="inline-flex bg-white/80 backdrop-blur-md border border-slate-200 rounded-2xl p-2 shadow-lg">
            <button
              onClick={() => setActiveTab("calculator")}
              className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
                activeTab === "calculator"
                  ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-lg"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Calculator size={16} className="inline mr-2" />
              Quick Calculator
            </button>
            <button
              onClick={() => setActiveTab("pricing")}
              className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
                activeTab === "pricing"
                  ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-lg"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Star size={16} className="inline mr-2" />
              Pricing Tiers
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div
          className={`transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          {/* Quick Calculator Tab */}
          {activeTab === "calculator" && (
            <div className="space-y-8">
              {/* Calculator Card */}
              <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-white/20 shadow-2xl p-8 lg:p-12">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-amber-100 text-amber-700 text-lg font-semibold mb-6">
                    <Calculator size={20} />
                    Get Your Estimate
                  </div>
                  <h3 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
                    30-Second Ballpark Calculator
                  </h3>
                  <p className="text-lg lg:text-xl text-slate-600 max-w-2xl mx-auto">
                    This gives you a rough range to help you plan. We'll confirm
                    exact pricing after a quick walkthrough and color
                    consultation.
                  </p>
                </div>

                {/* Calculator Controls */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                  <div>
                    <label className="block text-lg font-semibold text-slate-700 mb-4">
                      Project Type
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setType("interior")}
                        className={`flex items-center justify-center gap-2 px-6 py-4 rounded-xl border-2 text-lg font-semibold transition-all duration-300 ${
                          type === "interior"
                            ? "border-amber-500 bg-amber-50 text-amber-700 shadow-lg scale-105"
                            : "border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400"
                        }`}
                      >
                        <Home size={20} /> Interior
                      </button>
                      <button
                        onClick={() => setType("exterior")}
                        className={`flex items-center justify-center gap-2 px-6 py-4 rounded-xl border-2 text-lg font-semibold transition-all duration-300 ${
                          type === "exterior"
                            ? "border-amber-500 bg-amber-50 text-amber-700 shadow-lg scale-105"
                            : "border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400"
                        }`}
                      >
                        <Building2 size={20} /> Exterior
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-lg font-semibold text-slate-700 mb-4">
                      Square Footage
                    </label>
                    <input
                      type="number"
                      min="0"
                      inputMode="numeric"
                      value={squareFeet}
                      onChange={handleNumber(setSquareFeet)}
                      className="w-full px-6 py-4 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-300 text-lg"
                      placeholder="e.g. 600"
                    />
                    <p className="text-sm text-slate-500 mt-2">
                      Total paintable area (estimate is fine)
                    </p>
                  </div>

                  <div>
                    <label className="block text-lg font-semibold text-slate-700 mb-4">
                      Number of Rooms
                    </label>
                    <input
                      type="number"
                      min="1"
                      inputMode="numeric"
                      value={rooms}
                      onChange={handleNumber(setRooms)}
                      className="w-full px-6 py-4 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-300 text-lg"
                      placeholder="e.g. 3"
                    />
                  </div>

                  <div>
                    <label className="block text-lg font-semibold text-slate-700 mb-4">
                      Paint Quality
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { key: "standard", label: "Standard" },
                        { key: "premium", label: "Premium" },
                        { key: "deluxe", label: "Deluxe" },
                      ].map((q) => (
                        <button
                          key={q.key}
                          onClick={() => setQuality(q.key)}
                          className={`px-4 py-3 rounded-lg border-2 text-lg font-semibold transition-all duration-300 ${
                            quality === q.key
                              ? "border-amber-500 bg-amber-50 text-amber-700 scale-105"
                              : "border-slate-300 text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          {q.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="lg:col-span-2">
                    <label className="block text-lg font-semibold text-slate-700 mb-4">
                      Extras
                    </label>
                    <div className="flex flex-wrap gap-6">
                      <label className="inline-flex items-center gap-3 text-lg font-medium text-slate-700">
                        <input
                          type="checkbox"
                          checked={ceilings}
                          onChange={(e) => setCeilings(e.target.checked)}
                          className="rounded border-slate-300 text-amber-500 focus:ring-amber-500 w-5 h-5"
                        />
                        Include ceilings
                      </label>
                      <label className="inline-flex items-center gap-3 text-lg font-medium text-slate-700">
                        <input
                          type="checkbox"
                          checked={trim}
                          onChange={(e) => setTrim(e.target.checked)}
                          className="rounded border-slate-300 text-amber-500 focus:ring-amber-500 w-5 h-5"
                        />
                        Include trim/doors
                      </label>
                      <label className="inline-flex items-center gap-3 text-lg font-medium text-slate-700">
                        Number of coats:
                        <select
                          value={coats}
                          onChange={(e) => setCoats(Number(e.target.value))}
                          className="px-4 py-2 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-lg"
                        >
                          <option value={1}>1</option>
                          <option value={2}>2</option>
                          <option value={3}>3</option>
                        </select>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="mb-6 flex items-center gap-2 text-red-600 text-lg font-medium bg-red-50 border border-red-200 rounded-lg p-4">
                    <AlertCircle size={20} /> {error}
                  </div>
                )}

                {/* Result */}
                <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-2xl p-8 lg:p-10">
                  <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                    <div className="text-center lg:text-left">
                      <div className="text-slate-600 text-lg font-medium mb-3">
                        Your Estimated Range
                      </div>
                      <div className="text-5xl lg:text-6xl font-bold text-slate-900 mb-3">
                        ${fmt(estimate.low)} – ${fmt(estimate.high)}
                      </div>
                      <div className="text-lg text-slate-500">
                        Includes prep work, materials, and complete cleanup
                      </div>
                    </div>
                    <button
                      className="w-full lg:w-auto px-10 py-5 rounded-xl font-bold text-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                      onClick={() => setIsLeadFormOpen(true)}
                    >
                      Get Exact Quote
                      <ArrowRight size={20} className="inline ml-2" />
                    </button>
                  </div>
                </div>

                <p className="text-sm text-slate-500 text-center mt-4">
                  This is a rough estimate for planning purposes only and not a
                  final bid.
                </p>
              </div>
            </div>
          )}

          {/* Pricing Tiers Tab */}
          {activeTab === "pricing" && (
            <div className="space-y-12">
              {/* Pricing Tiers Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {pricingTiers.map((tier, index) => {
                  const IconComponent = tier.icon;
                  return (
                    <div
                      key={index}
                      className={`relative bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-500 overflow-hidden group hover:scale-105 ${
                        tier.popular ? "ring-2 ring-amber-500 scale-105" : ""
                      }`}
                      style={{
                        animation: isVisible
                          ? `fadeInUp 0.8s ease-out ${index * 0.2}s both`
                          : "none",
                      }}
                    >
                      {tier.popular && (
                        <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-center py-3 text-sm font-bold">
                          <Star size={16} className="inline mr-2" />
                          Most Popular
                        </div>
                      )}

                      <div
                        className={`p-8 lg:p-10 ${tier.popular ? "pt-16" : ""}`}
                      >
                        {/* Icon */}
                        <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-yellow-100 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                          <IconComponent className="w-10 h-10 text-amber-600" />
                        </div>

                        {/* Title and Subtitle */}
                        <h3 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-2 text-center">
                          {tier.title}
                        </h3>
                        <p className="text-slate-600 text-center mb-6 font-medium">
                          {tier.subtitle}
                        </p>

                        {/* Price */}
                        <div className="text-center mb-8">
                          <div className="text-3xl lg:text-4xl font-bold text-amber-600 mb-2">
                            {tier.priceRange}
                          </div>
                          <div className="text-slate-500 text-sm font-medium">
                            Final price depends on size & complexity
                          </div>
                        </div>

                        {/* Features */}
                        <ul className="space-y-4 mb-8">
                          {tier.features.map((feature, featureIndex) => (
                            <li
                              key={featureIndex}
                              className="flex items-center gap-3"
                            >
                              <CheckCircle2
                                size={18}
                                className="text-amber-500 flex-shrink-0"
                              />
                              <span className="text-slate-700 font-medium">
                                {feature}
                              </span>
                            </li>
                          ))}
                        </ul>

                        {/* CTA Button */}
                        <button
                          className={`w-full py-4 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 ${
                            tier.popular
                              ? "bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white"
                              : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                          }`}
                          onClick={() => setIsLeadFormOpen(true)}
                        >
                          Get Exact Quote
                          <ArrowRight size={18} className="inline ml-2" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Additional Info Section */}
              <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-white/20 shadow-2xl p-8 lg:p-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="bg-gradient-to-br from-amber-100 to-yellow-100 rounded-xl p-3">
                        <AlertCircle className="w-6 h-6 text-amber-600" />
                      </div>
                      <h3 className="text-xl lg:text-2xl font-bold text-slate-900">
                        What Affects Pricing?
                      </h3>
                    </div>
                    <ul className="space-y-3 text-slate-700">
                      <li className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span>Square footage and ceiling height</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span>Surface preparation needed</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span>Paint quality and finish selected</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span>Number of colors and complexity</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span>Timeline and scheduling flexibility</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl p-3">
                        <Shield className="w-6 h-6 text-green-600" />
                      </div>
                      <h3 className="text-xl lg:text-2xl font-bold text-slate-900">
                        Always Included at No Extra Cost
                      </h3>
                    </div>
                    <ul className="space-y-3 text-slate-700">
                      <li className="flex items-start gap-3">
                        <CheckCircle2
                          size={18}
                          className="text-green-500 mt-0.5 flex-shrink-0"
                        />
                        <span>Free detailed estimate</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle2
                          size={18}
                          className="text-green-500 mt-0.5 flex-shrink-0"
                        />
                        <span>Color consultation</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle2
                          size={18}
                          className="text-green-500 mt-0.5 flex-shrink-0"
                        />
                        <span>Surface preparation</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle2
                          size={18}
                          className="text-green-500 mt-0.5 flex-shrink-0"
                        />
                        <span>Complete cleanup</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle2
                          size={18}
                          className="text-green-500 mt-0.5 flex-shrink-0"
                        />
                        <span>Satisfaction guarantee</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ADD: LeadFormPopup for this section */}
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
