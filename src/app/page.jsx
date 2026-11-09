import PremiumShell from "@/components/premium/PremiumShell";
import {
  ButtonLink,
  Section,
  SectionHeading,
} from "@/components/premium/primitives";
import WorkSlider from "@/components/premium/WorkSlider";
import HeroSlideshow from "@/components/premium/HeroSlideshow";
import ContactBlock from "@/components/premium/ContactBlock";
import { projects, serviceAreas, services } from "@/data/premiumSite";
import { projectGallery } from "@/data/projectGallery";
import { getUprightCovers } from "@/data/gallerySelection";
import GoogleReviews from "@/components/premium/GoogleReviews";
import { generalFaqs } from "@/data/publicContent";
import { googleListing } from "@/data/googleListing";
import { Star } from "lucide-react";

const heroSlides = [
  {
    src: "/hero/PXL_20251018_142500065-1400.webp",
    alt: "Completed dining room with patterned wallpaper, pink seating and a set table",
    width: 917,
    height: 1218,
    srcSet: "/hero/PXL_20251018_142500065-800.webp 800w, /hero/PXL_20251018_142500065-1400.webp 917w",
  },
  {
    src: "/hero/IMG-20260212-WA0016-1400.webp",
    alt: "Completed residential staircase with dark treads, white risers and painted railings",
    width: 1400,
    height: 1867,
    srcSet: "/hero/IMG-20260212-WA0016-800.webp 800w, /hero/IMG-20260212-WA0016-1400.webp 1400w",
  },
  {
    src: "/hero/IMG-20260217-WA0022-1200.webp",
    alt: "Finished bar interior with an arched wall, pendant lights and a dark ceiling",
    width: 1200,
    height: 1600,
  },
];

const projectStories = projects.map((project) => ({
  ...project,
  href: `/projects/${project.slug}`,
}));
const moreWork = getUprightCovers(projectGallery, {
  excludeScenes: projects.map((project) => project.scene),
});

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
            <ButtonLink href="/contact" accent>
              Request an estimate
            </ButtonLink>
            <ButtonLink href="#work" subtle>
              View selected work
            </ButtonLink>
          </div>
          <a className="p-hero-trust" href="#reviews">
            <span className="p-stars" aria-hidden="true">
              {Array.from({ length: 5 }, (_, i) => (
                <Star key={i} size={16} fill="currentColor" strokeWidth={1.5} />
              ))}
            </span>
            <span>
              {googleListing.rating} from {googleListing.reviewCount} Google reviews
            </span>
          </a>
        </div>
        <HeroSlideshow slides={heroSlides} />
      </section>
      <Section className="p-services-section" id="services">
        <SectionHeading
          eyebrow="Painting & wall finishes"
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
        <WorkSlider label="Selected work" stories={projectStories} covers={moreWork} />
      </Section>
      <GoogleReviews />
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
      <Section tone="ink" className="p-cta-band" id="start">
        <SectionHeading
          eyebrow="Planning a project?"
          title={
            <>
              Tell us about your space.
              <br />
              <em>We will take it from there.</em>
            </>
          }
        >
          Share the rooms, surfaces and timing you have in mind. The team
          will follow up to discuss the scope and next steps.
        </SectionHeading>
        <div className="p-cta-actions">
          <ButtonLink href="/contact" accent>
            Request an estimate
          </ButtonLink>
          <a className="p-button p-button--line" href="tel:+14167272148">
            Call 416 727 2148
          </a>
        </div>
      </Section>
      <Section className="p-two-column" id="areas">
        <SectionHeading
          eyebrow="Where we work"
          title={
            <>
              The Greater Toronto Area
              <br />
              <em>and beyond.</em>
            </>
          }
        >
          From Toronto, Peel and Halton to York, Durham and Simcoe County. Not sure
          if we cover your area? Ask us.
        </SectionHeading>
        <ul className="p-areas" aria-label="Service areas">
          {serviceAreas.map((area) => (
            <li key={area}>{area}</li>
          ))}
        </ul>
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
      <ContactBlock />
    </PremiumShell>
  );
}
