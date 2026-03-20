import {
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { Camera, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import ProjectSlider from "./ProjectSlider";
import { GALLERY_PROJECTS } from "./galleryData";
import LeadFormPopup from "./LeadFormPopup";

// GA helper
function trackEvent(eventName, params = {}) {
  try {
    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      window.gtag("event", eventName, params);
    }
  } catch (_) {}
}

// Service filter categories derived from data
const SERVICE_FILTERS = [
  "All",
  "Exterior Painting",
  "Interior Painting",
  "Commercial Painting",
];

/**
 * BeforeAfterGallery
 *
 * Full gallery section with:
 * - Service filter pills
 * - Responsive grid of ProjectSlider cards
 * - Intersection-observer for lazy-loading batches
 * - CTA to open quote form
 */
export default function BeforeAfterGallery() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [visibleCount, setVisibleCount] = useState(6);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [isLeadFormOpen, setIsLeadFormOpen] = useState(false);
  const [sectionVisible, setSectionVisible] = useState(false);

  const sectionRef = useRef(null);
  const loadMoreRef = useRef(null);

  // Reveal section via IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSectionVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.05 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  // Load more on scroll (infinite-ish pagination)
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisibleCount((c) => Math.min(c + 3, GALLERY_PROJECTS.length));
        }
      },
      { rootMargin: "200px" }
    );
    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, []);

  const filtered = activeFilter === "All"
    ? GALLERY_PROJECTS
    : GALLERY_PROJECTS.filter((p) => p.service === activeFilter);

  const displayed = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  const handleFilterChange = useCallback((filter) => {
    setActiveFilter(filter);
    setVisibleCount(6);
    trackEvent("gallery_click", { action: "filter", filter });
  }, []);

  const handleProjectActive = useCallback((id) => {
    setActiveProjectId(id);
  }, []);

  return (
    <section
      id="gallery"
      ref={sectionRef}
      aria-labelledby="gallery-heading"
      className={[
        "py-16 md:py-24 bg-gradient-to-b from-slate-50 to-white",
        "transition-all duration-700 ease-out",
        sectionVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
      ].join(" ")}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ─── Section header ─────────────────────────────────────────────── */}
        <div className="text-center mb-10 md:mb-14">
          <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold uppercase tracking-wider px-4 py-1.5 rounded-full mb-4">
            <Camera size={13} aria-hidden="true" />
            Real Results
          </div>
          <h2
            id="gallery-heading"
            className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight mb-4"
          >
            Before &amp; After Gallery
          </h2>
          <p className="text-slate-500 text-base md:text-lg max-w-xl mx-auto">
            Drag the slider to reveal each transformation. Every project is
            painted by the Cañabate family — no subcontractors, ever.
          </p>
        </div>

        {/* ─── Filter pills ───────────────────────────────────────────────── */}
        <div
          role="tablist"
          aria-label="Filter projects by service"
          className="flex flex-wrap justify-center gap-2 mb-10"
        >
          {SERVICE_FILTERS.map((f) => (
            <button
              key={f}
              role="tab"
              aria-selected={activeFilter === f}
              onClick={() => handleFilterChange(f)}
              className={[
                "min-h-[44px] px-5 py-2 rounded-full text-sm font-semibold",
                "transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400",
                activeFilter === f
                  ? "bg-amber-500 text-white shadow-md shadow-amber-200"
                  : "bg-white text-slate-600 border border-slate-200 hover:border-amber-300 hover:text-amber-700",
              ].join(" ")}
            >
              {f}
            </button>
          ))}
        </div>

        {/* ─── Project count badge ────────────────────────────────────────── */}
        <p className="text-center text-slate-400 text-sm mb-8" aria-live="polite">
          Showing {displayed.length} of {filtered.length} project
          {filtered.length !== 1 ? "s" : ""}
          {activeFilter !== "All" ? ` · ${activeFilter}` : ""}
        </p>

        {/* ─── Project grid ───────────────────────────────────────────────── */}
        <div
          role="list"
          aria-label="Before and after project gallery"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
        >
          {displayed.map((project, index) => (
            <div
              key={project.id}
              role="listitem"
              onFocus={() => handleProjectActive(project.id)}
              onMouseEnter={() => handleProjectActive(project.id)}
              className={[
                "transition-all duration-500",
                sectionVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-6",
              ].join(" ")}
              style={{ transitionDelay: `${Math.min(index * 60, 360)}ms` }}
            >
              <ProjectSlider
                project={project}
                index={index}
                isActive={activeProjectId === project.id}
              />
            </div>
          ))}
        </div>

        {/* ─── Load-more sentinel ─────────────────────────────────────────── */}
        {hasMore && (
          <div ref={loadMoreRef} className="h-4 mt-4" aria-hidden="true" />
        )}

        {/* ─── CTA ────────────────────────────────────────────────────────── */}
        <div className="mt-14 text-center">
          <p className="text-slate-500 text-base mb-4">
            Like what you see? Get a free, no-obligation estimate.
          </p>
          <button
            type="button"
            onClick={() => {
              setIsLeadFormOpen(true);
              trackEvent("gallery_click", { action: "cta_get_quote" });
            }}
            className={[
              "inline-flex items-center gap-2",
              "bg-amber-500 hover:bg-amber-600 active:bg-amber-700",
              "text-white font-bold text-base",
              "px-8 py-4 rounded-full shadow-lg shadow-amber-200",
              "transition-all duration-200 min-h-[56px]",
              "focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-400",
            ].join(" ")}
          >
            Get Your Free Quote
            <ExternalLink size={17} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Lead capture popup */}
      <LeadFormPopup
        isOpen={isLeadFormOpen}
        onClose={() => setIsLeadFormOpen(false)}
        source="gallery_cta"
      />
    </section>
  );
}
