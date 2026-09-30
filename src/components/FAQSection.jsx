import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import LeadFormPopup from "./LeadFormPopup";

export default function FAQSection() {
  const [openFAQ, setOpenFAQ] = useState(null);
  const [isVisible, setIsVisible] = useState(true);
  const [isLeadFormOpen, setIsLeadFormOpen] = useState(false);

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
    <section id="faq" className="border-t border-line bg-paper-deep">
      <div className="mx-auto grid max-w-[1440px] gap-12 px-4 py-20 sm:px-6 md:px-10 lg:grid-cols-12 lg:py-28">
        <div className="lg:col-span-4">
          <p className="eyebrow mb-5">Questions</p>
          <h2 className="font-display text-4xl leading-[1.08] tracking-[-0.015em] text-ink sm:text-5xl">
            Before you book.
          </h2>
          <p className="mt-6 max-w-sm leading-relaxed text-ink-soft">
            Something we haven't covered?{" "}
            <button
              type="button"
              className="font-medium text-ink underline decoration-brand decoration-2 underline-offset-4"
              onClick={() => setIsLeadFormOpen(true)}
            >
              Ask us directly
            </button>
            .
          </p>
        </div>

        <div className={`border-t border-ink/20 lg:col-span-8 transition-opacity duration-700 ${isVisible ? "opacity-100" : "opacity-0"}`}>
          {faqs.map((faq, index) => {
            const isOpen = openFAQ === index;
            return (
              <div key={faq.question} className="border-b border-ink/20">
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-6 py-6 text-left"
                  onClick={() => setOpenFAQ(isOpen ? null : index)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${index}`}
                >
                  <span className="font-display text-xl text-ink sm:text-2xl">{faq.question}</span>
                  <Plus
                    size={22}
                    aria-hidden="true"
                    className={`flex-shrink-0 text-ink transition-transform duration-200 ${isOpen ? "rotate-45" : ""}`}
                  />
                </button>
                {isOpen && (
                  <div id={`faq-answer-${index}`} className="pb-7 pr-10">
                    <p className="max-w-2xl leading-relaxed text-ink-soft">{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <LeadFormPopup
        isOpen={isLeadFormOpen}
        onClose={() => setIsLeadFormOpen(false)}
      />

      {/* FAQPage JSON-LD for SEO */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </section>
  );
}
