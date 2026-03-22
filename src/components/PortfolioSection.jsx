import { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Play,
  Camera,
} from "lucide-react";
import LeadFormPopup from "./LeadFormPopup";

// ─── Real gallery data ───────────────────────────────────────────────────────
// All media converted to WebP/WebM from Gerardo's actual project photos/videos
const GALLERY_ITEMS = [
  // 2016 Projects
  { id: 1, file: "20160713_091616.webp", category: "Interior", title: "Interior Project", year: "2016" },
  { id: 2, file: "20160713_142534.webp", category: "Interior", title: "Interior Project", year: "2016" },
  { id: 3, file: "20160808_152240.webp", category: "Exterior", title: "Exterior Project", year: "2016" },
  { id: 4, file: "20160808_152306.webp", category: "Exterior", title: "Exterior Project", year: "2016" },
  { id: 5, file: "20160901_105150.webp", category: "Interior", title: "Interior Project", year: "2016" },
  { id: 6, file: "20160902_170415.webp", category: "Interior", title: "Interior Project", year: "2016" },
  { id: 7, file: "20160921_090451.webp", category: "Interior", title: "Interior Project", year: "2016" },
  { id: 8, file: "20161213_103137.webp", category: "Interior", title: "Interior Project", year: "2016" },
  { id: 9, file: "20161213_103144.webp", category: "Interior", title: "Interior Project", year: "2016" },
  { id: 10, file: "20161229_164826.webp", category: "Interior", title: "Interior Project", year: "2016" },
  // 2017
  { id: 11, file: "20170106_165738.webp", category: "Interior", title: "Interior Project", year: "2017" },
  { id: 12, file: "20170116_143904.webp", category: "Interior", title: "Interior Project", year: "2017" },
  { id: 13, file: "20170116_143917.webp", category: "Interior", title: "Interior Project", year: "2017" },
  // 2018
  { id: 14, file: "20180516_145706.webp", category: "Interior", title: "Interior Project", year: "2018" },
  { id: 15, file: "20180625_090401.webp", category: "Exterior", title: "Exterior Project", year: "2018" },
  { id: 16, file: "20180723_133033.webp", category: "Interior", title: "Interior Project", year: "2018" },
  // 2019
  { id: 17, file: "IMG_20191201_125943_MP.webp", category: "Interior", title: "Interior Project", year: "2019" },
  // 2020
  { id: 18, file: "PXL_20200928_183711726.webp", category: "Interior", title: "Interior Project", year: "2020" },
  { id: 19, file: "PXL_20200928_183732550_PORTRAIT.webp", category: "Interior", title: "Interior Project", year: "2020" },
  // 2021
  { id: 20, file: "PXL_20210109_221844861.webp", category: "Interior", title: "Interior Project", year: "2021" },
  // 2022
  { id: 21, file: "PXL_20220416_153255477.webp", category: "Interior", title: "Interior Project", year: "2022" },
  // 2023
  { id: 22, file: "PXL_20230716_234552246_MP.webp", category: "Exterior", title: "Exterior Project", year: "2023" },
  // 2024
  { id: 23, file: "PXL_20240506_133509833_MP.webp", category: "Interior", title: "Interior Project", year: "2024" },
  { id: 24, file: "PXL_20240507_232710177_MP.webp", category: "Interior", title: "Interior Project", year: "2024" },
  { id: 25, file: "PXL_20240715_194939243_MP.webp", category: "Exterior", title: "Exterior Project", year: "2024" },
  // 2025
  { id: 26, file: "PXL_20250217_224338011_MP.webp", category: "Interior", title: "Interior Project", year: "2025" },
  { id: 27, file: "PXL_20250902_133955998.webp", category: "Interior", title: "Interior Project", year: "2025" },
  { id: 28, file: "PXL_20250902_134004778.webp", category: "Interior", title: "Interior Project", year: "2025" },
  { id: 29, file: "PXL_20250902_151308442.webp", category: "Interior", title: "Interior Project", year: "2025" },
  { id: 30, file: "PXL_20250902_151315576.webp", category: "Interior", title: "Interior Project", year: "2025" },
  { id: 31, file: "PXL_20250902_181230249.webp", category: "Interior", title: "Interior Project", year: "2025" },
  { id: 32, file: "PXL_20250902_181247007.webp", category: "Interior", title: "Interior Project", year: "2025" },
  { id: 33, file: "20251008_120210.webp", category: "Interior", title: "Interior Project", year: "2025" },
  { id: 34, file: "20251012_140909.webp", category: "Exterior", title: "Exterior Project", year: "2025" },
  { id: 35, file: "20251012_165336.webp", category: "Exterior", title: "Exterior Project", year: "2025" },
  { id: 36, file: "PXL_20251009_152611793.webp", category: "Interior", title: "Interior Project", year: "2025" },
  { id: 37, file: "PXL_20251009_163644785.webp", category: "Interior", title: "Interior Project", year: "2025" },
  { id: 38, file: "PXL_20251009_164317186.webp", category: "Interior", title: "Interior Project", year: "2025" },
  { id: 39, file: "PXL_20251009_165546627.webp", category: "Interior", title: "Interior Project", year: "2025" },
  { id: 40, file: "PXL_20251009_180850831.webp", category: "Interior", title: "Interior Project", year: "2025" },
  { id: 41, file: "PXL_20251009_180904253.webp", category: "Interior", title: "Interior Project", year: "2025" },
  { id: 42, file: "PXL_20251009_184229024.webp", category: "Interior", title: "Interior Project", year: "2025" },
  { id: 43, file: "PXL_20251009_184239255.webp", category: "Interior", title: "Interior Project", year: "2025" },
  { id: 44, file: "PXL_20251009_200610576.webp", category: "Interior", title: "Interior Project", year: "2025" },
  { id: 45, file: "PXL_20251009_205103782.webp", category: "Interior", title: "Interior Project", year: "2025" },
  { id: 46, file: "PXL_20251009_213933435.webp", category: "Interior", title: "Interior Project", year: "2025" },
  { id: 47, file: "PXL_20251016_201542360.webp", category: "Interior", title: "Interior Project", year: "2025" },
  { id: 48, file: "PXL_20251018_142500065.webp", category: "Exterior", title: "Exterior Project", year: "2025" },
  // 2026
  { id: 49, file: "IMG-20260114-WA0000.webp", category: "Interior", title: "Interior Project", year: "2026" },
  { id: 50, file: "IMG-20260210-WA0000.webp", category: "Interior", title: "Interior Project", year: "2026" },
  { id: 51, file: "IMG-20260210-WA0003.webp", category: "Interior", title: "Interior Project", year: "2026" },
  { id: 52, file: "IMG-20260212-WA0016.webp", category: "Interior", title: "Staircase Refinishing", year: "2026" },
  { id: 53, file: "IMG-20260212-WA0017.webp", category: "Interior", title: "Interior Project", year: "2026" },
  { id: 54, file: "IMG-20260212-WA0018.webp", category: "Interior", title: "Interior Project", year: "2026" },
  { id: 55, file: "IMG-20260212-WA0019.webp", category: "Interior", title: "Interior Project", year: "2026" },
  { id: 56, file: "IMG-20260212-WA0020.webp", category: "Interior", title: "Interior Project", year: "2026" },
  { id: 57, file: "IMG-20260212-WA0021.webp", category: "Interior", title: "Interior Project", year: "2026" },
  { id: 58, file: "IMG-20260212-WA0022.webp", category: "Interior", title: "Interior Project", year: "2026" },
  { id: 59, file: "IMG-20260212-WA0023.webp", category: "Interior", title: "Interior Project", year: "2026" },
  { id: 60, file: "IMG-20260212-WA0024.webp", category: "Interior", title: "Interior Project", year: "2026" },
  { id: 61, file: "IMG-20260212-WA0025.webp", category: "Interior", title: "Interior Project", year: "2026" },
  { id: 62, file: "IMG-20260217-WA0016.webp", category: "Commercial", title: "Commercial Project", year: "2026" },
  { id: 63, file: "IMG-20260217-WA0017.webp", category: "Commercial", title: "Commercial Project", year: "2026" },
  { id: 64, file: "IMG-20260217-WA0018.webp", category: "Commercial", title: "Commercial Project", year: "2026" },
  { id: 65, file: "IMG-20260217-WA0019.webp", category: "Commercial", title: "Commercial Project", year: "2026" },
  { id: 66, file: "IMG-20260217-WA0020.webp", category: "Commercial", title: "Commercial Project", year: "2026" },
  { id: 67, file: "IMG-20260217-WA0021.webp", category: "Commercial", title: "Commercial Project", year: "2026" },
  { id: 68, file: "IMG-20260217-WA0022.webp", category: "Commercial", title: "Commercial Project", year: "2026" },
  { id: 69, file: "PXL_20260213_210915996.webp", category: "Interior", title: "Interior Project", year: "2026" },
  { id: 70, file: "PXL_20260213_211346296.webp", category: "Interior", title: "Interior Project", year: "2026" },
  { id: 71, file: "PXL_20260313_212041611.webp", category: "Interior", title: "Interior Project", year: "2026" },
];

// Videos
const VIDEO_ITEMS = [
  { id: "v1", file: "20171120_153713.webm", thumb: "20171120_153713_thumb.webp", category: "Interior", title: "Interior Painting", year: "2017" },
  { id: "v2", file: "20171122_114556.webm", thumb: "20171122_114556_thumb.webp", category: "Interior", title: "Interior Painting", year: "2017" },
  { id: "v3", file: "PXL_20220121_200002748.webm", thumb: "PXL_20220121_200002748_thumb.webp", category: "Interior", title: "Interior Painting", year: "2022" },
  { id: "v4", file: "PXL_20250212_211758059.webm", thumb: "PXL_20250212_211758059_thumb.webp", category: "Interior", title: "Interior Painting", year: "2025" },
  { id: "v5", file: "PXL_20250902_151240474.webm", thumb: "PXL_20250902_151240474_thumb.webp", category: "Interior", title: "Interior Painting", year: "2025" },
];

const CATEGORIES = ["All", "Interior", "Exterior", "Commercial"];
const ITEMS_PER_PAGE = 12;

export default function PortfolioSection() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isLeadFormOpen, setIsLeadFormOpen] = useState(false);
  const [sectionVisible, setSectionVisible] = useState(false);
  const [touchStart, setTouchStart] = useState(null);

  const sectionRef = useRef(null);
  const loadMoreRef = useRef(null);

  // Combine images and videos
  const allItems = [
    ...VIDEO_ITEMS.slice(0, 3).map((v) => ({ ...v, type: "video" })),
    ...GALLERY_ITEMS.map((img) => ({ ...img, type: "image" })),
    ...VIDEO_ITEMS.slice(3).map((v) => ({ ...v, type: "video" })),
  ];

  const filtered =
    activeFilter === "All"
      ? allItems
      : allItems.filter((item) => item.category === activeFilter);

  const displayed = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

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

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisibleCount((c) => Math.min(c + ITEMS_PER_PAGE, allItems.length));
        }
      },
      { rootMargin: "200px" }
    );
    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [allItems.length]);

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
  }, [lightboxOpen, lightboxIndex]);

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
    setLightboxIndex((i) => (i - 1 + displayed.length) % displayed.length);
  }, [displayed.length]);

  const nextLightbox = useCallback(() => {
    setLightboxIndex((i) => (i + 1) % displayed.length);
  }, [displayed.length]);

  // Swipe handlers for lightbox
  const handleTouchStart = (e) => setTouchStart(e.touches[0].clientX);
  const handleTouchEnd = (e) => {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      diff > 0 ? nextLightbox() : prevLightbox();
    }
    setTouchStart(null);
  };

  const getMediaSrc = (item) => {
    if (item.type === "video") return `/gallery/videos/${item.file}`;
    return `/gallery/images/${item.file}`;
  };

  const getThumbSrc = (item) => {
    if (item.type === "video") return `/gallery/thumbnails/${item.thumb}`;
    const name = item.file.replace(".webp", "");
    return `/gallery/thumbnails/${name}_thumb.webp`;
  };

  const currentItem = displayed[lightboxIndex];

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
            Browse real photos and videos from our painting projects across the GTA.
            Every project painted by the Cañabate family — no subcontractors, ever.
          </p>
        </div>

        {/* Filter pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setActiveFilter(cat);
                setVisibleCount(ITEMS_PER_PAGE);
              }}
              className={[
                "min-h-[44px] px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200",
                activeFilter === cat
                  ? "bg-amber-500 text-white shadow-md shadow-amber-200"
                  : "bg-white text-slate-600 border border-slate-200 hover:border-amber-300 hover:text-amber-700",
              ].join(" ")}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Count */}
        <p className="text-center text-slate-400 text-sm mb-8">
          Showing {displayed.length} of {filtered.length} items
        </p>

        {/* Gallery grid — 1 col mobile, 2 tablet, 3 desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {displayed.map((item, index) => (
            <div
              key={item.id}
              onClick={() => openLightbox(index)}
              className={[
                "group relative aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer",
                "shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.02]",
                sectionVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
              ].join(" ")}
              style={{ transitionDelay: `${Math.min(index * 40, 300)}ms` }}
            >
              <img
                src={getThumbSrc(item)}
                alt={item.title}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />

              {/* Video play icon */}
              {item.type === "video" && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                    <Play size={22} className="text-slate-800 ml-1" />
                  </div>
                </div>
              )}

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <p className="font-semibold text-sm">{item.title}</p>
                  <p className="text-xs text-white/80">{item.category} · {item.year}</p>
                </div>
              </div>

              {/* Category badge */}
              <div className="absolute top-2 left-2">
                <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-black/40 text-white backdrop-blur-sm">
                  {item.category}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Load more sentinel */}
        {hasMore && <div ref={loadMoreRef} className="h-4 mt-4" />}

        {/* CTA */}
        <div className="mt-14 text-center">
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
            {currentItem.type === "video" ? (
              <video
                key={currentItem.id}
                controls
                autoPlay
                className="max-w-full max-h-[85vh] rounded-lg"
              >
                <source src={getMediaSrc(currentItem)} type="video/webm" />
              </video>
            ) : (
              <img
                src={getMediaSrc(currentItem)}
                alt={currentItem.title}
                className="max-w-full max-h-[85vh] object-contain rounded-lg"
              />
            )}
          </div>

          <div className="absolute bottom-4 left-4 text-white/70 text-sm">
            {lightboxIndex + 1} / {displayed.length}
          </div>
          <div className="absolute bottom-4 right-4 text-white/70 text-sm">
            {currentItem.title} · {currentItem.year}
          </div>
        </div>
      )}

      <LeadFormPopup isOpen={isLeadFormOpen} onClose={() => setIsLeadFormOpen(false)} source="gallery_cta" />
    </section>
  );
}
