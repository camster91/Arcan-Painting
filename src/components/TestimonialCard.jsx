import { Star } from "lucide-react";
import { memo } from "react";

/**
 * TestimonialCard
 * Displays a single client testimonial with avatar, name, quote and star rating.
 * Accepts a `visible` prop to control fade-in animation.
 *
 * @param {{ testimonial: object, visible: boolean, className?: string }} props
 */
const TestimonialCard = memo(function TestimonialCard({
  testimonial,
  visible = true,
  className = "",
}) {
  if (!testimonial) return null;

  const { name, avatar, quote, rating = 5 } = testimonial;

  return (
    <div
      role="blockquote"
      aria-label={`Testimonial from ${name}`}
      className={[
        "transition-all duration-500 ease-in-out",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none",
        "bg-white/95 backdrop-blur-sm rounded-2xl px-5 py-4 shadow-lg",
        "border border-amber-100",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Stars */}
      <div
        className="flex gap-0.5 mb-2"
        aria-label={`Rated ${rating} out of 5 stars`}
        role="img"
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={14}
            className={
              i < rating
                ? "text-amber-400 fill-amber-400"
                : "text-slate-200 fill-slate-200"
            }
            aria-hidden="true"
          />
        ))}
      </div>

      {/* Quote */}
      <p
        className="text-slate-700 text-[0.82rem] leading-snug mb-3 line-clamp-3"
        style={{ fontSize: "clamp(0.78rem, 2vw, 0.85rem)" }}
      >
        &ldquo;{quote}&rdquo;
      </p>

      {/* Author */}
      <div className="flex items-center gap-2.5">
        <img
          src={avatar}
          alt={`${name} photo`}
          width={36}
          height={36}
          loading="lazy"
          decoding="async"
          className="w-9 h-9 rounded-full object-cover ring-2 ring-amber-200 shrink-0"
          onError={(e) => {
            // Fallback to initials avatar
            e.currentTarget.style.display = "none";
            e.currentTarget.nextSibling?.classList?.remove("hidden");
          }}
        />
        {/* Initials fallback */}
        <span
          aria-hidden="true"
          className="hidden w-9 h-9 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold flex items-center justify-center ring-2 ring-amber-200 shrink-0"
        >
          {name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)}
        </span>
        <div>
          <p className="text-xs font-semibold text-slate-800 leading-tight">{name}</p>
          <p className="text-[0.7rem] text-amber-600 font-medium">Verified Client</p>
        </div>
      </div>
    </div>
  );
});

export default TestimonialCard;
