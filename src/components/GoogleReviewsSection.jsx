import { useState, useRef, useEffect, useCallback } from "react";
import { Star, ExternalLink } from "lucide-react";

const GOOGLE_REVIEWS = [
  { name: "Reg Langen", rating: 5, date: "5 days ago", text: "Geraldo and his team are great. Joe our painter did an amazing job on our wallpaper install and painting project in our powder room. Thanks for the great work!", badge: "10 reviews" },
  { name: "Matthieu Gregoire", rating: 5, date: "3 weeks ago", text: "Jose and Gerardo did an amazing job putting the wallpaper up in my daughter's bed room! Highly recommend them.", badge: "Local Guide" },
  { name: "Yobani Gil", rating: 5, date: "1 month ago", text: "I highly recommend Gerardo and Arcan painting for any business and home painting and decoration jobs. I have dealt with them many times in the last 25 years and always been completely satisfied. Very professional and prices are very reasonable.", badge: "Local Guide" },
  { name: "Mykyta Vasylenko", rating: 5, date: "3 months ago", text: "I needed to have the walls in my home painted, and the job was done to a very high standard. Everything turned out neat, even, and very clean — the final result looks truly professional.", badge: "" },
  { name: "Steve Agisnaga", rating: 5, date: "3 months ago", text: "Arcan painting is a very professional business, we used them to paint our home and install wallpaper in the washroom. Outstanding job and attention to detail, highly recommended.", badge: "" },
  { name: "Charlene Layton", rating: 5, date: "3 months ago", text: "G and Jose did an expert job painting our garage working on various textures. The finished product turned out great. Thanks again!", badge: "" },
  { name: "Benjamin Dowd", rating: 5, date: "3 months ago", text: "Excellent Work Under Tight Deadlines! I couldn't be happier with the painting job on my bathroom and bedroom.", badge: "" },
  { name: "Olivia Lombardi", rating: 5, date: "4 months ago", text: "We use Arcan Painting for all of our Residential and Commercial needs. You can't top their customer service, experience and quality of work they put into every project. I highly recommend Arcan Painting.", badge: "" },
  { name: "Mario Granillo", rating: 5, date: "4 months ago", text: "Excellent workmanship, reliable and very professional. Decades of experience is shown in the results! 😀", badge: "" },
  { name: "Rodrigo Gil", rating: 5, date: "4 months ago", text: "I recently hired Arcan painting to paint the interior of my house, and I couldn't be happier with the results! The attention to detail was impeccable, and the quality of the work exceeded my expectations.", badge: "Local Guide" },
  { name: "Marina Lemos", rating: 5, date: "4 months ago", text: "Thank you José and Gerardo for the excellent work you do, very thorough. I recommend you 👌", badge: "" },
  { name: "Ani Cotani", rating: 5, date: "4 months ago", text: "They do impeccable work and above all, they are excellent people 👏👏", badge: "" },
  { name: "Mariel Cotani", rating: 5, date: "4 months ago", text: "The best 🤩🤩", badge: "" },
  { name: "Aldana Lemos", rating: 5, date: "4 months ago", text: "Excellent quality of work and professionalism!", badge: "" },
  { name: "Nathan Henry", rating: 5, date: "4 months ago", text: "Awesome work!", badge: "Local Guide" },
  { name: "Carlos Crespo", rating: 5, date: "4 months ago", text: "I'm really happy with the wallpaper painting and installation done by Arcan. The team was professional and finished the job right on time. The quality of their work was excellent.", badge: "Local Guide" },
  { name: "Mick Norris", rating: 5, date: "4 months ago", text: "Arcan Painting did an outstanding job from start to finish. Their communication was clear, the crew was punctual, and the attention to detail was obvious in every part of the work.", badge: "" },
  { name: "Steve Munroe", rating: 5, date: "4 months ago", text: "I needed a small paint job done, a room primed and painted. I was very impressed at the thoroughness and speed of the job they performed. They were clean, hard working and professional.", badge: "Local Guide" },
];

const GOOGLE_MAPS_URL = "https://maps.app.goo.gl/WY8Rh5myeWX6JJhR6";

// Split reviews into two rows
const ROW_1 = GOOGLE_REVIEWS.slice(0, 9);
const ROW_2 = GOOGLE_REVIEWS.slice(9);

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" className="opacity-70 flex-shrink-0">
      <path fill="#4285F4" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#34A853" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#EA4335" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}

function ReviewCard({ review }) {
  const initials = review.name.split(" ").map(n => n[0]).join("").toUpperCase();
  return (
    <div className="w-[280px] sm:w-[320px] flex-shrink-0 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg transition-shadow duration-300 p-5 flex flex-col select-none">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-slate-900 text-sm truncate">{review.name}</div>
          <div className="text-slate-400 text-[11px]">{review.badge ? `${review.badge} · ` : ""}{review.date}</div>
        </div>
        <GoogleIcon />
      </div>
      <div className="flex items-center gap-0.5 mb-2">
        {[...Array(review.rating)].map((_, i) => (
          <Star key={i} size={13} className="text-amber-400 fill-amber-400" />
        ))}
      </div>
      <p className="text-slate-600 text-[13px] leading-relaxed flex-1 line-clamp-4">
        {review.text}
      </p>
    </div>
  );
}

function ScrollingRow({ reviews, direction = "left", paused }) {
  const rowRef = useRef(null);
  const animRef = useRef(null);
  const posRef = useRef(0);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartPos = useRef(0);
  const [localPaused, setLocalPaused] = useState(false);

  const isPaused = paused || localPaused;
  const speed = direction === "left" ? 0.4 : -0.4;

  // Duplicate items for seamless loop
  const items = [...reviews, ...reviews, ...reviews];

  const animate = useCallback(() => {
    if (!rowRef.current) return;
    if (!isPaused && !isDragging.current) {
      posRef.current -= speed;
    }

    const totalWidth = rowRef.current.scrollWidth / 3;
    // Wrap around seamlessly
    if (direction === "left" && posRef.current <= -totalWidth) {
      posRef.current += totalWidth;
    } else if (direction === "right" && posRef.current >= 0) {
      posRef.current -= totalWidth;
    }

    rowRef.current.style.transform = `translateX(${posRef.current}px)`;
    animRef.current = requestAnimationFrame(animate);
  }, [isPaused, speed, direction]);

  useEffect(() => {
    // Set initial position for right-scrolling row
    if (direction === "right" && rowRef.current) {
      const totalWidth = rowRef.current.scrollWidth / 3;
      posRef.current = -totalWidth;
    }
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [animate, direction]);

  // Mouse drag
  const handleMouseDown = (e) => {
    isDragging.current = true;
    dragStartX.current = e.clientX;
    dragStartPos.current = posRef.current;
    setLocalPaused(true);
  };
  const handleMouseMove = (e) => {
    if (!isDragging.current) return;
    const diff = e.clientX - dragStartX.current;
    posRef.current = dragStartPos.current + diff;
  };
  const handleMouseUp = () => {
    isDragging.current = false;
    setTimeout(() => setLocalPaused(false), 2000);
  };

  // Touch drag
  const handleTouchStart = (e) => {
    isDragging.current = true;
    dragStartX.current = e.touches[0].clientX;
    dragStartPos.current = posRef.current;
    setLocalPaused(true);
  };
  const handleTouchMove = (e) => {
    if (!isDragging.current) return;
    const diff = e.touches[0].clientX - dragStartX.current;
    posRef.current = dragStartPos.current + diff;
  };
  const handleTouchEnd = () => {
    isDragging.current = false;
    setTimeout(() => setLocalPaused(false), 2000);
  };

  return (
    <div
      className="overflow-hidden cursor-grab active:cursor-grabbing"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        ref={rowRef}
        className="flex gap-4 will-change-transform"
        style={{ touchAction: "pan-y" }}
      >
        {items.map((review, i) => (
          <ReviewCard key={`${review.name}-${i}`} review={review} />
        ))}
      </div>
    </div>
  );
}

export default function GoogleReviewsSection() {
  const [sectionVisible, setSectionVisible] = useState(false);
  const [hovered, setHovered] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSectionVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.05 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="reviews"
      ref={sectionRef}
      className={[
        "py-16 md:py-24 bg-slate-50 overflow-hidden",
        "transition-all duration-700 ease-out",
        sectionVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
      ].join(" ")}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-10 md:mb-14">
        <div className="inline-flex items-center gap-2 bg-white border border-blue-100 text-blue-700 text-xs font-semibold uppercase tracking-wider px-4 py-1.5 rounded-full mb-4 shadow-sm">
          <GoogleIcon />
          Google Reviews
        </div>

        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight mb-4">
          What Our Customers Say
        </h2>

        <div className="flex items-center justify-center gap-3 mb-2">
          <span className="text-4xl font-bold text-slate-900">5.0</span>
          <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={22} className="text-amber-400 fill-amber-400" />
            ))}
          </div>
        </div>
        <p className="text-slate-500 text-sm">Based on 18 Google reviews</p>
      </div>

      {/* Two-row auto-scrolling carousel */}
      <div className="space-y-4">
        <ScrollingRow reviews={ROW_1} direction="left" paused={hovered} />
        <ScrollingRow reviews={ROW_2} direction="right" paused={hovered} />
      </div>

      {/* CTA */}
      <div className="text-center mt-10">
        <a
          href={GOOGLE_MAPS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-300 font-semibold text-sm px-6 py-3 rounded-full shadow-sm hover:shadow-md transition-all duration-200"
        >
          <GoogleIcon />
          See all reviews on Google
          <ExternalLink size={14} />
        </a>
      </div>
    </section>
  );
}
