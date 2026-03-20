import { lazy, Suspense } from "react";
import MediaGallery from "./MediaGallery";

// Before/After gallery is the hero of this section – lazy loaded
const BeforeAfterGallery = lazy(() => import("./BeforeAfterGallery"));

function GallerySkeleton() {
  return (
    <div className="py-16 md:py-24 bg-slate-50" aria-hidden="true">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="h-4 w-24 bg-slate-200 animate-pulse rounded-full mx-auto mb-4" />
          <div className="h-10 w-72 bg-slate-200 animate-pulse rounded-xl mx-auto mb-3" />
          <div className="h-4 w-96 bg-slate-100 animate-pulse rounded-xl mx-auto" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="aspect-[4/3] bg-slate-200 animate-pulse rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function PortfolioSection() {
  return (
    <>
      {/* Phase 3: Interactive before/after gallery with testimonials */}
      <Suspense fallback={<GallerySkeleton />}>
        <BeforeAfterGallery />
      </Suspense>

      {/* Original media gallery (photos/videos) */}
      <MediaGallery />
    </>
  );
}
