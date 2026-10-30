import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { X, ChevronLeft, ChevronRight, Camera } from "lucide-react";
import LeadFormPopup from "./LeadFormPopup";
import { projectGallery } from "@/data/projectGallery";
import { getGalleryCovers, orderGalleryItems } from "@/data/gallerySelection";

// Share the visually reviewed selection with the premium gallery.
const GALLERY_ITEMS = orderGalleryItems(projectGallery).map((item, i) => ({
  ...item,
  id: i + 1,
  altText: item.alt,
}));
const CATEGORIES = ["All", "Interior", "Wallpaper", "Exterior", "Commercial"];

// Each finished view is shown once.
function GalleryCard({ item, onClick }) {
  return (
    <button
      type="button"
      onClick={(event) => onClick(event)}
      className="relative flex-shrink-0 cursor-pointer rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 group/card focus-visible:outline focus-visible:outline-4 focus-visible:outline-amber-500 focus-visible:outline-offset-2"
      aria-label={`Open project photo: ${item.title}${item.photoCount > 1 ? ` (${item.photoCount} photos)` : ""}`}
      style={{
        width: "100%",
        aspectRatio: "1",
      }}
    >
      <img
        src={`/gallery/thumbnails/${item.file.replace('.webp', '_thumb.webp')}`}
        alt={item.altText}
        loading="lazy"
        decoding="async"
        className="gallery-img w-full h-full object-cover rounded-2xl transition-transform duration-300 group-hover/card:scale-105"
        style={{ imageOrientation: "from-image", transform: `rotate(${item.rotation}deg)` }}
      />
      {item.photoCount > 1 ? (
        <span className="absolute bottom-2 right-2 rounded-full bg-black/75 px-3 py-1 text-xs text-white">
          {item.photoCount} photos
        </span>
      ) : null}
    </button>
  );
}

export default function PortfolioSection() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isLeadFormOpen, setIsLeadFormOpen] = useState(false);
  const [sectionVisible, setSectionVisible] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const sectionRef = useRef(null);
  const lightboxRef = useRef(null);
  const closeLightboxButtonRef = useRef(null);
  const previouslyFocusedElement = useRef(null);

  const filtered = useMemo(
    () => activeFilter === "All"
      ? GALLERY_ITEMS
      : GALLERY_ITEMS.filter(item => item.category === activeFilter),
    [activeFilter]
  );

  const coverItems = useMemo(() => getGalleryCovers(filtered), [filtered]);

  const categoryCounts = useMemo(() => {
    const counts = {};
    for (const item of GALLERY_ITEMS) {
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
        "py-16 md:py-24 bg-gradient-to-b from-slate-50 to-white overflow-hidden",
        "transition-all duration-700 ease-out",
        sectionVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
      ].join(" ")}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10 md:mb-14">
          <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold uppercase tracking-wider px-4 py-1.5 rounded-full mb-4">
            <Camera size={13} />
            Our Work
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight mb-4">
            Real Projects, Real Results
          </h2>
          <p className="text-slate-500 text-base md:text-lg max-w-xl mx-auto">
            Explore finished interiors, wallcoverings and exterior details.
          </p>
        </div>

        {/* Filter pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              aria-pressed={activeFilter === cat}
              className={[
                "min-h-[44px] px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200",
                activeFilter === cat
                  ? "bg-amber-500 text-white shadow-md shadow-amber-200"
                  : "bg-white text-slate-600 border border-slate-200 hover:border-amber-300 hover:text-amber-700",
              ].join(" ")}
            >
              {cat} {cat !== "All" ? `(${categoryCounts[cat] || 0})` : ""}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {coverItems.map((item) => (
          <GalleryCard
            key={item.file}
            item={item}
            onClick={(event) => openLightbox(filtered.findIndex((photo) => photo.file === item.file), event.currentTarget)}
          />
        ))}
      </div>

      {/* CTA below the gallery */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        {/* CTA */}
        <div className="mt-12 text-center">
          <p className="text-slate-500 text-base mb-4">
            Like what you see? Tell us about your project.
          </p>
          <button
            onClick={() => setIsLeadFormOpen(true)}
            className="btn-primary inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-base rounded-full shadow-lg shadow-amber-200 transition-all duration-200"
          >
            Discuss Your Project
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
              style={{ imageOrientation: "from-image", transform: `rotate(${currentItem.rotation}deg)` }}
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

      <style>{`
        .gallery-img {
          filter: brightness(1.1) contrast(1.05);
          transition: filter 0.3s ease;
        }
        .gallery-img:hover {
          filter: brightness(1.15) contrast(1.08);
        }
      `}</style>
    </section>
  );
}
