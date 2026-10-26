import { useEffect, useRef, useState } from "react";
import { Instagram, Star, Menu, X } from "lucide-react";
import { socialLinks } from "@/data/premiumSite";
import { ButtonLink } from "./primitives";
import "@/styles/premium.css";

const icons = {
  instagram: Instagram,
  google: Star,
};
export function SocialLinks() {
  return (
    <div className="p-socials" aria-label="Arcan social profiles and reviews">
      {socialLinks.map((link) => {
        const Icon = icons[link.icon] || Star;
        return (
          <a
            key={link.href}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${link.label || link.name} (opens in a new tab)`}
            title={link.label || link.name}
          >
            <Icon size={19} aria-hidden="true" />
            <span>{link.name}</span>
          </a>
        );
      })}
    </div>
  );
}
export default function PremiumShell({ children }) {
  const [open, setOpen] = useState(false);
  const headerRef = useRef(null);
  const menuRef = useRef(null);
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 901px)");
    const closeDesktopMenu = () => {
      if (headerRef.current?.querySelector("nav")?.contains(document.activeElement) ||
          (desktop.matches && document.activeElement === menuRef.current)) {
        (desktop.matches ? headerRef.current.querySelector(".p-logo") : menuRef.current)?.focus();
      }
      setOpen(false);
    };
    desktop.addEventListener("change", closeDesktopMenu);
    return () => desktop.removeEventListener("change", closeDesktopMenu);
  }, []);
  useEffect(() => {
    const escape = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        menuRef.current?.focus();
      }
    };
    const outside = (event) => {
      if (headerRef.current?.contains(event.target)) return;
      if (event.type === "pointerdown" &&
          headerRef.current?.querySelector("nav")?.contains(document.activeElement) &&
          !event.target.closest("a, button, input, select, textarea, [tabindex], [contenteditable]")) {
        event.preventDefault();
        menuRef.current?.focus();
      }
      setOpen(false);
    };
    if (open) {
      document.addEventListener("keydown", escape);
      document.addEventListener("pointerdown", outside);
      document.addEventListener("focusin", outside);
    }
    return () => {
      document.removeEventListener("keydown", escape);
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("focusin", outside);
    };
  }, [open]);
  return (
    <div className="premium-site">
      <a className="p-skip" href="#main">
        Skip to content
      </a>
      <header className="p-header" ref={headerRef}>
        <a className="p-logo" href="/" aria-label="Arcan Painting home">
          <img src="/brand/arcan-painting-logo.png" width="800" height="235" alt="Arcan Painting" />
        </a>
        <button
          ref={menuRef}
          className="p-menu"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-controls="premium-navigation"
        >
          {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          <span>{open ? "Close" : "Menu"}</span>
        </button>
        <nav
          id="premium-navigation"
          className={open ? "is-open" : ""}
          aria-label="Main navigation"
          onClick={() => setOpen(false)}
        >
          <a href="/interior-painting">Painting</a>
          <a href="/wallpaper-services">Wallpaper</a>
          <a href="/specialty-finishes">Luxury finishes</a>
          <a href="/projects">Selected work</a>
          <ButtonLink href="/contact" subtle>
            Enquire
          </ButtonLink>
        </nav>
      </header>
      <main id="main" tabIndex={-1}>
        {children}
      </main>
      <footer className="p-footer">
        <div className="p-footer-top">
          <a className="p-logo" href="/" aria-label="Arcan Painting home">
            <img
              src="/brand/arcan-painting-logo.png"
              width="800"
              height="235"
              alt="Arcan Painting"
            />
          </a>
          <p>
            Premium Painting.
            <br />
            Luxury Finishes & Wallpaper.
          </p>
          <SocialLinks />
        </div>
        <div className="p-footer-links">
          <a href="/interior-painting">Premium Painting</a>
          <a href="/commercial-painting">Commercial</a>
          <a href="/exterior-painting">Exterior</a>
          <a href="/about">Our approach</a>
          <a href="/contact">Contact</a>
          <a href="/privacy">Privacy</a>
        </div>
        <div className="p-footer-bottom">
          <span>Arcan Painting · Project enquiries</span>
          <a href="tel:+14167272148">416 727 2148</a>
          <a href="mailto:info@arcanpainting.ca">info@arcanpainting.ca</a>
        </div>
      </footer>
    </div>
  );
}
