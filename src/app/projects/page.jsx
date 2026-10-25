import PremiumShell from "@/components/premium/PremiumShell";
import { Section, SectionHeading } from "@/components/premium/primitives";
import ContactBlock from "@/components/premium/ContactBlock";
import ProjectGrid from "@/components/premium/ProjectGrid";
import ProjectGallery from "@/components/premium/ProjectGallery";
export default function Projects() {
  return (
    <PremiumShell>
      <Section>
        <SectionHeading
          as="h1"
          eyebrow="The Arcan collection"
          title="Selected work."
        >
          An intimate look at colour, pattern and architectural detail in Arcan
          interiors.
        </SectionHeading>
        <ProjectGrid />
      </Section>
      <Section tone="stone" id="gallery">
        <SectionHeading eyebrow="The Arcan archive" title="Work in detail.">
          A closer look at interiors, wallcoverings and exterior details,
          alongside preparation and work in progress.
        </SectionHeading>
        <ProjectGallery />
      </Section>
      <ContactBlock />
    </PremiumShell>
  );
}
