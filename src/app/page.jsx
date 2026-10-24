import PremiumShell, { SocialLinks } from "@/components/premium/PremiumShell";
import {
  ButtonLink,
  Section,
  SectionHeading,
} from "@/components/premium/primitives";
import ProjectGrid from "@/components/premium/ProjectGrid";
import ContactBlock from "@/components/premium/ContactBlock";
import { services, socialLinks } from "@/data/premiumSite";
import { Star } from "lucide-react";

export default function HomePage() {
  const google = socialLinks.find((link) => link.icon === "google");
  return (
    <PremiumShell>
      <section className="p-hero">
        <div className="p-hero-copy">
          <p className="p-eyebrow">Arcan Painting</p>
          <h1>
            Exceptional painting.
            <br />
            <em>Luxury wall finishes.</em>
          </h1>
          <p>
            Fine interior painting, high-end wallpaper
            <br />
            and specialist decorative surfaces.
          </p>
          <ButtonLink href="#work" subtle>
            View selected work
          </ButtonLink>
        </div>
        <img
          src="/hero/PXL_20251018_142500065-1400.webp"
          alt="Arcan dining interior with patterned wallpaper, pink seating and a set table"
          width="1400"
          height="1859"
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
          Premium Painting, Luxury Finishes and Wallpaper for complete
          residences, substantial renovations and commercial interiors.
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
      </Section>
      <Section tone="ink" className="p-feature">
        <img
          src="/hero/PXL_20260213_210915996-900.webp"
          alt="Floral wallpaper and softly painted walls in an Arcan residential project"
          loading="lazy"
          width="900"
          height="1200"
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
      <Section tone="stone" className="p-two-column">
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
              "Plan the next step",
              "Confirm scope and timing with the team before work begins.",
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
      <Section className="p-review-section">
        <SectionHeading
          eyebrow="More about Arcan"
          title="See the work. Read the reviews."
        >
          Explore our social profiles and read customer feedback directly on
          Google.
        </SectionHeading>
        {google && (
          <a
            className="p-review-link"
            href={google.href}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Star aria-hidden="true" size={23} />
            <span>Read our Google reviews</span>
            <span aria-hidden="true">↗</span>
            <span className="p-visually-hidden"> (opens in a new tab)</span>
          </a>
        )}
        <SocialLinks />
      </Section>
      <ContactBlock />
    </PremiumShell>
  );
}
