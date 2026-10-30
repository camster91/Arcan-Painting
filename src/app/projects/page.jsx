import PremiumShell from "@/components/premium/PremiumShell";
import { Section, SectionHeading } from "@/components/premium/primitives";
import ContactBlock from "@/components/premium/ContactBlock";
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
          Finished interiors, wallcoverings and exterior details, with a
          different view of the work in every photograph.
        </SectionHeading>
      </Section>
      <Section tone="stone" id="gallery">
        <SectionHeading eyebrow="Finished projects" title="Work in detail.">
          A curated collection of completed work. Select a photograph for a closer look.
        </SectionHeading>
        <ProjectGallery />
      </Section>
      <ContactBlock />
    </PremiumShell>
  );
}
