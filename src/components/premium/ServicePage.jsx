import { SERVICE_FAQS } from "@/utils/publicSeo";
import PremiumShell from "./PremiumShell";
import ProjectContact from "./ProjectContact";
import { Section, SectionHeading, ButtonLink } from "./primitives";
import { services } from "@/data/premiumSite";
export default function ServicePage({ path }) {
  const service = services.find((s) => s.path === path);
  if (!service) return null;
  const faqKey = {
    "/interior-painting": "Interior Painting",
    "/exterior-painting": "Exterior Painting",
    "/commercial-painting": "Commercial Painting",
    "/wallpaper-services": "Wallpaper Services",
    "/specialty-finishes": "Specialty Finishes",
  }[path];
  const key = {
    "/interior-painting": "interior",
    "/wallpaper-services": "wallpaper",
    "/specialty-finishes": "specialty",
    "/commercial-painting": "commercial",
    "/exterior-painting": "exterior",
  }[path];
  return (
    <PremiumShell>
      <section
        className={`p-service-hero ${service.image ? "" : "p-service-hero--text"}`}
      >
        <div className="p-service-copy">
          <p className="p-eyebrow">{service.eyebrow}</p>
          <h1>{service.title}</h1>
          <p>{service.summary}</p>
          <ButtonLink href="#enquire">Discuss your project</ButtonLink>
        </div>
        {service.image && (
          <img
            src={service.image}
            alt={service.imageAlt}
            width="1400"
            height="1860"
            fetchPriority="high"
          />
        )}
      </section>
      <Section className="p-two-column">
        <SectionHeading
          eyebrow="The scope"
          title="The right finish begins with the details."
        />
        <div>
          <p className="p-copy">{service.description}</p>
          <ul className="p-detail-list">
            {service.details.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </Section>
      <Section>
        <SectionHeading title="Before we begin." />
        <div className="p-faq">
          {SERVICE_FAQS[faqKey].map(([question, answer]) => (
            <details key={question}>
              <summary>{question}</summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </Section>
      <Section tone="stone" className="p-two-column" id="enquire">
        <SectionHeading
          eyebrow="Start a conversation"
          title="Tell us about your project."
        >
          Share the property, surfaces, finish references and the dates you have
          in mind.
        </SectionHeading>
        <ProjectContact initialService={key} />
      </Section>
    </PremiumShell>
  );
}
