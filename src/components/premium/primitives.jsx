import { ArrowUpRight } from "lucide-react";
import { getPublicCtaForHref } from "@/utils/publicCtas";

export function ButtonLink({ href, children, subtle = false, ...props }) {
  // Do not allow callers to smuggle arbitrary labels or destinations into the
  // analytics attributes. They are derived from the allowlist above.
  const safeProps = { ...props };
  delete safeProps["data-cta"];
  delete safeProps["data-cta-destination"];
  const cta = getPublicCtaForHref(href);

  return (
    <a
      className={`p-button${subtle ? " p-button--line" : ""}`}
      href={href}
      {...safeProps}
      { ...(cta ? { "data-cta": cta.label, "data-cta-destination": cta.destination } : {}) }
    >
      {children}
      <ArrowUpRight size={18} aria-hidden="true" />
    </a>
  );
}
export function SectionHeading({ eyebrow, title, children, as: Tag = "h2" }) {
  return (
    <div className="p-heading">
      {eyebrow && <p className="p-eyebrow">{eyebrow}</p>}
      <Tag>{title}</Tag>
      {children && <p className="p-copy">{children}</p>}
    </div>
  );
}
export function Section({ children, tone = "", className = "", ...props }) {
  return (
    <section
      className={`p-section ${tone ? `p-section--${tone}` : ""} ${className}`}
      {...props}
    >
      {children}
    </section>
  );
}
