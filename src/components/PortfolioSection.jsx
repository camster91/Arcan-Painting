import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { X, ChevronLeft, ChevronRight, Camera } from "lucide-react";
import LeadFormPopup from "./LeadFormPopup";
import galleryTags from "@/data/gallery-tags.json";

// ─── Build gallery items from AI-generated tags ──────────────────────────────
function buildGalleryItems() {
  const entries = Object.entries(galleryTags).map(([file, tag], i) => {
    const isVideo = file.includes("_video.webp");
    // Map category: residential+exterior→Exterior, commercial→Commercial, else→Interior
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

  // Group by project date, keep best 4 per project
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

  // Sort: highest quality first within each category, newest first for ties
  curated.sort((a, b) => b.qualityScore - a.qualityScore || b.projectDate.localeCompare(a.projectDate));

  return curated;
}

const GALLERY_ITEMS = buildGalleryItems();
const CATEGORIES = ["All", "Interior", "Exterior", "Commercial"];

export default function PortfolioSection() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isLeadFormOpen, setIsLeadFormOpen] = useState(false);
  const [sectionVisible, setSectionVisible] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const carouselRef = useRef(null);
  const sectionRef = useRef(null);

  const filtered = useMemo(
    () => activeFilter === "All"
      ? GALLERY_ITEMS
      : GALLERY_ITEMS.filter(item => item.category === activeFilter),
    [activeFilter]
  );

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

  // Keyboard nav for lightbox
  useEffect(() => {
    if (!lightboxOpen) return;
    const handler = (e) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") prevLightbox();
      if (e.key === "ArrowRight") nextLightbox();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxOpen, lightboxIndex, filtered.length]);

  const openLightbox = useCallback((idx) => {
    setLightboxIndex(idx);
    setLightboxOpen(true);
    document.body.style.overflow = "hidden";
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
    document.body.style.overflow = "";
  }, []);

  const prevLightbox = useCallback(() => {
    setLightboxIndex(i => (i - 1 + filtered.length) % filtered.length);
  }, [filtered.length]);

  const nextLightbox = useCallback(() => {
    setLightboxIndex(i => (i + 1) % filtered.length);
  }, [filtered.length]);

  // Carousel scroll
  const scrollCarousel = (direction) => {
    if (!carouselRef.current) return;
    const scrollAmount = carouselRef.current.offsetWidth * 0.8;
    carouselRef.current.scrollBy({
      left: direction === "next" ? scrollAmount : -scrollAmount,
      behavior: "smooth"
    });
  };

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
        "py-16 md:py-24 bg-gradient-to-b from-slate-50 to-white",
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
            Browse real photos from our painting projects across the GTA.
            Every project painted by the Cañabate family — no subcontractors, ever.
          </p>
        </div>

        {/* Filter pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
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

        {/* Carousel container */}
        <div className="relative group">
          {/* Scroll buttons (desktop) */}
          <button
            onClick={() => scrollCarousel("prev")}
            className="hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white border border-slate-200 rounded-full shadow-lg items-center justify-center text-slate-600 hover:text-amber-600 hover:border-amber-300 transition-all opacity-0 group-hover:opacity-100"
            aria-label="Previous"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => scrollCarousel("next")}
            className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white border border-slate-200 rounded-full shadow-lg items-center justify-center text-slate-600 hover:text-amber-600 hover:border-amber-300 transition-all opacity-0 group-hover:opacity-100"
            aria-label="Next"
          >
            <ChevronRight size={20} />
          </button>

          {/* Scrollable carousel */}
          <div
            ref={carouselRef}
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4"
            style={{ WebkitOverflowScrolling: "touch", scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {filtered.map((item, index) => (
              <div
                key={item.id}
                onClick={() => openLightbox(index)}
                className="flex-shrink-0 snap-start cursor-pointer group/card relative rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300"
                style={{ width: "min(280px, 75vw)" }}
              >
                <div className="aspect-[3/4] relative">
                  <img
                    src={`/gallery/thumbnails/${item.file.replace('.webp', '_thumb.webp')}`}
                    alt={item.altText}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover/card:scale-105"
                    style={{ imageOrientation: "from-image" }}
                  />
                  {/* Category badge */}
                  <span className="absolute top-2 left-2 text-[11px] font-medium px-2.5 py-1 rounded-full bg-black/40 text-white backdrop-blur-sm">
                    {item.isVideo ? "📹 Video still" : item.category}
                  </span>
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 flex items-end p-3">
                    <p className="text-white text-sm font-medium">{item.title}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Scroll hint on mobile */}
          <div className="md:hidden text-center mt-2">
            <span className="text-slate-400 text-xs">← Swipe to see more →</span>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <p className="text-slate-500 text-base mb-4">
            Like what you see? Get a free, no-obligation estimate.
          </p>
          <button
            onClick={() => setIsLeadFormOpen(true)}
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-base px-8 py-4 rounded-full shadow-lg shadow-amber-200 transition-all duration-200 min-h-[56px]"
          >
            Get Your Free Quote
          </button>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && currentItem && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 z-10 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center"
          >
            <X size={24} className="text-white" />
          </button>
          <button
            onClick={prevLightbox}
            className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center"
          >
            <ChevronLeft size={24} className="text-white" />
          </button>
          <button
            onClick={nextLightbox}
            className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center"
          >
            <ChevronRight size={24} className="text-white" />
          </button>
          <div className="max-w-5xl w-full h-full flex items-center justify-center p-4">
            <img
              src={`/gallery/images/${currentItem.file}`}
              alt={currentItem.altText}
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
              style={{ imageOrientation: "from-image" }}
            />
          </div>
          <div className="absolute bottom-4 left-4 text-white/70 text-sm">
            {lightboxIndex + 1} / {filtered.length}
          </div>
          <div className="absolute bottom-4 right-4 text-white/70 text-sm">
            {currentItem.title} · {currentItem.category}
          </div>
        </div>
      )}

      <LeadFormPopup isOpen={isLeadFormOpen} onClose={() => setIsLeadFormOpen(false)} source="gallery_cta" />

      {/* Hide scrollbar CSS */}
      <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; }`}</style>
    </section>
  );
}
