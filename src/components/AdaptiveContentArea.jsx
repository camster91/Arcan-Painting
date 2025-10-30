"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, MoreVertical } from "lucide-react";

export default function AdaptiveContentArea({
  children,
  title,
  subtitle,
  actions,
  breadcrumbs,
  showBackButton = false,
  onBack,
  className = "",
  contentPadding = true,
  fullHeight = false,
}) {
  const [screenSize, setScreenSize] = useState("lg");
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const updateScreenSize = () => {
      const width = window.innerWidth;
      if (width < 640) setScreenSize("sm");
      else if (width < 768) setScreenSize("md");
      else if (width < 1024) setScreenSize("lg");
      else if (width < 1280) setScreenSize("xl");
      else setScreenSize("2xl");
    };

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    updateScreenSize();
    window.addEventListener("resize", updateScreenSize);
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("resize", updateScreenSize);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const isMobile = screenSize === "sm" || screenSize === "md";
  const isTablet = screenSize === "lg";
  const isDesktop = screenSize === "xl" || screenSize === "2xl";

  return (
    <div
      className={`${fullHeight ? "min-h-screen" : "min-h-[70vh]"} ${className}`}
    >
      {/* Adaptive Header */}
      {(title || actions || breadcrumbs || showBackButton) && (
        <div
          className={`sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b transition-all duration-200 ${
            isScrolled ? "border-slate-200 shadow-sm" : "border-transparent"
          } ${isMobile ? "px-4 py-3" : "px-6 py-4"}`}
        >
          {/* Breadcrumbs - Desktop only */}
          {breadcrumbs && !isMobile && (
            <nav className="flex mb-3" aria-label="Breadcrumb">
              <ol className="inline-flex items-center space-x-1 text-sm text-slate-500">
                {breadcrumbs.map((crumb, index) => (
                  <li key={index} className="inline-flex items-center">
                    {index > 0 && <ChevronRight size={14} className="mx-1" />}
                    {crumb.href ? (
                      <a
                        href={crumb.href}
                        className="hover:text-slate-700 transition-colors"
                      >
                        {crumb.label}
                      </a>
                    ) : (
                      <span className="text-slate-900 font-medium">
                        {crumb.label}
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          )}

          {/* Title and Actions Row */}
          <div className="flex items-center justify-between gap-4">
            {/* Left side - Back button + Title */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {showBackButton && (
                <button
                  onClick={onBack}
                  className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors lg:hidden"
                  aria-label="Go back"
                >
                  <ChevronLeft size={20} />
                </button>
              )}

              <div className="min-w-0 flex-1">
                {title && (
                  <h1
                    className={`font-bold text-slate-900 truncate ${
                      isMobile ? "text-xl" : isTablet ? "text-2xl" : "text-3xl"
                    }`}
                  >
                    {title}
                  </h1>
                )}
                {subtitle && (
                  <p
                    className={`text-slate-600 mt-1 ${
                      isMobile ? "text-sm" : "text-base"
                    }`}
                  >
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            {/* Right side - Actions */}
            {actions && (
              <div className="flex items-center gap-2 flex-shrink-0">
                {isMobile ? (
                  // Mobile: Show primary action + overflow menu
                  <>
                    {actions.primary && (
                      <button
                        onClick={actions.primary.onClick}
                        className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                          actions.primary.variant === "primary"
                            ? "bg-amber-500 hover:bg-amber-600 text-white"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                        }`}
                      >
                        {actions.primary.label}
                      </button>
                    )}
                    {actions.secondary && actions.secondary.length > 0 && (
                      <div className="relative">
                        <button
                          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                          aria-label="More actions"
                        >
                          <MoreVertical size={16} />
                        </button>
                        {/* TODO: Add dropdown menu */}
                      </div>
                    )}
                  </>
                ) : (
                  // Desktop: Show all actions
                  <>
                    {actions.secondary?.map((action, index) => (
                      <button
                        key={index}
                        onClick={action.onClick}
                        className="px-3 py-2 text-sm text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        {action.label}
                      </button>
                    ))}
                    {actions.primary && (
                      <button
                        onClick={actions.primary.onClick}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                          actions.primary.variant === "primary"
                            ? "bg-amber-500 hover:bg-amber-600 text-white"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                        }`}
                      >
                        {actions.primary.label}
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Adaptive Content Area */}
      <div
        className={`${
          contentPadding ? (isMobile ? "p-4" : isTablet ? "p-6" : "p-8") : ""
        }`}
      >
        {/* Responsive Grid Container */}
        <div
          className={`
          ${screenSize === "sm" ? "max-w-full" : ""}
          ${screenSize === "md" ? "max-w-2xl mx-auto" : ""}
          ${screenSize === "lg" ? "max-w-4xl mx-auto" : ""}
          ${screenSize === "xl" ? "max-w-6xl mx-auto" : ""}
          ${screenSize === "2xl" ? "max-w-7xl mx-auto" : ""}
        `}
        >
          {children}
        </div>
      </div>

      {/* Debug info (remove in production) */}
      {process.env.NODE_ENV === "development" && (
        <div className="fixed bottom-4 right-4 bg-black/75 text-white text-xs px-2 py-1 rounded z-50">
          {screenSize} • {isMobile ? "mobile" : isTablet ? "tablet" : "desktop"}
        </div>
      )}
    </div>
  );
}

// Helper components for responsive layouts
export function ResponsiveGrid({
  children,
  cols = { sm: 1, md: 2, lg: 3, xl: 4 },
  gap = 6,
  className = "",
}) {
  return (
    <div
      className={`grid gap-${gap} ${`grid-cols-${cols.sm} md:grid-cols-${cols.md} lg:grid-cols-${cols.lg} xl:grid-cols-${cols.xl}`} ${className}`}
    >
      {children}
    </div>
  );
}

export function ResponsiveStack({
  children,
  direction = { sm: "vertical", lg: "horizontal" },
  gap = 4,
  className = "",
}) {
  const directionClasses = {
    vertical: "flex-col",
    horizontal: "flex-row",
  };

  return (
    <div
      className={`flex gap-${gap} ${
        direction.sm === "vertical"
          ? `${directionClasses.vertical} ${direction.lg === "horizontal" ? `lg:${directionClasses.horizontal}` : ""}`
          : `${directionClasses.horizontal} ${direction.lg === "vertical" ? `lg:${directionClasses.vertical}` : ""}`
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function ResponsiveCard({
  children,
  padding = "standard",
  hover = true,
  className = "",
}) {
  const paddingClasses = {
    none: "",
    compact: "p-3 sm:p-4",
    standard: "p-4 sm:p-6",
    spacious: "p-6 sm:p-8",
  };

  return (
    <div
      className={`
      bg-white rounded-xl border border-slate-200 
      ${paddingClasses[padding]}
      ${hover ? "hover:shadow-lg transition-shadow duration-200" : ""}
      ${className}
    `}
    >
      {children}
    </div>
  );
}
