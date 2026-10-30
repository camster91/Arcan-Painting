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
          curated cover for each scene and more finished views in the image viewer.
        </SectionHeading>
      </Section>
      <Section tone="stone" id="gallery">
        <SectionHeading eyebrow="Finished projects" title="Work in detail.">
          Select a photograph to explore all finished views of that scene.
        </SectionHeading>
        <ProjectGallery />
      </Section>
      <ContactBlock />
    </PremiumShell>
  );
}
