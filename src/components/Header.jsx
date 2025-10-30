import { useState, useEffect, useRef } from "react";
import { Menu, X, Phone, ChevronRight } from "lucide-react";
import { useTheme, getThemeColors } from "@/utils/useTheme";
import LeadFormPopup from "./LeadFormPopup";

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false); // NEW: mobile menu state
  const [isLeadFormOpen, setIsLeadFormOpen] = useState(false); // ADD: lead form state
  const closeBtnRef = useRef(null);
  const { mounted } = useTheme();
  const themeColors = getThemeColors(false); // Always use light mode colors

  // Handle scroll effect for shadow and shrink
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 8);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Prevent background scroll when mobile menu is open
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
      // move focus to close button for accessibility
      setTimeout(() => closeBtnRef.current?.focus(), 0);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <header className="sticky top-0 z-50 h-20 bg-white border-b border-gray-200" />
    );
  }

  const navItems = [
    { label: "Services", href: "#services" },
    { label: "Portfolio", href: "#portfolio" },
    { label: "Pricing", href: "#pricing" },
    { label: "About", href: "#about" },
    { label: "Contact", href: "#contact" },
  ];

  const scrollTo = (selector) => {
    const el = document.querySelector(selector);
    if (el) {
      const reduce = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      el.scrollIntoView({
        behavior: reduce ? "auto" : "smooth",
        block: "start",
      });
    }
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ease-out ${
        isScrolled ? "shadow-lg backdrop-blur-sm" : ""
      }`}
      style={{
        backgroundColor: themeColors.bg,
        borderBottom: `1px solid ${themeColors.border}`,
        fontFamily:
          'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <div className="max-w-[1440px] mx-auto px-6 sm:px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center group">
            <a href="/" className="block">
              <img
                src="https://ucarecdn.com/599e7887-839f-4d2a-ba07-41425b1276a2/-/format/auto/"
                alt="Arcan Painting and Sons logo"
                className={`transition-all duration-300 object-contain cursor-pointer ${
                  isScrolled ? "w-[145px] h-[75px]" : "w-[170px] h-[95px]"
                }`}
              />
            </a>
          </div>

          {/* Desktop Nav */}
          <nav
            className="hidden md:flex items-center gap-8"
            role="navigation"
            aria-label="Primary"
          >
            {navItems.map((item) => (
              <button
                key={item.href}
                onClick={() => {
                  if (item.href === "#contact") {
                    setIsLeadFormOpen(true); // CHANGE: open popup for contact nav
                  } else {
                    scrollTo(item.href);
                  }
                }}
                className="text-base font-medium transition-colors"
                style={{
                  color: themeColors.textSecondary,
                }}
                onMouseEnter={(e) => (e.target.style.color = "#f59e0b")}
                onMouseLeave={(e) =>
                  (e.target.style.color = themeColors.textSecondary)
                }
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Call link (desktop) */}
            <a
              href="#contact"
              className="hidden md:inline-flex items-center gap-2 text-base font-medium px-4 py-2 rounded-lg transition-colors"
              style={{
                color: themeColors.textSecondary,
                backgroundColor: "transparent",
              }}
              onMouseEnter={(e) => {
                e.target.style.color = "#f59e0b";
                e.target.style.backgroundColor = "rgba(0,0,0,0.05)";
              }}
              onMouseLeave={(e) => {
                e.target.style.color = themeColors.textSecondary;
                e.target.style.backgroundColor = "transparent";
              }}
              onClick={(e) => {
                e.preventDefault();
                setIsLeadFormOpen(true);
              }}
            >
              <Phone size={18} aria-hidden="true" /> Contact
            </a>

            {/* CTA */}
            <button
              className="font-semibold text-lg px-6 py-3 rounded-lg transition-all duration-300 active:scale-[0.98] shadow-lg hover:shadow-xl group relative overflow-hidden"
              style={{
                background: "linear-gradient(to right, #f59e0b, #fbbf24)",
                color: "#1e293b",
              }}
              onClick={() => setIsLeadFormOpen(true)}
            >
              <span className="relative z-10 inline-flex items-center gap-2">
                <span className="hidden sm:inline">Get Free Estimate</span>
                <span className="sm:hidden">Get Quote</span>
                <ChevronRight
                  size={18}
                  className="hidden sm:inline"
                  aria-hidden="true"
                />
              </span>
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background: "linear-gradient(to right, #fbbf24, #f59e0b)",
                }}
              ></div>
            </button>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-lg transition-colors"
              style={{
                color: themeColors.textSecondary,
                backgroundColor: "transparent",
              }}
              onMouseEnter={(e) => {
                e.target.style.color = themeColors.text;
                e.target.style.backgroundColor = "rgba(0,0,0,0.1)";
              }}
              onMouseLeave={(e) => {
                e.target.style.color = themeColors.textSecondary;
                e.target.style.backgroundColor = "transparent";
              }}
              aria-label="Open menu"
              aria-haspopup="menu"
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu-panel"
              onClick={() => setIsMenuOpen(true)}
            >
              <Menu size={24} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Fullscreen Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0"
            style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
            onClick={() => setIsMenuOpen(false)}
          />

          {/* Panel */}
          <div
            id="mobile-menu-panel"
            className="absolute inset-y-0 right-0 w-[88%] max-w-[360px] shadow-2xl border-l flex flex-col"
            style={{
              backgroundColor: themeColors.bg,
              borderColor: themeColors.border,
            }}
            role="dialog"
            aria-modal="true"
            aria-label="Mobile Menu"
          >
            <div
              className="flex items-center justify-between px-4 py-3 border-b"
              style={{ borderColor: themeColors.border }}
            >
              <img
                src="https://ucarecdn.com/599e7887-839f-4d2a-ba07-41425b1276a2/-/format/auto/"
                alt="Arcan Painting and Sons logo"
                className="w-[120px] h-[56px] object-contain"
              />
              <button
                ref={closeBtnRef}
                className="p-2 rounded-lg transition-colors"
                style={{
                  color: themeColors.textSecondary,
                  backgroundColor: "transparent",
                }}
                onMouseEnter={(e) => {
                  e.target.style.color = themeColors.text;
                  e.target.style.backgroundColor = "rgba(0,0,0,0.1)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.color = themeColors.textSecondary;
                  e.target.style.backgroundColor = "transparent";
                }}
                aria-label="Close menu"
                onClick={() => setIsMenuOpen(false)}
              >
                <X size={24} aria-hidden="true" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-6">
              <nav className="space-y-1" role="navigation" aria-label="Mobile">
                {navItems.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={(e) => {
                      e.preventDefault();
                      setIsMenuOpen(false);
                      if (item.href === "#contact") {
                        setIsLeadFormOpen(true); // CHANGE
                      } else {
                        scrollTo(item.href);
                      }
                    }}
                    className="block px-3 py-4 rounded-lg font-medium text-base transition-colors"
                    style={{
                      color: themeColors.text,
                      backgroundColor: "transparent",
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = "rgba(0,0,0,0.05)";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = "transparent";
                    }}
                  >
                    {item.label}
                  </a>
                ))}
              </nav>

              <div
                className="mt-6 p-4 rounded-xl border"
                style={{
                  borderColor: themeColors.border,
                  backgroundColor: themeColors.bgSecondary,
                }}
              >
                <div
                  className="text-base mb-3"
                  style={{ color: themeColors.textSecondary }}
                >
                  Prefer to talk to someone?
                </div>
                <a
                  href="#contact"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsMenuOpen(false);
                    setIsLeadFormOpen(true);
                  }}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-lg font-semibold text-lg"
                  style={{
                    backgroundColor: "#0f172a",
                    color: "#ffffff",
                  }}
                >
                  <Phone size={18} aria-hidden="true" />
                  Contact Us
                </a>
              </div>
            </div>

            <div
              className="p-4 border-t"
              style={{ borderColor: themeColors.border }}
            >
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsLeadFormOpen(true);
                }}
                className="w-full py-4 rounded-lg font-semibold text-lg"
                style={{
                  background: "linear-gradient(to right, #f59e0b, #fbbf24)",
                  color: "#1e293b",
                }}
              >
                Get Free Estimate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD: LeadFormPopup controlled here */}
      <LeadFormPopup
        isOpen={isLeadFormOpen}
        onClose={() => setIsLeadFormOpen(false)}
      />
    </header>
  );
}
