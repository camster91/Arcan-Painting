import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { X, ChevronLeft, ChevronRight, Camera } from "lucide-react";
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

// Two-row scrolling gallery component (mirrors GoogleReviewsSection pattern)
function GalleryCard({ item, onClick }) {
  return (
    <div
      onClick={onClick}
      className="flex-shrink-0 cursor-pointer rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 group/card"
      style={{
        width: "clamp(140px, 28vw, 260px)",
        height: "clamp(140px, 28vw, 260px)",
      }}
    >
      <img
        src={`/gallery/thumbnails/${item.file.replace('.webp', '_thumb.webp')}`}
        alt={item.altText}
        loading="lazy"
        decoding="async"
        className="gallery-img w-full h-full object-cover rounded-2xl transition-transform duration-300 group-hover/card:scale-105"
        style={{ imageOrientation: "from-image" }}
      />
    </div>
  );
}

function ScrollingRow({ items, direction = "left", paused, onItemClick }) {
  const rowRef = useRef(null);
  const animRef = useRef(null);
  const posRef = useRef(0);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartPos = useRef(0);
  const touchStartX = useRef(0);
  const touchMoved = useRef(false);
  const [localPaused, setLocalPaused] = useState(false);

  const isPaused = paused || localPaused;
  const speed = direction === "left" ? 0.35 : -0.35;

  // Duplicate for seamless loop
  const tripled = [...items, ...items, ...items];

  const animate = useCallback(() => {
    if (!rowRef.current) return;
    if (!isPaused && !isDragging.current) {
      posRef.current -= speed;
    }
    const totalWidth = rowRef.current.scrollWidth / 3;
    if (direction === "left" && posRef.current <= -totalWidth) {
      posRef.current += totalWidth;
    } else if (direction === "right" && posRef.current >= 0) {
      posRef.current -= totalWidth;
    }
    rowRef.current.style.transform = `translateX(${posRef.current}px)`;
    animRef.current = requestAnimationFrame(animate);
  }, [isPaused, speed, direction]);

  useEffect(() => {
    if (direction === "right" && rowRef.current) {
      const totalWidth = rowRef.current.scrollWidth / 3;
      posRef.current = -totalWidth;
    }
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [animate, direction]);

  // Mouse drag for desktop
  const handleMouseDown = (e) => {
    // Only start drag if it's a primary mouse button (left click)
    if (e.button !== 0) return;
    isDragging.current = true;
    dragStartX.current = e.clientX;
    dragStartPos.current = posRef.current;
    setLocalPaused(true);
    e.preventDefault();
  };
  const handleMouseMove = (e) => {
    if (!isDragging.current || !rowRef.current) return;
    posRef.current = dragStartPos.current + (e.clientX - dragStartX.current);
    rowRef.current.style.transform = `translateX(${posRef.current}px)`;
  };
  const handleMouseUp = () => {
    isDragging.current = false;
    setTimeout(() => setLocalPaused(false), 2000);
  };

  // Natural touch scroll + drag for mobile/tablet
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    dragStartPos.current = posRef.current;
    touchMoved.current = false;
    isDragging.current = false; // Let native scroll handle it initially
    setLocalPaused(true);
  };
  const handleTouchMove = (e) => {
    const dx = Math.abs(e.touches[0].clientX - touchStartX.current);
    if (dx > 8 && !isDragging.current) {
      // User is scrolling horizontally — take over
      isDragging.current = true;
      dragStartX.current = touchStartX.current;
      touchMoved.current = true;
    }
    if (isDragging.current && rowRef.current) {
      // Override native scroll
      e.preventDefault();
      posRef.current = dragStartPos.current + (e.touches[0].clientX - dragStartX.current);
      rowRef.current.style.transform = `translateX(${posRef.current}px)`;
    }
  };
  const handleTouchEnd = () => {
    isDragging.current = false;
    setTimeout(() => {
      setLocalPaused(false);
      touchMoved.current = false;
    }, touchMoved.current ? 3000 : 500);
  };

  return (
    <div
      className="overflow-hidden cursor-grab active:cursor-grabbing select-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        ref={rowRef}
        className="flex gap-3 sm:gap-4 will-change-transform"
        style={{ touchAction: "none" }}
      >
        {tripled.map((item, i) => (
          <GalleryCard
            key={`${item.id}-${i}`}
            item={item}
            onClick={() => {
              // items is the original array (index 0 to items.length-1 in the middle copy)
              // Middle copy starts at index items.length
              const midStart = items.length;
              const idx = i < midStart ? i : (i < midStart + items.length ? i - midStart : i - midStart * 2);
              onItemClick(idx);
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default function PortfolioSection() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isLeadFormOpen, setIsLeadFormOpen] = useState(false);
  const [sectionVisible, setSectionVisible] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const sectionRef = useRef(null);

  const filtered = useMemo(
    () => activeFilter === "All"
      ? GALLERY_ITEMS
      : GALLERY_ITEMS.filter(item => item.category === activeFilter),
    [activeFilter]
  );

  const ROW_1 = useMemo(() => filtered.slice(0, Math.ceil(filtered.length / 2)), [filtered]);
  const ROW_2 = useMemo(() => filtered.slice(Math.ceil(filtered.length / 2)), [filtered]);

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

  // For row click: map row-local index back to filtered index
  const handleRow1Click = useCallback((rowIdx) => {
    openLightbox(rowIdx);
  }, [openLightbox]);

  const handleRow2Click = useCallback((rowIdx) => {
    openLightbox(ROW_1.length + rowIdx);
  }, [openLightbox, ROW_1.length]);

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
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
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
      </div>

      {/* Two-row auto-scrolling gallery — full viewport width */}
      <div className="px-2 sm:px-4 md:px-8 lg:px-12 space-y-3 sm:space-y-4">
        {ROW_1.length > 0 && (
          <ScrollingRow
            items={ROW_1}
            direction="left"
            paused={hovered}
            onItemClick={handleRow1Click}
          />
        )}
        {ROW_2.length > 0 && (
          <ScrollingRow
            items={ROW_2}
            direction="right"
            paused={hovered}
            onItemClick={handleRow2Click}
          />
        )}
      </div>

      {/* CTA below the gallery */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        {/* CTA */}
        <div className="mt-12 text-center">
          <p className="text-slate-500 text-base mb-4">
            Like what you see? Get a free, no-obligation estimate.
          </p>
          <button
            onClick={() => setIsLeadFormOpen(true)}
            className="btn-primary inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-base rounded-full shadow-lg shadow-amber-200 transition-all duration-200"
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
