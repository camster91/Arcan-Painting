import { useState, useEffect, useRef, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, Camera, Play } from "lucide-react";
import LeadFormPopup from "./LeadFormPopup";

// ─── Real gallery data (65 images + 5 video stills, curated & deduplicated) ──
const GALLERY_ITEMS = [
  // Video stills (mid-frame thumbnails from real project videos)
  { id: "v1", file: "PXL_20260313_212046509_video.webp", category: "Interior", title: "Painting in Progress", isVideo: true },
  { id: "v2", file: "PXL_20260213_194740208_video.webp", category: "Interior", title: "Project Walkthrough", isVideo: true },
  { id: "v3", file: "PXL_20251106_144856945_video.webp", category: "Interior", title: "Interior Painting", isVideo: true },
  { id: "v4", file: "VID-20260212-WA0034_video.webp", category: "Interior", title: "Work in Progress", isVideo: true },
  { id: "v5", file: "VID-20260213-WA0004_video.webp", category: "Interior", title: "Painting Detail", isVideo: true },
  // 2025-2026 projects (newest work)
  { id: 1, file: "IMG-20260212-WA0016.webp", category: "Interior", title: "Staircase Refinishing" },
  { id: 2, file: "PXL_20260313_212041611.webp", category: "Interior", title: "Interior Painting" },
  { id: 3, file: "PXL_20260213_210915996.webp", category: "Interior", title: "Interior Painting" },
  { id: 4, file: "PXL_20260213_211346296.webp", category: "Interior", title: "Interior Painting" },
  { id: 5, file: "IMG-20260210-WA0000.webp", category: "Interior", title: "Interior Painting" },
  { id: 6, file: "IMG-20260210-WA0003.webp", category: "Interior", title: "Interior Painting" },
  { id: 7, file: "IMG-20260212-WA0018.webp", category: "Interior", title: "Interior Painting" },
  { id: 8, file: "IMG-20260212-WA0019.webp", category: "Interior", title: "Interior Painting" },
  { id: 9, file: "IMG-20260212-WA0021.webp", category: "Interior", title: "Interior Painting" },
  { id: 10, file: "IMG-20260212-WA0022.webp", category: "Interior", title: "Interior Painting" },
  { id: 11, file: "IMG-20260212-WA0023.webp", category: "Interior", title: "Interior Painting" },
  { id: 12, file: "IMG-20260212-WA0024.webp", category: "Interior", title: "Interior Painting" },
  { id: 13, file: "IMG-20260217-WA0016.webp", category: "Commercial", title: "Commercial Space" },
  { id: 14, file: "IMG-20260217-WA0017.webp", category: "Commercial", title: "Commercial Space" },
  { id: 15, file: "IMG-20260217-WA0018.webp", category: "Commercial", title: "Commercial Space" },
  { id: 16, file: "IMG-20260217-WA0019.webp", category: "Commercial", title: "Commercial Space" },
  { id: 17, file: "IMG-20260217-WA0020.webp", category: "Commercial", title: "Commercial Space" },
  { id: 18, file: "IMG-20260217-WA0021.webp", category: "Commercial", title: "Commercial Space" },
  { id: 19, file: "IMG-20260217-WA0022.webp", category: "Commercial", title: "Commercial Space" },
  { id: 20, file: "PXL_20251018_142500065.webp", category: "Exterior", title: "Exterior Painting" },
  { id: 21, file: "PXL_20251016_201542360.webp", category: "Interior", title: "Interior Painting" },
  { id: 22, file: "PXL_20251009_152611793.webp", category: "Interior", title: "Interior Painting" },
  { id: 23, file: "PXL_20251009_164317186.webp", category: "Interior", title: "Interior Painting" },
  { id: 24, file: "PXL_20251009_165546627.webp", category: "Interior", title: "Interior Painting" },
  { id: 25, file: "PXL_20251009_180850831.webp", category: "Interior", title: "Interior Painting" },
  { id: 26, file: "PXL_20251009_180904253.webp", category: "Interior", title: "Interior Painting" },
  { id: 27, file: "PXL_20251009_184229024.webp", category: "Interior", title: "Interior Painting" },
  { id: 28, file: "PXL_20251009_184239255.webp", category: "Interior", title: "Interior Painting" },
  { id: 29, file: "PXL_20251009_200610576.webp", category: "Interior", title: "Interior Painting" },
  { id: 30, file: "PXL_20251009_205103782.webp", category: "Interior", title: "Interior Painting" },
  { id: 31, file: "PXL_20251009_213933435.webp", category: "Interior", title: "Interior Painting" },
  { id: 32, file: "20251012_140909.webp", category: "Exterior", title: "Exterior Painting" },
  { id: 33, file: "20251012_165336.webp", category: "Exterior", title: "Exterior Painting" },
  { id: 34, file: "20251008_120210.webp", category: "Interior", title: "Interior Painting" },
  { id: 35, file: "PXL_20250902_133955998.webp", category: "Interior", title: "Interior Painting" },
  { id: 36, file: "PXL_20250902_134004778.webp", category: "Interior", title: "Interior Painting" },
  { id: 37, file: "PXL_20250902_151308442.webp", category: "Interior", title: "Interior Painting" },
  { id: 38, file: "PXL_20250902_151315576.webp", category: "Interior", title: "Interior Painting" },
  { id: 39, file: "PXL_20250902_181230249.webp", category: "Interior", title: "Interior Painting" },
  { id: 40, file: "PXL_20250902_181247007.webp", category: "Interior", title: "Interior Painting" },
  { id: 41, file: "PXL_20250217_224338011_MP.webp", category: "Interior", title: "Interior Painting" },
  // Older projects
  { id: 42, file: "PXL_20240715_194939243_MP.webp", category: "Exterior", title: "Exterior Painting" },
  { id: 43, file: "PXL_20240506_133509833_MP.webp", category: "Interior", title: "Interior Painting" },
  { id: 44, file: "PXL_20240507_232710177_MP.webp", category: "Interior", title: "Interior Painting" },
  { id: 45, file: "PXL_20230716_234552246_MP.webp", category: "Exterior", title: "Exterior Painting" },
  { id: 46, file: "PXL_20220416_153255477.webp", category: "Interior", title: "Interior Painting" },
  { id: 47, file: "PXL_20210109_221844861.webp", category: "Interior", title: "Interior Painting" },
  { id: 48, file: "PXL_20200928_183711726.webp", category: "Interior", title: "Interior Painting" },
  { id: 49, file: "IMG_20191201_125943_MP.webp", category: "Interior", title: "Interior Painting" },
  { id: 50, file: "20180723_133033.webp", category: "Interior", title: "Interior Painting" },
  { id: 51, file: "20180625_090401.webp", category: "Exterior", title: "Exterior Painting" },
  { id: 52, file: "20180516_145706.webp", category: "Interior", title: "Interior Painting" },
  { id: 53, file: "20170116_143904.webp", category: "Interior", title: "Interior Painting" },
  { id: 54, file: "20170116_143917.webp", category: "Interior", title: "Interior Painting" },
  { id: 55, file: "20170106_165738.webp", category: "Interior", title: "Interior Painting" },
  { id: 56, file: "20161229_164826.webp", category: "Interior", title: "Interior Painting" },
  { id: 57, file: "20161213_103137.webp", category: "Interior", title: "Interior Painting" },
  { id: 58, file: "20161213_103144.webp", category: "Interior", title: "Interior Painting" },
  { id: 59, file: "20160921_090451.webp", category: "Interior", title: "Interior Painting" },
  { id: 60, file: "20160902_170415.webp", category: "Interior", title: "Interior Painting" },
  { id: 61, file: "20160901_105150.webp", category: "Interior", title: "Interior Painting" },
  { id: 62, file: "20160808_152240.webp", category: "Exterior", title: "Exterior Painting" },
  { id: 63, file: "20160808_152306.webp", category: "Exterior", title: "Exterior Painting" },
  { id: 64, file: "20160713_091616.webp", category: "Interior", title: "Interior Painting" },
  { id: 65, file: "20160713_142534.webp", category: "Interior", title: "Interior Painting" },
];

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

  const filtered = activeFilter === "All"
    ? GALLERY_ITEMS
    : GALLERY_ITEMS.filter(item => item.category === activeFilter);

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
              {cat} {cat !== "All" ? `(${GALLERY_ITEMS.filter(i => i.category === cat).length})` : ""}
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
                    alt={item.title}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover/card:scale-105"
                  />
                  {/* Video play icon */}
                  {item.isVideo && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                        <Play size={22} className="text-slate-800 ml-1" fill="currentColor" />
                      </div>
                    </div>
                  )}
                  {/* Category badge */}
                  <span className="absolute top-2 left-2 text-[11px] font-medium px-2.5 py-1 rounded-full bg-black/40 text-white backdrop-blur-sm">
                    {item.isVideo ? "📹 Video" : item.category}
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
              alt={currentItem.title}
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
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
