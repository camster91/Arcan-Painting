import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { projectGallery as defaultItems } from "@/data/projectGallery";
import "./ProjectGallery.css";

const CATEGORIES = ["Interior", "Wallpaper", "Exterior", "Commercial", "Archive"];
const INITIAL_VISIBLE = 12;
const LOAD_INCREMENT = 12;

function assetPath(directory, file) {
  return `/${directory}/${encodeURIComponent(file)}`;
}

function thumbnailPath(file) {
  return assetPath("gallery/thumbnails", file.replace(/\.webp$/i, "_thumb.webp"));
}

function imagePath(file) {
  return assetPath("gallery/images", file);
}

function rotationValue(rotation) {
  return rotation === 90 || rotation === -90 ? rotation : 0;
}

function rotationStyle(rotation) {
  return { "--gallery-rotation": `${rotationValue(rotation)}deg` };
}

function displayLabel(value) {
  return value ? String(value) : "";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function NoScriptLinks({ items }) {
  const markup = items
    .map((item) => {
      const href = escapeHtml(imagePath(item.file));
      const alt = escapeHtml(item.alt);
      const title = escapeHtml(item.title);
      return `<a href="${href}"><img src="${escapeHtml(thumbnailPath(item.file))}" alt="${alt}" loading="lazy" width="800" height="600" /><span>${title}</span></a>`;
    })
    .join("");

  return (
    <noscript>
      <div className="p-project-gallery__noscript" dangerouslySetInnerHTML={{ __html: markup }} />
    </noscript>
  );
}

function LightboxImage({ item }) {
  const frameRef = useRef(null);
  const imageRef = useRef(null);
  const [size, setSize] = useState(null);

  const updateSize = useCallback(() => {
    const frame = frameRef.current;
    const image = imageRef.current;
    if (!frame || !image?.naturalWidth || !image.naturalHeight) return;

    const frameWidth = frame.clientWidth;
    const frameHeight = frame.clientHeight;
    if (!frameWidth || !frameHeight) return;

    const rotated = Math.abs(rotationValue(item.rotation)) === 90;
    const availableWidth = rotated ? frameHeight : frameWidth;
    const availableHeight = rotated ? frameWidth : frameHeight;
    const scale = Math.min(
      1,
      availableWidth / image.naturalWidth,
      availableHeight / image.naturalHeight,
    );

    setSize({
      width: Math.max(1, Math.floor(image.naturalWidth * scale)),
      height: Math.max(1, Math.floor(image.naturalHeight * scale)),
    });
  }, [item.rotation]);

  useEffect(() => {
    setSize(null);
    const frame = frameRef.current;
    if (!frame) return undefined;

    const observer = typeof ResizeObserver === "function" ? new ResizeObserver(updateSize) : null;
    observer?.observe(frame);
    window.addEventListener("resize", updateSize);
    updateSize();

    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", updateSize);
    };
  }, [item.file, updateSize]);

  const imageStyle = size
    ? {
        ...rotationStyle(item.rotation),
        width: `${size.width}px`,
        height: `${size.height}px`,
      }
    : rotationStyle(item.rotation);

  return (
    <div className="p-project-gallery__dialog-frame" ref={frameRef}>
      <img
        ref={imageRef}
        className={`p-project-gallery__dialog-image${size ? " is-sized" : ""}`}
        src={imagePath(item.file)}
        alt={item.alt}
        style={imageStyle}
        width={size?.width}
        height={size?.height}
        onLoad={updateSize}
        decoding="async"
      />
    </div>
  );
}

function GalleryCard({ item, index, onOpen }) {
  const isRotated = rotationValue(item.rotation) !== 0;

  return (
    <a
      className="p-project-gallery__card"
      href={imagePath(item.file)}
      data-gallery-file={item.file}
      data-gallery-stage={item.stage}
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
        event.preventDefault();
        onOpen(item.file, event.currentTarget);
      }}
    >
      <span className="p-project-gallery__thumbnail-frame">
        <img
          className={`p-project-gallery__thumbnail${isRotated ? " is-rotated" : ""}`}
          src={thumbnailPath(item.file)}
          alt={item.alt}
          style={rotationStyle(item.rotation)}
          loading={index < 3 ? "eager" : "lazy"}
          decoding="async"
          width="800"
          height="600"
        />
        {item.isVideoStill ? (
          <span className="p-project-gallery__video-label">Video still</span>
        ) : null}
      </span>
      <span className="p-project-gallery__card-copy">
        <span className="p-project-gallery__card-title">{item.title}</span>
        <span className="p-project-gallery__card-meta">
          {displayLabel(item.category)}
          <span aria-hidden="true">·</span>
          {displayLabel(item.stage)}
        </span>
      </span>
    </a>
  );
}

export default function ProjectGallery({ items = defaultItems }) {
  const [activeCategory, setActiveCategory] = useState("All");
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);
  const [activeFile, setActiveFile] = useState(null);
  const returnFocusRef = useRef(null);
  const dialogRef = useRef(null);
  const closeRef = useRef(null);
  const dialogWasOpenRef = useRef(false);

  const galleryItems = useMemo(() => (Array.isArray(items) ? items : []), [items]);
  const filteredItems = useMemo(
    () =>
      activeCategory === "All"
        ? galleryItems
        : galleryItems.filter((item) => item.category === activeCategory),
    [activeCategory, galleryItems],
  );
  const visibleItems = filteredItems.slice(0, visibleCount);
  const activeIndex = activeFile
    ? filteredItems.findIndex((item) => item.file === activeFile)
    : -1;
  const activeItem = activeIndex >= 0 ? filteredItems[activeIndex] : null;

  const closeLightbox = useCallback(() => {
    const returnFocus = returnFocusRef.current;
    returnFocusRef.current = null;
    setActiveFile(null);
    if (typeof window !== "undefined") {
      window.requestAnimationFrame(() => {
        returnFocus?.focus?.({ preventScroll: true });
      });
    }
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (!activeItem) {
      if (dialog.open) dialog.close();
      dialogWasOpenRef.current = false;
      return;
    }

    const opening = !dialogWasOpenRef.current;
    if (!dialog.open) {
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
    }
    dialogWasOpenRef.current = true;
    if (opening) window.requestAnimationFrame(() => closeRef.current?.focus());
  }, [activeItem]);

  const openLightbox = (file, anchor) => {
    returnFocusRef.current = anchor;
    setActiveFile(file);
  };

  const changeCategory = (category) => {
    setActiveCategory(category);
    setVisibleCount(INITIAL_VISIBLE);
    if (activeFile) {
      returnFocusRef.current = null;
      setActiveFile(null);
    }
  };

  const goTo = (offset) => {
    if (!filteredItems.length || activeIndex < 0) return;
    const nextIndex = (activeIndex + offset + filteredItems.length) % filteredItems.length;
    setActiveFile(filteredItems[nextIndex].file);
  };

  return (
    <div className="p-project-gallery" aria-label="Original photo gallery">
      <div className="p-project-gallery__header">
        <div
          className="p-project-gallery__filters"
          role="group"
          aria-label="Filter project images"
        >
          <button
            type="button"
            className="p-project-gallery__filter"
            aria-pressed={activeCategory === "All"}
            onClick={() => changeCategory("All")}
          >
            All
          </button>
          {CATEGORIES.map((category) => (
            <button
              type="button"
              className="p-project-gallery__filter"
              aria-pressed={activeCategory === category}
              key={category}
              onClick={() => changeCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <p className="p-project-gallery__counter" aria-live="polite">
        Showing {visibleItems.length} of {filteredItems.length} images
        {activeCategory !== "All" ? ` · ${activeCategory}` : ""}
      </p>

      <div className="p-project-gallery__grid" id="project-gallery-grid">
        {visibleItems.map((item, index) => (
          <GalleryCard key={item.file} item={item} index={index} onOpen={openLightbox} />
        ))}
      </div>

      {visibleItems.length < filteredItems.length ? (
        <button
          className="p-project-gallery__load-more"
          type="button"
          onClick={() => setVisibleCount((count) => count + LOAD_INCREMENT)}
        >
          Show more images
        </button>
      ) : null}

      <NoScriptLinks items={galleryItems} />

      <dialog
        className="p-project-gallery__dialog"
        ref={dialogRef}
        aria-labelledby="project-gallery-dialog-title"
        onCancel={(event) => {
          event.preventDefault();
          closeLightbox();
        }}
        onClick={(event) => {
          if (event.target === dialogRef.current) closeLightbox();
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            closeLightbox();
          } else if (event.key === "ArrowLeft") {
            event.preventDefault();
            goTo(-1);
          } else if (event.key === "ArrowRight") {
            event.preventDefault();
            goTo(1);
          }
        }}
      >
        {activeItem ? (
          <>
            <div className="p-project-gallery__dialog-topline">
              <div>
                <p className="p-eyebrow">{activeItem.category}</p>
                <h2 id="project-gallery-dialog-title">{activeItem.title}</h2>
              </div>
              <button
                ref={closeRef}
                type="button"
                className="p-project-gallery__dialog-close"
                aria-label="Close image viewer"
                onClick={closeLightbox}
              >
                Close
              </button>
            </div>
            <LightboxImage item={activeItem} />
            <div className="p-project-gallery__dialog-bottomline">
              <p>
                {displayLabel(activeItem.stage)}
                {activeItem.isVideoStill ? " · Video still" : ""}
              </p>
              <div className="p-project-gallery__dialog-controls">
                <button
                  type="button"
                  className="p-project-gallery__dialog-prev"
                  aria-label="Previous image"
                  onClick={() => goTo(-1)}
                  disabled={filteredItems.length < 2}
                >
                  Previous
                </button>
                <span aria-live="polite">
                  {activeIndex + 1} / {filteredItems.length}
                </span>
                <button
                  type="button"
                  className="p-project-gallery__dialog-next"
                  aria-label="Next image"
                  onClick={() => goTo(1)}
                  disabled={filteredItems.length < 2}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        ) : null}
      </dialog>
    </div>
  );
}

export { CATEGORIES, INITIAL_VISIBLE, LOAD_INCREMENT };
