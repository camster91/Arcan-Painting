import { ArrowUpRight } from "lucide-react";

export function ButtonLink({ href, children, subtle = false, ...props }) {
  return (
    <a
      className={`p-button${subtle ? " p-button--line" : ""}`}
      href={href}
      {...props}
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
