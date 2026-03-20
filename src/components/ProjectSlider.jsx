import {
  useState,
  useRef,
  useCallback,
  useEffect,
  memo,
} from "react";
import { Share2, ChevronLeft, ChevronRight, MapPin, Calendar, Briefcase } from "lucide-react";
import TestimonialCard from "./TestimonialCard";

// GA helper – only fires if gtag is present (won't break without GA)
function trackEvent(eventName, params = {}) {
  try {
    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      window.gtag("event", eventName, params);
    }
  } catch (_) {}
}

/**
 * ProjectSlider
 *
 * Interactive before/after image slider for a single project.
 * - Mouse drag (desktop)
 * - Touch / swipe (mobile)
 * - Keyboard: ← → arrow keys when focused
 * - Info overlay on hover/tap
 * - GA event tracking
 *
 * @param {{ project: object, index: number, isActive: boolean }} props
 */
const ProjectSlider = memo(function ProjectSlider({ project, index, isActive }) {
  const [sliderPos, setSliderPos] = useState(50); // 0–100 %
  const [isDragging, setIsDragging] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [showTestimonial, setShowTestimonial] = useState(false);
  const [imageLoaded, setImageLoaded] = useState({ before: false, after: false });
  const [tracked, setTracked] = useState(false);

  const containerRef = useRef(null);
  const dragRef = useRef(false);
  const startXRef = useRef(0);

  // Fire GA gallery_view once per project when visible
  useEffect(() => {
    if (isActive && !tracked) {
      trackEvent("gallery_view", {
        project_id: project.id,
        project_name: project.name,
        service: project.service,
      });
      setTracked(true);
    }
  }, [isActive, tracked, project]);

  // Show testimonial 1.2 s after load
  useEffect(() => {
    if (!imageLoaded.after) return;
    const t = setTimeout(() => setShowTestimonial(true), 1200);
    return () => clearTimeout(t);
  }, [imageLoaded.after]);

  // ── position calculation ──────────────────────────────────────────────────
  const updateSliderFromClientX = useCallback((clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const pct = (x / rect.width) * 100;
    setSliderPos(Math.round(pct));
  }, []);

  // ── Mouse events ──────────────────────────────────────────────────────────
  const handleMouseDown = useCallback(
    (e) => {
      e.preventDefault();
      dragRef.current = true;
      setIsDragging(true);
      startXRef.current = e.clientX;
      updateSliderFromClientX(e.clientX);
      trackEvent("gallery_click", {
        project_id: project.id,
        action: "drag_start",
      });
    },
    [updateSliderFromClientX, project.id]
  );

  const handleMouseMove = useCallback(
    (e) => {
      if (!dragRef.current) return;
      updateSliderFromClientX(e.clientX);
    },
    [updateSliderFromClientX]
  );

  const handleMouseUp = useCallback(() => {
    dragRef.current = false;
    setIsDragging(false);
  }, []);

  // Attach global mouse listeners when dragging
  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e) => handleMouseMove(e);
    const onUp = () => handleMouseUp();
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // ── Touch events ──────────────────────────────────────────────────────────
  const handleTouchStart = useCallback(
    (e) => {
      const touch = e.touches[0];
      dragRef.current = true;
      setIsDragging(true);
      startXRef.current = touch.clientX;
      updateSliderFromClientX(touch.clientX);
    },
    [updateSliderFromClientX]
  );

  const handleTouchMove = useCallback(
    (e) => {
      if (!dragRef.current) return;
      e.preventDefault(); // prevent page scroll while dragging
      const touch = e.touches[0];
      updateSliderFromClientX(touch.clientX);
    },
    [updateSliderFromClientX]
  );

  const handleTouchEnd = useCallback(() => {
    dragRef.current = false;
    setIsDragging(false);
    // Tap to toggle overlay on mobile (≤ 5px movement = tap)
    if (Math.abs(startXRef.current - (containerRef.current?.getBoundingClientRect().left || 0)) < 5) {
      setShowOverlay((v) => !v);
    }
  }, []);

  // ── Keyboard accessibility ────────────────────────────────────────────────
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setSliderPos((p) => Math.max(0, p - 5));
        trackEvent("gallery_click", { project_id: project.id, action: "keyboard_left" });
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setSliderPos((p) => Math.min(100, p + 5));
        trackEvent("gallery_click", { project_id: project.id, action: "keyboard_right" });
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setShowOverlay((v) => !v);
      }
    },
    [project.id]
  );

  // ── Share ──────────────────────────────────────────────────────────────────
  const handleShare = useCallback(
    (e) => {
      e.stopPropagation();
      const shareData = {
        title: `${project.name} – Arcan Painting`,
        text: `Check out this amazing painting project by Arcan and Sons Painting in ${project.location}!`,
        url: typeof window !== "undefined" ? window.location.href : "https://arcanpainting.ca",
      };
      if (navigator.share) {
        navigator.share(shareData).catch(() => {});
      } else {
        // Fallback: copy to clipboard
        navigator.clipboard
          ?.writeText(shareData.url)
          .then(() => {
            // brief user feedback – could wire to a toast system
          })
          .catch(() => {});
      }
      trackEvent("gallery_click", { project_id: project.id, action: "share" });
    },
    [project]
  );

  // ── Testimonial tracking ───────────────────────────────────────────────────
  const handleTestimonialView = useCallback(() => {
    trackEvent("testimonial_view", {
      project_id: project.id,
      client: project.testimonial?.name,
    });
  }, [project]);

  useEffect(() => {
    if (showTestimonial) handleTestimonialView();
  }, [showTestimonial, handleTestimonialView]);

  return (
    <div className="group relative w-full select-none">
      {/* ─── Slider container ───────────────────────────────────────────── */}
      <div
        ref={containerRef}
        role="img"
        aria-label={`Before and after comparison for ${project.name}. Use arrow keys to adjust the slider.`}
        tabIndex={0}
        className={[
          "relative w-full overflow-hidden rounded-2xl",
          "aspect-[4/3] md:aspect-[16/9]",
          "cursor-ew-resize focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-400",
          isDragging ? "cursor-grabbing" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onKeyDown={handleKeyDown}
        onMouseEnter={() => setShowOverlay(true)}
        onMouseLeave={() => {
          setShowOverlay(false);
          setIsDragging(false);
          dragRef.current = false;
        }}
        style={{ touchAction: "none" }}
      >
        {/* BEFORE image (full width, clipped by sliderPos) */}
        <div className="absolute inset-0 w-full h-full">
          <picture>
            <source srcSet={project.before.src} type="image/webp" />
            <img
              src={project.before.fallback}
              alt={project.before.alt}
              loading={index < 3 ? "eager" : "lazy"}
              decoding="async"
              className="w-full h-full object-cover"
              onLoad={() => setImageLoaded((s) => ({ ...s, before: true }))}
            />
          </picture>
          {/* "Before" label */}
          <span className="absolute top-3 left-3 bg-black/60 text-white text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm pointer-events-none">
            Before
          </span>
        </div>

        {/* AFTER image (clipped to sliderPos %) */}
        <div
          className="absolute inset-0 h-full overflow-hidden"
          style={{
            width: `${sliderPos}%`,
            transition: isDragging ? "none" : "width 0.1s ease-out",
          }}
        >
          <picture>
            <source srcSet={project.after.src} type="image/webp" />
            <img
              src={project.after.fallback}
              alt={project.after.alt}
              loading={index < 3 ? "eager" : "lazy"}
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover"
              style={{
                width: containerRef.current
                  ? `${containerRef.current.offsetWidth}px`
                  : "100%",
                maxWidth: "none",
              }}
              onLoad={() => setImageLoaded((s) => ({ ...s, after: true }))}
            />
          </picture>
          {/* "After" label */}
          <span className="absolute top-3 right-3 bg-amber-500/90 text-white text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm pointer-events-none">
            After
          </span>
        </div>

        {/* Drag handle */}
        <div
          aria-hidden="true"
          className="absolute top-0 bottom-0 z-20 flex items-center justify-center"
          style={{
            left: `${sliderPos}%`,
            transform: "translateX(-50%)",
            transition: isDragging ? "none" : "left 0.1s ease-out",
          }}
        >
          {/* Vertical line */}
          <div className="w-0.5 h-full bg-white/80 shadow-lg" />
          {/* Circle handle */}
          <div
            className={[
              "absolute w-11 h-11 rounded-full bg-white shadow-xl",
              "flex items-center justify-center gap-0.5",
              "ring-2 ring-white/60",
              "transition-transform duration-150",
              isDragging ? "scale-110" : "scale-100",
            ].join(" ")}
          >
            <ChevronLeft size={14} className="text-slate-600 -mr-0.5" />
            <ChevronRight size={14} className="text-slate-600 -ml-0.5" />
          </div>
        </div>

        {/* Project details overlay */}
        <div
          aria-hidden={!showOverlay}
          className={[
            "absolute inset-0 z-10 bg-gradient-to-t from-slate-900/85 via-slate-900/20 to-transparent",
            "transition-opacity duration-300",
            showOverlay ? "opacity-100" : "opacity-0 pointer-events-none",
          ].join(" ")}
        >
          <div
            className={[
              "absolute bottom-0 inset-x-0 p-4 md:p-5",
              "transition-transform duration-300",
              showOverlay ? "translate-y-0" : "translate-y-4",
            ].join(" ")}
          >
            <h3 className="text-white font-bold text-base md:text-lg leading-tight mb-1.5">
              {project.name}
            </h3>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/80">
              <span className="flex items-center gap-1">
                <Briefcase size={11} aria-hidden="true" />
                {project.service}
              </span>
              <span className="flex items-center gap-1">
                <MapPin size={11} aria-hidden="true" />
                {project.location}
              </span>
              <span className="flex items-center gap-1">
                <Calendar size={11} aria-hidden="true" />
                {project.completedDate}
              </span>
            </div>
          </div>

          {/* Share button */}
          <button
            type="button"
            onClick={handleShare}
            aria-label={`Share ${project.name} project`}
            className={[
              "absolute top-3 right-3 min-w-[44px] min-h-[44px] w-11 h-11",
              "flex items-center justify-center",
              "bg-white/20 hover:bg-white/35 active:bg-white/50",
              "backdrop-blur-sm rounded-full text-white",
              "transition-all duration-200",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-white",
              showOverlay ? "opacity-100" : "opacity-0",
            ].join(" ")}
          >
            <Share2 size={16} aria-hidden="true" />
          </button>
        </div>

        {/* Keyboard hint (shown briefly on focus) */}
        <div
          aria-hidden="true"
          className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-full opacity-0 focus-within:opacity-100 transition-opacity pointer-events-none whitespace-nowrap"
        >
          ← → to adjust
        </div>
      </div>

      {/* ─── Testimonial card (below slider) ──────────────────────────────── */}
      <div className="mt-3 px-1">
        <TestimonialCard
          testimonial={project.testimonial}
          visible={showTestimonial}
        />
      </div>
    </div>
  );
});

export default ProjectSlider;
