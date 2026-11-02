import { ArrowUpRight } from "lucide-react";
import Slider from "./Slider";

function thumbnail(file) {
  return `/gallery/thumbnails/${encodeURIComponent(file.replace(/\.webp$/i, "_thumb.webp"))}`;
}

/**
 * Slider of finished-project cards. Each slide is either a written project
 * story ({ href, image, imageAlt, title, category }) or a gallery cover
 * ({ file, alt, title, category }) that links into the full gallery.
 */
export default function WorkSlider({ label, stories = [], covers = [] }) {
  const slides = [
    ...stories.map((story) => ({
      key: story.href,
      href: story.href,
      src: story.image,
      alt: story.imageAlt,
      title: story.title,
      meta: story.category,
      width: 1400,
      height: 1860,
    })),
    ...covers.map((cover) => ({
      key: cover.file,
      href: "/projects#gallery",
      src: thumbnail(cover.file),
      alt: cover.alt,
      title: cover.title,
      meta:
        cover.photoCount > 1
          ? `${cover.category} · ${cover.photoCount} photos`
          : cover.category,
      width: 640,
      height: 480,
    })),
  ];
  if (!slides.length) return null;
  return (
    <Slider label={label} className="p-work-slider">
      {slides.map((slide) => (
        <a className="p-work-card" href={slide.href} key={slide.key}>
          <span className="p-image-frame">
            <img
              src={slide.src}
              alt={slide.alt}
              loading="lazy"
              decoding="async"
              width={slide.width}
              height={slide.height}
            />
          </span>
          <span className="p-project-meta">
            <span>{slide.meta}</span>
            <ArrowUpRight aria-hidden="true" size={18} />
          </span>
          <span className="p-work-card__title">{slide.title}</span>
        </a>
      ))}
    </Slider>
  );
}
