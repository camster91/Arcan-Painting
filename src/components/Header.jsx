import { useState, useEffect, useRef } from "react";
import { Menu, X, Phone, ChevronRight, ChevronDown } from "lucide-react";
import { useTheme, getThemeColors } from "@/utils/useTheme";
import LeadFormPopup from "./LeadFormPopup";

const SERVICES_NAV = [
  { label: "Interior Painting", href: "/interior-painting", desc: "Transform Living Spaces" },
  { label: "Exterior Painting", href: "/exterior-painting", desc: "Weather Protection" },
  { label: "Commercial Painting", href: "/commercial-painting", desc: "Business Solutions" },
  { label: "Wallpaper Services", href: "/wallpaper-services", desc: "High-End Installation" },
  { label: "Specialty Finishes", href: "/specialty-finishes", desc: "Custom Artistry" },
];

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLeadFormOpen, setIsLeadFormOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null); // 'services' | 'locations' | null
  const [mobileExpanded, setMobileExpanded] = useState(null); // 'services' | 'locations' | region name | null
  const closeBtnRef = useRef(null);
  const dropdownRef = useRef(null);
  useTheme();
  const themeColors = getThemeColors(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = isMenuOpen ? "hidden" : "";
    if (isMenuOpen) setTimeout(() => closeBtnRef.current?.focus(), 0);
    return () => { document.body.style.overflow = ""; };
  }, [isMenuOpen]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 768px)");
    const handler = (e) => { if (e.matches && isMenuOpen) setIsMenuOpen(false); };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [isMenuOpen]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    const mq = window.matchMedia("(max-width: 767px)");
    mq.addEventListener("change", check);
    return () => mq.removeEventListener("change", check);
  }, []);

  const toggleDropdown = (name) => {
    setActiveDropdown(activeDropdown === name ? null : name);
  };

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-colors duration-300 ease-out ${isScrolled ? "border-line bg-paper/95 backdrop-blur-sm" : "border-transparent bg-paper"}`}
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-amber-500 focus:text-slate-900 focus:px-4 focus:py-2 focus:rounded-lg"
      >
        Skip to content
      </a>
      <div className="max-w-[1440px] mx-auto px-3 sm:px-4 md:px-6 py-2 sm:py-3">
        <div className="flex items-center justify-between">
          {/* Brand */}
          <a href="/" className="block flex-shrink-0">
            <img
              src="/logo.png"
              alt="Arcan Painting logo"
              width="170"
              height="95"
              loading="eager"
              fetchpriority="high"
              decoding="async"
              className={`mix-blend-multiply transition-all duration-300 object-contain ${isScrolled ? "w-[112px] h-[62px] sm:w-[145px] sm:h-[75px]" : "w-[120px] h-[66px] sm:w-[170px] sm:h-[95px]"}`}
            />
          </a>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6" role="navigation" aria-label="Primary" ref={dropdownRef}>
            {/* Services dropdown */}
            <div className="relative">
              <button
                className={`flex items-center gap-1 text-[15px] font-medium transition-colors py-2 ${activeDropdown === "services" ? "text-ink" : "text-ink-soft hover:text-ink"}`}
                onClick={() => toggleDropdown("services")}
                aria-haspopup="true"
                aria-expanded={activeDropdown === "services"}
              >
                Services <ChevronDown size={16} className={`transition-transform ${activeDropdown === "services" ? "rotate-180" : ""}`} />
              </button>
              {activeDropdown === "services" && (
                <div className="absolute top-full left-0 mt-3 bg-paper rounded-lg shadow-xl border border-line py-2 min-w-[240px] z-50">
                  {SERVICES_NAV.map((svc) => (
                    <a
                      key={svc.href}
                      href={svc.href}
                      className="flex flex-col px-5 py-3 hover:bg-paper-deep transition-colors"
                      onClick={() => setActiveDropdown(null)}
                    >
                      <span className="font-medium text-ink">{svc.label}</span>
                      <span className="text-xs text-muted">{svc.desc}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Regular nav items */}
            {[
              { label: "Work", href: "/#portfolio" },
              { label: "Process", href: "/#process" },
              { label: "FAQ", href: "/#faq" },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-[15px] font-medium text-ink-soft transition-colors hover:text-ink"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <a
              href="tel:+14167272148"
              className="hidden lg:inline-flex items-center gap-2 text-[15px] font-medium px-3 py-1.5 text-ink-soft transition-colors hover:text-ink"
            >
              <Phone size={15} aria-hidden="true" /> (416) 727-2148
            </a>

            <button
              className="font-medium text-sm sm:text-[15px] px-3 sm:px-5 py-2 sm:py-2.5 rounded-full bg-ink text-paper transition-colors hover:bg-ink-soft active:scale-[0.98]"
              onClick={() => setIsLeadFormOpen(true)}
            >
              <span className="inline-flex items-center gap-1.5">
                <span className="hidden sm:inline">Discuss Your Project</span>
                <span className="sm:hidden whitespace-nowrap">Contact</span>
                <ChevronRight size={16} className="hidden sm:inline" aria-hidden="true" />
              </span>
            </button>

            <button
              className="md:hidden p-2 rounded-lg transition-colors"
              style={{ color: themeColors.textSecondary }}
              aria-label="Open menu"
              aria-haspopup="menu"
              aria-expanded={isMenuOpen}
              onClick={() => setIsMenuOpen(true)}
            >
              <Menu size={24} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Fullscreen Menu */}
      {isMenuOpen && isMobile && (
        <div className="fixed inset-0 z-[100] md:hidden">
          <div className="absolute inset-0 z-0" style={{ backgroundColor: "rgba(0,0,0,0.6)" }} onClick={() => setIsMenuOpen(false)} />
          <div
            id="mobile-menu-panel"
            className="absolute inset-y-0 right-0 w-[88%] max-w-[360px] shadow-2xl flex flex-col z-10"
            style={{ backgroundColor: "#F6F2EA", borderLeft: "1px solid #DCD2C1" }}
            role="dialog"
            aria-modal="true"
            aria-label="Mobile Menu"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: themeColors.border }}>
              <img src="/logo.png" alt="Arcan Painting logo" width="120" height="56" loading="eager" decoding="async" className="w-[120px] h-[56px] object-contain" />
              <button
                ref={closeBtnRef}
                className="p-2 rounded-lg"
                style={{ color: themeColors.textSecondary }}
                aria-label="Close menu"
                onClick={() => setIsMenuOpen(false)}
              >
                <X size={24} aria-hidden="true" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
              <nav className="space-y-1" role="navigation" aria-label="Mobile">

                {/* Services accordion */}
                <div>
                  <button
                    className="flex items-center justify-between w-full px-3 py-4 rounded-lg font-medium text-base"
                    style={{ color: themeColors.text }}
                    onClick={() => setMobileExpanded(mobileExpanded === "services" ? null : "services")}
                  >
                    Services
                    <ChevronDown size={16} className={`transition-transform ${mobileExpanded === "services" ? "rotate-180" : ""}`} />
                  </button>
                  {mobileExpanded === "services" && (
                    <div className="pl-4 pb-2 space-y-1">
                      {SERVICES_NAV.map((svc) => (
                        <a
                          key={svc.href}
                          href={svc.href}
                          className="block px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-amber-50"
                          style={{ color: themeColors.textSecondary }}
                          onClick={() => setIsMenuOpen(false)}
                        >
                          {svc.label}
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                {[
                  { label: "Work", href: "#portfolio" },
                  { label: "Process", href: "#process" },
                  { label: "FAQ", href: "#faq" },
                ].map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={(e) => { e.preventDefault(); setIsMenuOpen(false); scrollTo(item.href); }}
                    className="block px-3 py-4 rounded-lg font-medium text-base"
                    style={{ color: themeColors.text }}
                  >
                    {item.label}
                  </a>
                ))}
              </nav>

              <div className="mt-4 p-4 rounded-xl border" style={{ borderColor: themeColors.border, backgroundColor: themeColors.bgSecondary }}>
                <p className="text-base mb-3" style={{ color: themeColors.textSecondary }}>Prefer to talk to someone?</p>
                <a
                  href="tel:+14167272148"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-lg font-semibold text-base"
                  style={{ backgroundColor: "#16213A", color: "#F6F2EA" }}
                >
                  <Phone size={18} aria-hidden="true" />
                  (416) 727-2148
                </a>
              </div>
            </div>

            <div className="p-4 border-t" style={{ borderColor: themeColors.border }}>
              <button
                onClick={() => { setIsMenuOpen(false); setIsLeadFormOpen(true); }}
                className="w-full py-4 rounded-full font-medium text-base bg-brand text-ink"
              >
                Discuss Your Project
              </button>
            </div>
          </div>
        </div>
      )}

      <LeadFormPopup isOpen={isLeadFormOpen} onClose={() => setIsLeadFormOpen(false)} />
    </header>
  );
}
