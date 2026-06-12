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

const LOCATIONS_NAV = [
  {
    region: "Greater Toronto Area",
    cities: [
      { name: "Toronto", slug: "toronto" },
      { name: "Mississauga", slug: "mississauga" },
      { name: "Brampton", slug: "brampton" },
      { name: "Oakville", slug: "oakville" },
      { name: "Burlington", slug: "burlington" },
      { name: "Milton", slug: "milton" },
      { name: "Pickering", slug: "pickering" },
      { name: "Ajax", slug: "ajax" },
      { name: "Whitby", slug: "whitby" },
      { name: "Oshawa", slug: "oshawa" },
    ],
  },
  {
    region: "York Region",
    cities: [
      { name: "Newmarket", slug: "newmarket" },
      { name: "Aurora", slug: "aurora" },
      { name: "Richmond Hill", slug: "richmond-hill" },
      { name: "Markham", slug: "markham" },
      { name: "Vaughan", slug: "vaughan" },
      { name: "King City", slug: "king-city" },
      { name: "Stouffville", slug: "stouffville" },
      { name: "Georgina", slug: "georgina" },
      { name: "East Gwillimbury", slug: "east-gwillimbury" },
    ],
  },
  {
    region: "Simcoe County",
    cities: [
      { name: "Barrie", slug: "barrie" },
      { name: "Orillia", slug: "orillia" },
      { name: "Innisfil", slug: "innisfil" },
      { name: "Bradford", slug: "bradford" },
      { name: "Alliston", slug: "alliston" },
      { name: "Collingwood", slug: "collingwood" },
      { name: "Wasaga Beach", slug: "wasaga-beach" },
      { name: "Midland", slug: "midland" },
      { name: "Penetanguishene", slug: "penetanguishene" },
    ],
  },
];

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLeadFormOpen, setIsLeadFormOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null); // 'services' | 'locations' | null
  const [mobileExpanded, setMobileExpanded] = useState(null); // 'services' | 'locations' | region name | null
  const closeBtnRef = useRef(null);
  const dropdownRef = useRef(null);
  const { mounted } = useTheme();
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

  const scrollTo = (selector) => {
    const el = document.querySelector(selector);
    if (el) {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    }
  };

  const toggleDropdown = (name) => {
    setActiveDropdown(activeDropdown === name ? null : name);
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ease-out ${isScrolled ? "shadow-lg backdrop-blur-sm" : ""}`}
      style={{
        backgroundColor: themeColors.bg,
        borderBottom: `1px solid ${themeColors.border}`,
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <div className="max-w-[1440px] mx-auto px-6 sm:px-4 py-3">
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
              className={`transition-all duration-300 object-contain ${isScrolled ? "w-[145px] h-[75px]" : "w-[170px] h-[95px]"}`}
            />
          </a>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6" role="navigation" aria-label="Primary" ref={dropdownRef}>
            {/* Services dropdown */}
            <div className="relative">
              <button
                className="flex items-center gap-1 text-base font-medium transition-colors py-2"
                style={{ color: activeDropdown === "services" ? "#f59e0b" : themeColors.textSecondary }}
                onClick={() => toggleDropdown("services")}
                aria-haspopup="true"
                aria-expanded={activeDropdown === "services"}
              >
                Services <ChevronDown size={16} className={`transition-transform ${activeDropdown === "services" ? "rotate-180" : ""}`} />
              </button>
              {activeDropdown === "services" && (
                <div className="absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 py-3 min-w-[240px] z-50">
                  {SERVICES_NAV.map((svc) => (
                    <a
                      key={svc.href}
                      href={svc.href}
                      className="flex flex-col px-5 py-3 hover:bg-amber-50 transition-colors group"
                      onClick={() => setActiveDropdown(null)}
                    >
                      <span className="font-semibold text-slate-900 group-hover:text-amber-700">{svc.label}</span>
                      <span className="text-xs text-slate-500">{svc.desc}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Locations mega menu */}
            <div className="relative">
              <button
                className="flex items-center gap-1 text-base font-medium transition-colors py-2"
                style={{ color: activeDropdown === "locations" ? "#f59e0b" : themeColors.textSecondary }}
                onClick={() => toggleDropdown("locations")}
                aria-haspopup="true"
                aria-expanded={activeDropdown === "locations"}
              >
                Locations <ChevronDown size={16} className={`transition-transform ${activeDropdown === "locations" ? "rotate-180" : ""}`} />
              </button>
              {activeDropdown === "locations" && (
                <div className="absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 py-4 z-50" style={{ minWidth: "560px" }}>
                  <div className="px-5 pb-3 mb-3 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Serving 30 Cities Across Ontario</p>
                  </div>
                  <div className="grid grid-cols-3 gap-0 px-4">
                    {LOCATIONS_NAV.map((region) => (
                      <div key={region.region} className="px-2">
                        <p className="text-xs font-bold text-amber-600 uppercase tracking-wide mb-3">{region.region}</p>
                        <ul className="space-y-1">
                          {region.cities.map((city) => (
                            <li key={city.slug}>
                              <a
                                href={`/interior-painting/${city.slug}`}
                                className="text-sm text-slate-700 hover:text-amber-600 hover:font-medium transition-colors block py-0.5"
                                onClick={() => setActiveDropdown(null)}
                              >
                                {city.name}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Regular nav items */}
            {[
              { label: "Portfolio", href: "#portfolio" },
              { label: "Pricing", href: "#pricing" },
              { label: "About", href: "#about" },
            ].map((item) => (
              <button
                key={item.href}
                onClick={() => scrollTo(item.href)}
                className="text-base font-medium transition-colors"
                style={{ color: themeColors.textSecondary }}
                onMouseEnter={(e) => (e.target.style.color = "#f59e0b")}
                onMouseLeave={(e) => (e.target.style.color = themeColors.textSecondary)}
              >
                {item.label}
              </button>
            ))}
            <a
              href="/blog"
              className="text-base font-medium transition-colors"
              style={{ color: themeColors.textSecondary }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#f59e0b")}
              onMouseLeave={(e) => (e.currentTarget.style.color = themeColors.textSecondary)}
            >
              Blog
            </a>
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <a
              href="tel:+14167272148"
              className="hidden md:inline-flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
              style={{ color: themeColors.textSecondary }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#f59e0b"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = themeColors.textSecondary; }}
            >
              <Phone size={16} aria-hidden="true" /> +1 (416) 727-2148
            </a>

            <button
              className="font-semibold text-lg px-6 py-3 rounded-lg transition-all duration-300 active:scale-[0.98] shadow-lg hover:shadow-xl group relative overflow-hidden"
              style={{ background: "linear-gradient(to right, #f59e0b, #fbbf24)", color: "#1e293b" }}
              onClick={() => setIsLeadFormOpen(true)}
            >
              <span className="relative z-10 inline-flex items-center gap-2">
                <span className="hidden sm:inline">Get Free Estimate</span>
                <span className="sm:hidden">Get Quote</span>
                <ChevronRight size={18} className="hidden sm:inline" aria-hidden="true" />
              </span>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: "linear-gradient(to right, #fbbf24, #f59e0b)" }} />
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
            style={{ backgroundColor: themeColors.bg, borderLeft: `1px solid ${themeColors.border}` }}
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

                {/* Locations accordion */}
                <div>
                  <button
                    className="flex items-center justify-between w-full px-3 py-4 rounded-lg font-medium text-base"
                    style={{ color: themeColors.text }}
                    onClick={() => setMobileExpanded(mobileExpanded === "locations" ? null : "locations")}
                  >
                    Locations
                    <ChevronDown size={16} className={`transition-transform ${mobileExpanded === "locations" ? "rotate-180" : ""}`} />
                  </button>
                  {mobileExpanded === "locations" && (
                    <div className="pl-2 pb-2 space-y-2">
                      {LOCATIONS_NAV.map((region) => (
                        <div key={region.region}>
                          <button
                            className="flex items-center justify-between w-full px-3 py-2 text-xs font-bold text-amber-600 uppercase tracking-wide"
                            onClick={() => setMobileExpanded(mobileExpanded === region.region ? "locations" : region.region)}
                          >
                            {region.region}
                            <ChevronDown size={12} className={`transition-transform ${mobileExpanded === region.region ? "rotate-180" : ""}`} />
                          </button>
                          {mobileExpanded === region.region && (
                            <div className="pl-4 grid grid-cols-2 gap-1 pb-2">
                              {region.cities.map((city) => (
                                <a
                                  key={city.slug}
                                  href={`/interior-painting/${city.slug}`}
                                  className="block px-2 py-2 text-sm rounded-lg hover:bg-amber-50"
                                  style={{ color: themeColors.textSecondary }}
                                  onClick={() => setIsMenuOpen(false)}
                                >
                                  {city.name}
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {[
                  { label: "Portfolio", href: "#portfolio" },
                  { label: "Pricing", href: "#pricing" },
                  { label: "About", href: "#about" },
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
                <a
                  href="/blog"
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-3 py-4 rounded-lg font-medium text-base"
                  style={{ color: themeColors.text }}
                >
                  Blog
                </a>
              </nav>

              <div className="mt-4 p-4 rounded-xl border" style={{ borderColor: themeColors.border, backgroundColor: themeColors.bgSecondary }}>
                <p className="text-base mb-3" style={{ color: themeColors.textSecondary }}>Prefer to talk to someone?</p>
                <a
                  href="tel:+14167272148"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-lg font-semibold text-base"
                  style={{ backgroundColor: "#0f172a", color: "#ffffff" }}
                >
                  <Phone size={18} aria-hidden="true" />
                  (416) 727-2148
                </a>
              </div>
            </div>

            <div className="p-4 border-t" style={{ borderColor: themeColors.border }}>
              <button
                onClick={() => { setIsMenuOpen(false); setIsLeadFormOpen(true); }}
                className="w-full py-4 rounded-lg font-semibold text-lg"
                style={{ background: "linear-gradient(to right, #f59e0b, #fbbf24)", color: "#1e293b" }}
              >
                Get Free Estimate
              </button>
            </div>
          </div>
        </div>
      )}

      <LeadFormPopup isOpen={isLeadFormOpen} onClose={() => setIsLeadFormOpen(false)} />
    </header>
  );
}
