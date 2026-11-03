import { Children, useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

/**
 * Lightweight, dependency-free slider built on native horizontal scrolling
 * with scroll-snap. Swipe, trackpad and keyboard scrolling work without
 * JavaScript; the previous/next buttons are progressive enhancement.
 */
export default function Slider({ label, children, className = "" }) {
  const trackRef = useRef(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const slides = Children.toArray(children);

  const update = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const max = track.scrollWidth - track.clientWidth;
    setCanPrev(track.scrollLeft > 4);
    setCanNext(track.scrollLeft < max - 4);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;
    update();
    track.addEventListener("scroll", update, { passive: true });
    const observer =
      typeof ResizeObserver === "function" ? new ResizeObserver(update) : null;
    observer?.observe(track);
    return () => {
      track.removeEventListener("scroll", update);
      observer?.disconnect();
    };
  }, [update, slides.length]);

  const move = (direction) => {
    const track = trackRef.current;
    if (!track) return;
    const slide = track.querySelector(".p-slider__slide");
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    const step = slide ? slide.getBoundingClientRect().width + gap : track.clientWidth;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    track.scrollBy({ left: direction * step, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <div
      className={`p-slider ${className}`}
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
    >
      <ul className="p-slider__track" ref={trackRef}>
        {slides.map((slide, i) => (
          <li
            className="p-slider__slide"
            key={slide.key ?? i}
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${slides.length}`}
          >
            {slide}
          </li>
        ))}
      </ul>
      {(canPrev || canNext) && (
        <div className="p-slider__controls">
          <button
            type="button"
            className="p-slider__button"
            onClick={() => move(-1)}
            disabled={!canPrev}
            aria-label={`Previous: ${label}`}
          >
            <ArrowLeft size={18} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="p-slider__button"
            onClick={() => move(1)}
            disabled={!canNext}
            aria-label={`Next: ${label}`}
          >
            <ArrowRight size={18} aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}
