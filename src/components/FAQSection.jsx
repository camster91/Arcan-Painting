import { useState, useEffect } from "react";
import {
  ChevronDown,
  ChevronUp,
  HelpCircle,
  MessageCircle,
} from "lucide-react";
import LeadFormPopup from "./LeadFormPopup"; // ADD

export default function FAQSection() {
  const [openFAQ, setOpenFAQ] = useState(null);
  const [isVisible, setIsVisible] = useState(true);
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

    const section = document.getElementById("faq");
    if (section) observer.observe(section);

    return () => observer.disconnect();
  }, []);

  const faqs = [
    {
      question: "How long does a typical painting project take?",
      answer:
        "Timing depends on the scope of work, the condition of the space, material choices, and site conditions. Share the details of your project and the team can discuss a suitable plan with you.",
    },
    {
      question: "What happens if it rains during exterior painting?",
      answer:
        "Exterior work depends on safe, suitable site and weather conditions. The team can explain how weather may affect the plan for your particular project.",
    },
    {
      question: "Do you help with color selection?",
      answer:
        "Let the team know what you have in mind for your space. They can discuss colour options and the next steps for your project.",
    },
    {
      question: "How do you protect my furniture and floors?",
      answer:
        "Discuss the space, contents, and any concerns when you request your project. The team can outline the preparation and protection plan before work begins.",
    },
    {
      question: "What type of paint do you use?",
      answer:
        "Suitable materials depend on the surface, finish, and project requirements. The team can discuss options with you after learning more about the work.",
    },
    {
      question: "How do I request an estimate?",
      answer:
        "Use the contact form to share your project details. A team member can review the request and follow up about the information needed for an estimate.",
    },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answer,
      },
    })),
  };

  return (
    <section
      id="faq"
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

      <div className="relative z-10 max-w-4xl mx-auto px-6">
        {/* Enhanced Section Header */}
        <div
          className={`text-center mb-16 transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-6 py-3 mb-8">
            <div className="bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full p-1.5">
              <HelpCircle size={18} className="text-white" />
            </div>
            <span className="text-white/90 text-base lg:text-lg font-medium">
              Everything You Need to Know
            </span>
          </div>

          {/* Main Headline */}
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
            Frequently Asked Questions
          </h2>

          {/* Subtitle */}
          <p className="text-xl lg:text-2xl text-slate-300 leading-relaxed">
            Get answers to common questions about our painting services
          </p>
        </div>

        {/* Enhanced FAQ Cards */}
        <div className="space-y-6">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className={`group transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
              style={{
                animationDelay: `${index * 0.1}s`,
              }}
            >
              <div className="relative backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl overflow-hidden hover:bg-white/15 transition-all duration-300 hover:border-amber-400/30">
                <button
                  className="w-full px-8 py-6 text-left flex items-center justify-between group-hover:bg-white/5 transition-colors duration-200"
                  onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                  aria-expanded={openFAQ === index}
                  aria-controls={`faq-answer-${index}`}
                >
                  <span className="font-semibold text-white text-lg lg:text-xl pr-8 leading-relaxed">
                    {faq.question}
                  </span>
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                    {openFAQ === index ? (
                      <ChevronUp className="w-5 h-5 text-white" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-white" />
                    )}
                  </div>
                </button>

                {openFAQ === index && (
                  <div id={`faq-answer-${index}`} className="px-8 pb-6">
                    <div className="pt-4 border-t border-white/10">
                      <p className="text-slate-300 leading-relaxed text-base lg:text-lg">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Enhanced CTA */}
        <div
          className={`text-center mt-16 transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          style={{ animationDelay: "0.8s" }}
        >
          <div className="relative backdrop-blur-md bg-white/10 border border-white/20 rounded-3xl p-8 lg:p-12">
            {/* Background decoration */}
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-br from-amber-400/20 to-yellow-500/20 rounded-full blur-xl"></div>
            <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-gradient-to-br from-blue-400/20 to-purple-500/20 rounded-full blur-xl"></div>

            <div className="relative z-10">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full mb-6 shadow-xl">
                <MessageCircle size={24} className="text-white" />
              </div>

              <h3 className="text-2xl lg:text-3xl font-bold text-white mb-4">
                Still have questions? We're here to help!
              </h3>

              <p className="text-slate-300 text-lg mb-8 leading-relaxed">
                Tell us about your project and get personalized answers
              </p>

              <button
                className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-semibold px-10 py-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 text-lg"
                onClick={() => setIsLeadFormOpen(true)}
              >
                Ask a Question
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

      {/* FAQPage JSON-LD for SEO */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

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
