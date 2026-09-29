import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import LeadFormPopup from "./LeadFormPopup";
import galleryTags from "@/data/gallery-tags.json";

// ─── Build gallery items from AI-generated tags ──────────────────────────────
function buildGalleryItems() {
  const entries = Object.entries(galleryTags).map(([file, tag], i) => {
    const isVideo = file.includes("_video.webp");
    let category = "Interior";
    if (tag.category === "commercial") category = "Commercial";
    else if (tag.category === "exterior" || tag.service === "exterior" || tag.room === "exterior" || tag.room === "facade" || tag.room === "deck" || tag.room === "porch") category = "Exterior";

    return {
      id: i + 1,
      file,
      category,
      title: tag.title || "Painting Project",
      altText: tag.alt || tag.alt_text || tag.title,
      qualityScore: tag.quality_score || 0.5,
      phase: tag.phase || "after",
      projectDate: tag.project_date || file.substring(0, 8),
      isVideo,
    };
  });

  const byProject = {};
  for (const item of entries) {
    const key = item.projectDate;
    if (!byProject[key]) byProject[key] = [];
    byProject[key].push(item);
  }

  const curated = [];
  for (const items of Object.values(byProject)) {
    items.sort((a, b) => b.qualityScore - a.qualityScore);
    curated.push(...items.slice(0, 4));
  }

  curated.sort((a, b) => b.qualityScore - a.qualityScore || b.projectDate.localeCompare(a.projectDate));
  return curated;
}

const GALLERY_ITEMS = buildGalleryItems();
const CATEGORIES = ["All", "Interior", "Exterior", "Commercial"];

// Photos of the crew rather than the work stay out of the portfolio grid.
const NON_PORTFOLIO_FILES = new Set([
  "PXL_20230716_234552246_MP.webp",
  "PXL_20260213_211346296.webp",
]);
const PORTFOLIO_ITEMS = GALLERY_ITEMS.filter((item) => !NON_PORTFOLIO_FILES.has(item.file));
// One 2×2 feature plus twelve squares fills four full rows of the desktop grid.
const INITIAL_VISIBLE = 13;

function GalleryCard({ item, onClick, featured }) {
  return (
    <button
      type="button"
      onClick={(event) => onClick(event)}
      className={`group/card relative block overflow-hidden rounded-sm bg-paper-deep focus-visible:outline focus-visible:outline-4 focus-visible:outline-brand focus-visible:outline-offset-2 ${featured ? "col-span-2 row-span-2" : ""}`}
      aria-label={`Open project photo: ${item.title}`}
    >
      <img
        src={`/gallery/thumbnails/${item.file.replace('.webp', '_thumb.webp')}`}
        alt={item.altText}
        loading="lazy"
        decoding="async"
        className="aspect-square h-full w-full object-cover transition-transform duration-500 group-hover/card:scale-[1.03]"
        style={{ imageOrientation: "from-image" }}
      />
      <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/70 to-transparent px-3 pb-2.5 pt-8 text-left text-xs font-medium text-paper opacity-0 transition-opacity group-hover/card:opacity-100 group-focus-visible/card:opacity-100">
        {item.category}
      </span>
    </button>
  );
}

export default function PortfolioSection() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isLeadFormOpen, setIsLeadFormOpen] = useState(false);
  const [sectionVisible, setSectionVisible] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const sectionRef = useRef(null);
  const lightboxRef = useRef(null);
  const closeLightboxButtonRef = useRef(null);
  const previouslyFocusedElement = useRef(null);

  const filtered = useMemo(
    () => activeFilter === "All"
      ? PORTFOLIO_ITEMS
      : PORTFOLIO_ITEMS.filter(item => item.category === activeFilter),
    [activeFilter]
  );

  const visible = showAll ? filtered : filtered.slice(0, INITIAL_VISIBLE);

  const categoryCounts = useMemo(() => {
    const counts = {};
    for (const item of PORTFOLIO_ITEMS) {
      counts[item.category] = (counts[item.category] || 0) + 1;
    }
    return counts;
  }, []);

  // Reveal on scroll
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

  const openLightbox = useCallback((idx, trigger) => {
    previouslyFocusedElement.current = trigger || document.activeElement;
    setLightboxIndex(idx);
    setLightboxOpen(true);
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
  }, []);

  const prevLightbox = useCallback(() => {
    setLightboxIndex(i => (i - 1 + filtered.length) % filtered.length);
  }, [filtered.length]);

  const nextLightbox = useCallback(() => {
    setLightboxIndex(i => (i + 1) % filtered.length);
  }, [filtered.length]);

  // Keep focus in the gallery dialog and return it to the selected photo.
  useEffect(() => {
    if (!lightboxOpen) return undefined;

    document.body.style.overflow = "hidden";
    closeLightboxButtonRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeLightbox();
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        prevLightbox();
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        nextLightbox();
        return;
      }
      if (event.key !== "Tab" || !lightboxRef.current) return;

      const elements = Array.from(lightboxRef.current.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ));
      if (elements.length === 0) return;

      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      if (previouslyFocusedElement.current instanceof HTMLElement) {
        previouslyFocusedElement.current.focus();
      }
    };
  }, [lightboxOpen, closeLightbox, nextLightbox, prevLightbox]);

  // Lightbox swipe
  const handleTouchStart = (e) => setTouchStart(e.touches[0].clientX);
  const handleTouchEnd = (e) => {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      diff > 0 ? nextLightbox() : prevLightbox();
    }
    setTouchStart(null);
  };

  const currentItem = filtered[lightboxIndex];

  return (
    <section
      id="portfolio"
      ref={sectionRef}
      className={[
        "border-t border-line bg-paper",
        "transition-opacity duration-700 ease-out",
        sectionVisible ? "opacity-100" : "opacity-0",
      ].join(" ")}
    >
      <div className="mx-auto max-w-[1440px] px-4 py-20 sm:px-6 md:px-10 lg:py-28">
        <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <p className="eyebrow mb-5">Recent work</p>
            <h2 className="font-display text-4xl leading-[1.08] tracking-[-0.015em] text-ink sm:text-5xl">
              Photographed on site, by the crew that did the work.
            </h2>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 lg:col-span-5 lg:justify-end" role="group" aria-label="Filter projects">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => { setActiveFilter(cat); setShowAll(false); }}
                aria-pressed={activeFilter === cat}
                className={[
                  "min-h-[44px] rounded-full border px-4 text-sm font-medium transition-colors",
                  activeFilter === cat
                    ? "border-ink bg-ink text-paper"
                    : "border-line text-ink-soft hover:border-ink hover:text-ink",
                ].join(" ")}
              >
                {cat}{cat !== "All" ? ` · ${categoryCounts[cat] || 0}` : ""}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4">
          {visible.map((item, i) => (
            <GalleryCard
              key={item.id}
              item={item}
              featured={i === 0}
              onClick={(event) => openLightbox(i, event.currentTarget)}
            />
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
          {filtered.length > INITIAL_VISIBLE && (
            <button
              type="button"
              onClick={() => setShowAll(v => !v)}
              className="link-underline text-ink"
              aria-expanded={showAll}
            >
              {showAll ? "Show fewer photos" : `Show all ${filtered.length} photos`}
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsLeadFormOpen(true)}
            className="link-underline text-brand-deep"
          >
            Discuss a similar project
          </button>
        </div>
      </div>

      {/* Lightbox — full screen immersive overlay */}
      {lightboxOpen && currentItem && (
        <div
          ref={lightboxRef}
          role="dialog"
          aria-modal="true"
          aria-label="Project photo viewer"
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black"
          onClick={closeLightbox}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Close button */}
          <button
            ref={closeLightboxButtonRef}
            onClick={(event) => {
              event.stopPropagation();
              closeLightbox();
            }}
            className="absolute top-4 right-4 z-10 w-12 h-12 bg-black/50 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <X size={22} className="text-white" />
          </button>

          {/* Prev button */}
          <button
            onClick={(e) => { e.stopPropagation(); prevLightbox(); }}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-black/50 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center transition-colors"
            aria-label="Previous"
          >
            <ChevronLeft size={24} className="text-white" />
          </button>

          {/* Next button */}
          <button
            onClick={(e) => { e.stopPropagation(); nextLightbox(); }}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-black/50 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center transition-colors"
            aria-label="Next"
          >
            <ChevronRight size={24} className="text-white" />
          </button>

          {/* Image — fills available space */}
          <div
            className="w-full h-full flex items-center justify-center p-4 sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={`/gallery/images/${currentItem.file}`}
              alt={currentItem.altText}
              loading="eager"
              decoding="async"
              className="max-w-full max-h-full object-contain"
              style={{ imageOrientation: "from-image" }}
            />
          </div>

          {/* Bottom bar */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 sm:px-6 sm:py-4">
            <div className="flex items-center justify-between">
              <span className="text-white/60 text-xs sm:text-sm">
                {lightboxIndex + 1} / {filtered.length}
              </span>
              <span className="text-white font-medium text-xs sm:text-sm">
                {currentItem.title} · {currentItem.category}
              </span>
            </div>
          </div>
        </div>
      )}

      <LeadFormPopup isOpen={isLeadFormOpen} onClose={() => setIsLeadFormOpen(false)} source="gallery_cta" />

    </section>
  );
}
