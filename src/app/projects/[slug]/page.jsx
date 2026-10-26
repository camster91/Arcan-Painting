import PremiumShell from "@/components/premium/PremiumShell";
import {
  Section,
  SectionHeading,
  ButtonLink,
} from "@/components/premium/primitives";
import ContactBlock from "@/components/premium/ContactBlock";
import { useLoaderData } from "react-router";
import { projects } from "@/data/premiumSite";
export function loader({ params }) {
  const project = projects.find((item) => item.slug === params.slug);
  if (!project) throw new Response("Not found", { status: 404 });
  return project;
}
export default function Project() {
  const project = useLoaderData();
  return (
    <PremiumShell>
      <Section>
        <SectionHeading
          as="h1"
          eyebrow={project.category}
          title={project.title}
        >
          {project.description}
        </SectionHeading>
        <div className="p-project-actions">
          <ButtonLink href="/contact">Discuss your project</ButtonLink>
          <ButtonLink href="/projects" subtle>
            All selected work
          </ButtonLink>
        </div>
        <img
          className="p-project-detail"
          src={project.image}
          alt={project.imageAlt}
          width="1400"
          height="1860"
          fetchPriority="high"
        />
      </Section>
      <ContactBlock />
    </PremiumShell>
  );
}
