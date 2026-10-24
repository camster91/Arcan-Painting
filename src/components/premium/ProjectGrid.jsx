import { ArrowUpRight } from "lucide-react";
import { projects } from "@/data/premiumSite";
export default function ProjectGrid() {
  return (
    <div className="p-projects">
      {projects.map((project) => (
        <a
          className="p-project"
          key={project.slug}
          href={`/projects/${project.slug}`}
        >
          <div className="p-image-frame">
            <img
              src={project.image}
              alt={project.imageAlt}
              loading="lazy"
              width="1400"
              height="1860"
            />
          </div>
          <div className="p-project-meta">
            <span>{project.category}</span>
            <ArrowUpRight aria-hidden="true" size={18} />
          </div>
          <h3>{project.title}</h3>
        </a>
      ))}
    </div>
  );
}
