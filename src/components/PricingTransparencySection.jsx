import { DollarSign, Home, Building, Palette } from "lucide-react";

export default function PricingTransparencySection() {
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
    <section id="pricing" className="py-20 bg-white">
      {/* added id for in-page nav */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <DollarSign className="w-6 h-6 text-amber-600" />
            <span className="text-amber-600 font-medium uppercase tracking-wide text-sm">
              Transparent Pricing
            </span>
          </div>
          <h2 className="text-4xl font-bold text-slate-900 mb-4">
            Fair, Honest Pricing You Can Trust
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            No hidden fees, no surprises. Here's what you can expect for
            different types of projects
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {pricingTiers.map((tier, index) => {
            const IconComponent = tier.icon;
            return (
              <div
                key={index}
                className={`relative bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden ${tier.popular ? "ring-2 ring-amber-500 transform scale-105" : ""}`}
              >
                {tier.popular && (
                  <div className="absolute top-0 left-0 right-0 bg-amber-500 text-white text-center py-2 text-sm font-semibold">
                    Most Popular
                  </div>
                )}

                <div className={`p-8 ${tier.popular ? "pt-16" : ""}`}>
                  <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <IconComponent className="w-8 h-8 text-amber-600" />
                  </div>

                  <h3 className="text-2xl font-bold text-slate-900 mb-2 text-center">
                    {tier.title}
                  </h3>

                  <p className="text-slate-600 text-center mb-6">
                    {tier.subtitle}
                  </p>

                  <div className="text-center mb-8">
                    <div className="text-3xl font-bold text-amber-600 mb-2">
                      {tier.priceRange}
                    </div>
                    <div className="text-slate-500 text-sm">
                      Final price depends on size & complexity
                    </div>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {tier.features.map((feature, featureIndex) => (
                      <li
                        key={featureIndex}
                        className="flex items-center space-x-3"
                      >
                        <div className="w-2 h-2 bg-amber-500 rounded-full flex-shrink-0"></div>
                        <span className="text-slate-600">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    className={`w-full py-3 rounded-lg font-semibold transition-all duration-300 ${
                      tier.popular
                        ? "bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-900 shadow-lg hover:shadow-xl"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                    }`}
                    onClick={() => {
                      const contactSection = document.getElementById("contact");
                      if (contactSection) {
                        contactSection.scrollIntoView({ behavior: "smooth" });
                      }
                    }}
                  >
                    Get Exact Quote
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Additional Pricing Info */}
        <div className="bg-slate-50 rounded-2xl p-8 mt-16">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold text-slate-900 mb-4">
                What Affects Pricing?
              </h3>
              <ul className="space-y-2 text-slate-600">
                <li>• Square footage and ceiling height</li>
                <li>• Surface preparation needed</li>
                <li>• Paint quality and finish selected</li>
                <li>• Number of colors and complexity</li>
                <li>• Timeline and scheduling flexibility</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-slate-900 mb-4">
                Always Included at No Extra Cost
              </h3>
              <ul className="space-y-2 text-slate-600">
                <li>• Free detailed estimate</li>
                <li>• Color consultation</li>
                <li>• Surface preparation</li>
                <li>• Complete cleanup</li>
                <li>• Satisfaction guarantee</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
