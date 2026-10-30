import PremiumShell from "@/components/premium/PremiumShell";
import {
  ButtonLink,
  Section,
  SectionHeading,
} from "@/components/premium/primitives";
import ProjectGrid from "@/components/premium/ProjectGrid";
import ContactBlock from "@/components/premium/ContactBlock";
import { services } from "@/data/premiumSite";
import GoogleReviews from "@/components/premium/GoogleReviews";
import { generalFaqs } from "@/data/publicContent";

export default function HomePage() {
  return (
    <PremiumShell>
      <section className="p-hero">
        <div className="p-hero-copy">
          <p className="p-eyebrow">Arcan Painting · Greater Toronto Area</p>
          <h1>
            Exceptional painting.
            <br />
            <em>Luxury wall finishes.</em>
          </h1>
          <p>
            Fine interior painting, high-end wallpaper
            <br />
            and specialist decorative surfaces across the GTA.
          </p>
          <div className="p-hero-actions">
            <ButtonLink href="#work" subtle>
              View selected work
            </ButtonLink>
            <ButtonLink href="/contact" subtle>
              Discuss your project
            </ButtonLink>
          </div>
        </div>
        <img
          src="/hero/PXL_20250217_224338011_MP-900.webp"
          alt="Finished neutral interior with white trim and dark wood flooring"
          width="900"
          height="1195"
          fetchPriority="high"
        />
      </section>
      <Section className="p-two-column">
        <p className="p-eyebrow">Colour. Pattern. Texture.</p>
        <SectionHeading
          title={
            <>
              Distinctive interiors.
              <br />
              <em>Exceptional detail.</em>
            </>
          }
        >
          Premium Painting, High-end Wallpaper and Luxury Finishes for
          complete residences, substantial renovations and commercial
          interiors.
        </SectionHeading>
      </Section>
      <Section className="p-services-section" id="services">
        <p className="p-eyebrow">Painting & wall finishes</p>
        <h2 className="p-visually-hidden">Our services</h2>
        <div className="p-services">
          {services.slice(0, 3).map((service, i) => (
            <a href={service.path} key={service.path}>
              <span className="p-index">0{i + 1}</span>
              <h3>{service.title}</h3>
              <p>{service.summary}</p>
              <span className="p-service-link">
                Explore service <span aria-hidden="true">↗</span>
              </span>
            </a>
          ))}
        </div>
        <div className="p-service-secondary-links" role="group" aria-label="Additional services">
          <a href="/commercial-painting">
            Commercial Painting <span aria-hidden="true">↗</span>
          </a>
          <a href="/exterior-painting">
            Exterior Painting <span aria-hidden="true">↗</span>
          </a>
        </div>
      </Section>
      <Section tone="ink" className="p-feature">
        <img
          src="/hero/floral-feature-wall-900.webp"
          alt="Completed floral wallpaper feature wall with sage trim and wood flooring"
          loading="lazy"
          width="900"
          height="675"
        />
        <div>
          <SectionHeading
            eyebrow="A specialist eye for wallpaper"
            title={
              <>
                Pattern with
                <br />
                <em>presence.</em>
              </>
            }
          >
            From a quiet botanical to an expressive feature wall. Bring your
            wallcovering, room plans and material references into the
            conversation.
          </SectionHeading>
          <ButtonLink href="/wallpaper-services" subtle>
            Explore wallpaper
          </ButtonLink>
        </div>
      </Section>
      <Section id="work">
        <span id="portfolio" aria-hidden="true" />
        <div className="p-section-top">
          <SectionHeading
            eyebrow="The Arcan collection"
            title={
              <>
                Selected <em>work.</em>
              </>
            }
          />
          <ButtonLink href="/projects" subtle>
            View the collection
          </ButtonLink>
        </div>
        <ProjectGrid />
      </Section>
      <Section tone="stone" className="p-two-column" id="process">
        <SectionHeading
          eyebrow="From the first conversation"
          title={
            <>
              A clear scope.
              <br />
              <em>A considered approach.</em>
            </>
          }
        >
          For homeowners, designers and project teams planning spaces with a
          point of view.
        </SectionHeading>
        <ol className="p-process">
          {[
            [
              "Understand the space",
              "Share the property, surfaces, material references and the result you want.",
            ],
            [
              "Define the details",
              "Review preparation, access, finish choices and project requirements.",
            ],
            [
              "Prepare and apply",
              "Review protection, preparation and the application plan with the team.",
            ],
            [
              "Review the finish",
              "Walk through the work with the team and discuss any final details.",
            ],
          ].map(([title, body], i) => (
            <li key={title}>
              <span>0{i + 1}</span>
              <div>
                <h3>{title}</h3>
                <p>{body}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>
      <Section id="faq">
        <SectionHeading eyebrow="Before your project" title="A few practical questions." />
        <div className="p-faq">
          {generalFaqs.map(({question,answer}) => (
            <details key={question}>
              <summary>{question}</summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </Section>
      <GoogleReviews />
      <ContactBlock />
    </PremiumShell>
  );
}
