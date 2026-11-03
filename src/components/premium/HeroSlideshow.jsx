import { useEffect, useState } from "react";
import { Pause, Play } from "lucide-react";

const INTERVAL = 6000;

/**
 * Crossfading hero photos. The first photo is server-rendered and is the
 * only one shown without JavaScript or when the visitor asks for reduced
 * motion. Auto-advance can be paused (WCAG 2.2.2) and stops on hover/focus.
 */
export default function HeroSlideshow({ slides }) {
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [canAnimate, setCanAnimate] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (!reduce && slides.length > 1) {
      setCanAnimate(true);
      setPlaying(true);
    }
  }, [slides.length]);

  useEffect(() => {
    if (!playing || hovered) return undefined;
    const timer = window.setTimeout(
      () => setActive((i) => (i + 1) % slides.length),
      INTERVAL,
    );
    return () => window.clearTimeout(timer);
  }, [playing, hovered, active, slides.length]);

  return (
    <div
      className="p-hero-media"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
    >
      {slides.map((slide, i) => (
        <img
          key={slide.src}
          className={i === active ? "is-active" : ""}
          src={slide.src}
          alt={i === active ? slide.alt : ""}
          aria-hidden={i === active ? undefined : "true"}
          width={slide.width}
          height={slide.height}
          fetchPriority={i === 0 ? "high" : undefined}
          loading={i === 0 ? undefined : "lazy"}
          decoding="async"
        />
      ))}
      {canAnimate && (
        <div className="p-hero-media__controls">
          {slides.map((slide, i) => (
            <button
              key={slide.src}
              type="button"
              className="p-hero-media__dot"
              aria-label={`Show photo ${i + 1} of ${slides.length}`}
              aria-current={i === active ? "true" : undefined}
              onClick={() => setActive(i)}
            />
          ))}
          <button
            type="button"
            className="p-hero-media__toggle"
            aria-label={playing ? "Pause slideshow" : "Play slideshow"}
            onClick={() => setPlaying((p) => !p)}
          >
            {playing ? <Pause size={14} aria-hidden="true" /> : <Play size={14} aria-hidden="true" />}
          </button>
        </div>
      )}
    </div>
  );
}
