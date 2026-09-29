const LINKS = [
  { href: "/#services", label: "Services" },
  { href: "/#portfolio", label: "Work" },
  { href: "/#process", label: "Process" },
  { href: "/#faq", label: "FAQ" },
  { href: "/#contact", label: "Contact" },
  { href: "/privacy", label: "Privacy Notice" },
];

const SOCIAL = [
  { href: "https://www.instagram.com/arcanpaint", label: "Instagram" },
  { href: "https://www.facebook.com/arcanpainting", label: "Facebook" },
  { href: "https://www.linkedin.com/company/arcan-painting", label: "LinkedIn" },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-ink text-paper">
      <div className="mx-auto max-w-[1440px] px-4 pb-10 pt-20 sm:px-6 md:px-10">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <p className="font-display text-4xl leading-tight sm:text-5xl">
              Have a room, a floor or a building in mind?
            </p>
            <div className="mt-8 flex flex-col gap-3 text-lg">
              <a href="tel:+14167272148" className="w-fit border-b border-paper/30 pb-0.5 transition-colors hover:border-brand hover:text-brand">
                (416) 727-2148
              </a>
              <a href="mailto:info@arcanpainting.ca" className="w-fit border-b border-paper/30 pb-0.5 transition-colors hover:border-brand hover:text-brand">
                info@arcanpainting.ca
              </a>
            </div>
          </div>

          <nav aria-label="Footer" className="lg:col-span-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-paper/50">Site</p>
            <ul className="mt-5 space-y-3">
              {LINKS.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="text-paper/80 transition-colors hover:text-paper">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="lg:col-span-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-paper/50">Follow</p>
            <ul className="mt-5 space-y-3">
              {SOCIAL.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-paper/80 transition-colors hover:text-paper"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-20 flex flex-col gap-4 border-t border-paper/15 pt-8 text-sm text-paper/50 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-display text-2xl text-paper">Arcan Painting</p>
          <p>© {currentYear} Arcan Painting. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
