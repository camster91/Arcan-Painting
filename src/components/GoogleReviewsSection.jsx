import { useState, useRef, useEffect } from "react";
import { Star, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";

const GOOGLE_REVIEWS = [
  { name: "Reg Langen", rating: 5, date: "5 days ago", text: "Geraldo and his team are great. Joe our painter did an amazing job on our wallpaper install and painting project in our powder room. Thanks for the great work!", badge: "10 reviews" },
  { name: "Matthieu Gregoire", rating: 5, date: "3 weeks ago", text: "Jose and Gerardo did an amazing job putting the wallpaper up in my daughter's bed room! Highly recommend them.", badge: "Local Guide" },
  { name: "Yobani Gil", rating: 5, date: "1 month ago", text: "I highly recommend, Gerardo and Arcan painting, for any business and home painting and decoration jobs. I have dealt with them many times in the last 25 years and always been completely satisfied with the end result. They are very professional and prices are very reasonable. They get a 5 stars from me.", badge: "Local Guide" },
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
  { name: "Carlos Crespo", rating: 5, date: "4 months ago", text: "I'm really happy with the wallpaper painting and installation done by Arcan. The team was professional and finished the job right on time. The quality of their work was excellent, and they paid great attention to detail. I highly recommend them.", badge: "Local Guide" },
  { name: "Mick Norris", rating: 5, date: "4 months ago", text: "Arcan Painting did an outstanding job from start to finish. Their communication was clear, the crew was punctual, and the attention to detail was obvious in every part of the work. The prep was thorough, the lines were sharp, and the finish was flawless.", badge: "" },
  { name: "Steve Munroe", rating: 5, date: "4 months ago", text: "I needed a small paint job done, a room primed and painted. I had not used Arcan painting before so I tested them on this small project. I was very impressed at the thoroughness and speed of the job they performed. They were clean, hard working and professional.", badge: "Local Guide" },
];

const GOOGLE_MAPS_URL = "https://maps.app.goo.gl/WY8Rh5myeWX6JJhR6";

function ReviewCard({ review }) {
  const initials = review.name.split(" ").map(n => n[0]).join("").toUpperCase();
  
  return (
    <div className="flex-shrink-0 snap-start w-[300px] sm:w-[340px] bg-white rounded-2xl border border-slate-200 shadow-md p-5 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          {initials}
        </div>
        <div className="min-w-0">
          <div className="font-semibold text-slate-900 text-sm truncate">{review.name}</div>
          <div className="text-slate-400 text-xs">{review.badge ? `${review.badge} · ` : ""}{review.date}</div>
        </div>
        {/* Google G icon */}
        <div className="ml-auto flex-shrink-0">
          <svg width="18" height="18" viewBox="0 0 48 48" className="opacity-60">
            <path fill="#4285F4" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#34A853" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#EA4335" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
        </div>
      </div>
      
      {/* Stars */}
      <div className="flex items-center gap-0.5 mb-3">
        {[...Array(review.rating)].map((_, i) => (
          <Star key={i} size={14} className="text-amber-400 fill-amber-400" />
        ))}
      </div>
      
      {/* Review text */}
      <p className="text-slate-700 text-sm leading-relaxed flex-1">
        {review.text.length > 180 ? review.text.slice(0, 180) + "…" : review.text}
      </p>
    </div>
  );
}

export default function GoogleReviewsSection() {
  const [sectionVisible, setSectionVisible] = useState(false);
  const carouselRef = useRef(null);
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

  const scrollCarousel = (direction) => {
    if (!carouselRef.current) return;
    const scrollAmount = carouselRef.current.offsetWidth * 0.8;
    carouselRef.current.scrollBy({
      left: direction === "next" ? scrollAmount : -scrollAmount,
      behavior: "smooth"
    });
  };

  return (
    <section
      id="reviews"
      ref={sectionRef}
      className={[
        "py-16 md:py-24 bg-white",
        "transition-all duration-700 ease-out",
        sectionVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
      ].join(" ")}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10 md:mb-14">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold uppercase tracking-wider px-4 py-1.5 rounded-full mb-4">
            <svg width="14" height="14" viewBox="0 0 48 48">
              <path fill="#4285F4" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#34A853" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#EA4335" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Google Reviews
          </div>
          
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight mb-4">
            What Our Customers Say
          </h2>
          
          {/* Rating summary */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="text-4xl font-bold text-slate-900">5.0</span>
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={22} className="text-amber-400 fill-amber-400" />
              ))}
            </div>
            <span className="text-slate-500 text-sm">18 reviews on Google</span>
          </div>
        </div>

        {/* Carousel */}
        <div className="relative group">
          <button
            onClick={() => scrollCarousel("prev")}
            className="hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white border border-slate-200 rounded-full shadow-lg items-center justify-center text-slate-600 hover:text-blue-600 hover:border-blue-300 transition-all opacity-0 group-hover:opacity-100"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => scrollCarousel("next")}
            className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white border border-slate-200 rounded-full shadow-lg items-center justify-center text-slate-600 hover:text-blue-600 hover:border-blue-300 transition-all opacity-0 group-hover:opacity-100"
          >
            <ChevronRight size={20} />
          </button>

          <div
            ref={carouselRef}
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4"
            style={{ WebkitOverflowScrolling: "touch", scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {GOOGLE_REVIEWS.map((review, i) => (
              <ReviewCard key={i} review={review} />
            ))}
          </div>

          <div className="md:hidden text-center mt-2">
            <span className="text-slate-400 text-xs">← Swipe to see more →</span>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-10">
          <a
            href={GOOGLE_MAPS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold text-sm transition-colors"
          >
            See all reviews on Google
            <ExternalLink size={14} />
          </a>
        </div>
      </div>

      <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; }`}</style>
    </section>
  );
}
