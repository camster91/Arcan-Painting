import { Shield, CheckCircle, RefreshCw, Phone } from "lucide-react";
import { useState } from "react";
import LeadFormPopup from "./LeadFormPopup";

export default function GuaranteeSection() {
  const [isLeadFormOpen, setIsLeadFormOpen] = useState(false);
  const guarantees = [
    {
      icon: CheckCircle,
      title: "100% Satisfaction Guarantee",
      description:
        "If you're not completely satisfied with our work, we'll make it right at no additional cost",
      badge: "No Questions Asked",
    },
    {
      icon: Shield,
      title: "5-Year Warranty",
      description:
        "All exterior work includes our comprehensive warranty against peeling, cracking, or fading",
      badge: "Fully Covered",
    },
    {
      icon: RefreshCw,
      title: "Free Touch-Up Service",
      description:
        "We'll return for any minor touch-ups within the first year at no charge",
      badge: "First Year Free",
    },
    {
      icon: Phone,
      title: "24/7 Emergency Response",
      description:
        "Storm damage or urgent repairs? We're available for emergency painting needs",
      badge: "Always Available",
    },
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">
            Your Investment is Protected
          </h2>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            We stand behind every brush stroke with industry-leading guarantees
            and warranties
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {guarantees.map((guarantee, index) => {
            const IconComponent = guarantee.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-xl p-8 text-center hover:transform hover:scale-105 transition-all duration-300 shadow-xl"
              >
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <IconComponent className="w-8 h-8 text-amber-600" />
                </div>

                <div className="mb-4">
                  <span className="bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                    {guarantee.badge}
                  </span>
                </div>

                <h3 className="text-xl font-semibold text-slate-900 mb-4">
                  {guarantee.title}
                </h3>

                <p className="text-slate-600 leading-relaxed">
                  {guarantee.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Risk Reversal CTA */}
        <div className="bg-white rounded-2xl p-8 mt-16 text-center">
          <h3 className="text-2xl font-bold text-slate-900 mb-4">
            Still Have Concerns?
          </h3>
          <p className="text-slate-600 mb-6 max-w-2xl mx-auto">
            With our comprehensive guarantees, you have nothing to lose and a
            beautiful space to gain. Let's discuss your project risk-free.
          </p>
          <button
            className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-900 font-semibold px-8 py-4 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
            onClick={() => setIsLeadFormOpen(true)}
          >
            Get Your Risk-Free Quote
          </button>
        </div>
      </div>

      <LeadFormPopup
        isOpen={isLeadFormOpen}
        onClose={() => setIsLeadFormOpen(false)}
      />
    </section>
  );
}
