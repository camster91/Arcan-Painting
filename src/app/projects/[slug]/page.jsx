import PremiumShell from "@/components/premium/PremiumShell";
import {
  Section,
  SectionHeading,
  ButtonLink,
} from "@/components/premium/primitives";
import ContactBlock from "@/components/premium/ContactBlock";
import { useLoaderData } from "react-router";
import { projects } from "@/data/premiumSite";
import { projectGallery } from "@/data/projectGallery";
import { getScenePhotos } from "@/data/gallerySelection";
import Slider from "@/components/premium/Slider";
import { projectEnquiryHref } from "@/data/projectEnquiries";
export function loader({ params }) {
  const project = projects.find((item) => item.slug === params.slug);
  if (!project) throw new Response("Not found", { status: 404 });
  return project;
}
export default function Project() {
  const project = useLoaderData();
  const photos = getScenePhotos(projectGallery, project.scene);
  const enquiryHref = photos[0] ? projectEnquiryHref(photos[0].file) : "/contact";
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
          <ButtonLink href={enquiryHref} accent>Request an estimate</ButtonLink>
          <ButtonLink href="/projects" subtle>
            All selected work
          </ButtonLink>
        </div>
        <Slider label={`${project.title} photos`} className="p-photo-slider">
          {[
            { src: project.image, alt: project.imageAlt, key: project.image },
            ...photos
              .filter((photo) => !project.image.includes(photo.file.replace(/\.webp$/i, "")))
              .map((photo) => ({
                src: `/gallery/images/${encodeURIComponent(photo.file)}`,
                alt: photo.alt,
                key: photo.file,
              })),
          ].map((photo, i) => (
            <img
              key={photo.key}
              className={i === 0 ? "p-project-detail" : "p-project-photo"}
              src={photo.src}
              alt={photo.alt}
              width="1400"
              height="1860"
              fetchPriority={i === 0 ? "high" : undefined}
              loading={i === 0 ? undefined : "lazy"}
              decoding="async"
            />
          ))}
        </Slider>
      </Section>
      <ContactBlock enquiryHref={enquiryHref} />
    </PremiumShell>
  );
}
