import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import LeadFormPopup from "./LeadFormPopup";

export default function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isLeadFormOpen, setIsLeadFormOpen] = useState(false);
  const intervalRef = useRef(null);
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  const testimonials = [
    {
      name: "Sarah Johnson",
      location: "Downtown Resident",
      rating: 5,
      review:
        "Arcan and Sons transformed our home completely! The attention to detail was incredible, and they finished ahead of schedule. Jose and his sons were professional, clean, and the quality is outstanding. Highly recommend!",
      image:
        "https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=150&q=80",
      service: "Interior Painting",
    },
    {
      name: "Michael Chen",
      location: "Business Owner",
      rating: 5,
      review:
        "We needed our office painted over the weekend to minimize business disruption. The team worked efficiently and delivered perfect results. The color consultation helped us choose the perfect professional look.",
      image:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=150&q=80",
      service: "Commercial Painting",
    },
    {
      name: "Emily Rodriguez",
      location: "Historic District",
      rating: 5,
      review:
        "Our Victorian home required special care and historical accuracy. The Cañabate family understood our needs perfectly and restored our home's beauty while preserving its character. Exceptional craftsmanship!",
      image:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=150&q=80",
      service: "Exterior Painting",
    },
    {
      name: "David Thompson",
      location: "Suburban Homeowner",
      rating: 5,
      review:
        "From the initial estimate to the final cleanup, everything was perfect. Fair pricing, excellent communication, and beautiful results. Our neighbors keep asking who painted our house!",
      image:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=150&q=80",
      service: "Exterior Painting",
    },
    {
      name: "Lisa Martinez",
      location: "Restaurant Owner",
      rating: 5,
      review:
        "The team created the exact ambiance we wanted for our restaurant. The decorative finishes are stunning and have received countless compliments from customers. Professional service from start to finish.",
      image:
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=150&q=80",
      service: "Specialty Finishes",
    },
    {
      name: "Robert Wilson",
      location: "Property Manager",
      rating: 5,
      review:
        "I manage several properties and Arcan and Sons is my go-to team. Reliable, high-quality work, and they always respect tenant schedules. Three generations of excellence shows in every project.",
      image:
        "https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=150&q=80",
      service: "Multiple Services",
    },
  ];

  // Auto-advance carousel
  useEffect(() => {
    if (isAutoPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % testimonials.length);
      }, 5000);
    }
    return () => clearInterval(intervalRef.current);
  }, [isAutoPlaying, testimonials.length]);

  const goToSlide = (index) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000); // Resume auto-play after 10s
  };

  const goToPrevious = () => {
    setCurrentIndex(
      (prev) => (prev - 1 + testimonials.length) % testimonials.length,
    );
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  // Touch handlers for swipe functionality
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;

    const diffX = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (Math.abs(diffX) > minSwipeDistance) {
      if (diffX > 0) {
        // Swiped left - go to next
        goToNext();
      } else {
        // Swiped right - go to previous
        goToPrevious();
      }
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  return (
    <section
      className="py-20 bg-white dark:bg-slate-900 overflow-hidden"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-4xl mx-auto mb-16 text-center">
          {/* Modern bubble badge */}
          <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md border border-amber-500/30 rounded-full px-6 py-3 mb-8">
            <div className="bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full p-1.5">
              <Star size={18} className="text-white" />
            </div>
            <span className="text-amber-600 dark:text-amber-400 text-base lg:text-lg font-medium">
              What Customers Say
            </span>
          </div>

          <h2
            className="text-slate-900 dark:text-white font-bold leading-tight mb-6"
            style={{
              fontSize: "clamp(32px, 4vw, 48px)",
              letterSpacing: "-0.02em",
            }}
          >
            Real Reviews from Real Customers
          </h2>

          {/* Overall Rating */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={24}
                  className="text-amber-500 fill-current"
                />
              ))}
            </div>
            <div className="text-slate-900 dark:text-white">
              <span className="text-2xl font-bold">4.9</span>
              <span className="text-slate-600 dark:text-slate-300 ml-2">
                out of 5 stars
              </span>
            </div>
            <div className="text-slate-600 dark:text-slate-300 text-sm">
              (127 reviews)
            </div>
          </div>

          <p className="text-slate-600 dark:text-slate-300 text-lg md:text-xl leading-relaxed">
            Don't just take our word for it. Read what our satisfied customers
            have to say about their experience with Arcan and Sons.
          </p>
        </div>

        {/* Testimonials Carousel */}
        <div className="relative">
          {/* Main carousel container */}
          <div
            className="relative overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{
                transform: `translateX(-${currentIndex * 100}%)`,
              }}
            >
              {testimonials.map((testimonial, index) => (
                <div key={index} className="w-full flex-shrink-0 px-4">
                  <div className="max-w-4xl mx-auto">
                    <div className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl p-8 md:p-12 shadow-xl">
                      {/* Quote icon */}
                      <div className="text-6xl text-amber-500/30 font-serif leading-none mb-6">
                        "
                      </div>

                      {/* Rating Stars */}
                      <div className="flex items-center gap-1 mb-6">
                        {[...Array(testimonial.rating)].map((_, starIdx) => (
                          <Star
                            key={starIdx}
                            size={20}
                            className="text-amber-500 fill-current"
                          />
                        ))}
                      </div>

                      {/* Review Text */}
                      <p className="text-slate-700 dark:text-slate-300 text-xl md:text-2xl leading-relaxed mb-8 font-medium">
                        {testimonial.review}
                      </p>

                      {/* Customer Info */}
                      <div className="flex items-center gap-4">
                        <img
                          src={testimonial.image}
                          alt={testimonial.name}
                          className="w-16 h-16 rounded-full object-cover border-3 border-amber-200 dark:border-amber-700 shadow-lg"
                        />
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white text-lg">
                            {testimonial.name}
                          </div>
                          <div className="text-slate-600 dark:text-slate-400 text-sm">
                            {testimonial.location}
                          </div>
                          <div className="text-amber-600 text-sm font-semibold">
                            {testimonial.service}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-500 hover:border-amber-200 dark:hover:border-amber-700 z-10"
            aria-label="Previous testimonial"
          >
            <ChevronLeft size={20} />
          </button>

          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-500 hover:border-amber-200 dark:hover:border-amber-700 z-10"
            aria-label="Next testimonial"
          >
            <ChevronRight size={20} />
          </button>

          {/* Peek indicators for next/previous slides */}
          <div className="hidden md:block absolute left-0 top-1/2 -translate-y-1/2 w-32 h-48 bg-gradient-to-r from-transparent to-white/20 dark:to-slate-900/20 pointer-events-none opacity-50"></div>
          <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 w-32 h-48 bg-gradient-to-l from-transparent to-white/20 dark:to-slate-900/20 pointer-events-none opacity-50"></div>
        </div>

        {/* Pagination Dots */}
        <div className="flex items-center justify-center gap-2 mt-8">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-200 ${
                index === currentIndex
                  ? "bg-amber-500 scale-110"
                  : "bg-slate-300 dark:bg-slate-600 hover:bg-amber-300 dark:hover:bg-amber-700"
              }`}
              aria-label={`Go to testimonial ${index + 1}`}
            />
          ))}
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 pt-16 border-t border-slate-200 dark:border-slate-700">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="group">
              <div className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-amber-600 transition-colors duration-200">
                25+
              </div>
              <div className="text-slate-600 dark:text-slate-400 text-sm">
                Years in Business
              </div>
            </div>
            <div className="group">
              <div className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-amber-600 transition-colors duration-200">
                500+
              </div>
              <div className="text-slate-600 dark:text-slate-400 text-sm">
                Projects Completed
              </div>
            </div>
            <div className="group">
              <div className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-amber-600 transition-colors duration-200">
                98%
              </div>
              <div className="text-slate-600 dark:text-slate-400 text-sm">
                Customer Satisfaction
              </div>
            </div>
            <div className="group">
              <div className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-amber-600 transition-colors duration-200">
                Zero
              </div>
              <div className="text-slate-600 dark:text-slate-400 text-sm">
                Compromise on Quality
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 border border-amber-400/20 rounded-3xl p-8 md:p-12 max-w-3xl mx-auto shadow-2xl">
            <h3 className="text-white text-2xl md:text-3xl font-bold mb-4">
              Ready to Join Our Happy Customers?
            </h3>
            <p className="text-slate-300 text-lg mb-8 leading-relaxed">
              Experience the quality and service that has earned us a 4.9-star
              rating. Get your free, no-obligation estimate today.
            </p>
            <button
              className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 active:from-amber-500 active:to-yellow-500 text-slate-900 font-semibold px-8 py-4 rounded-xl transition-all duration-200 ease-out hover:scale-105 active:scale-[0.98] shadow-lg text-lg"
              style={{
                boxShadow: "0 4px 20px rgba(245, 158, 11, 0.3)",
              }}
              onClick={() => setIsLeadFormOpen(true)}
            >
              Get Your Free Estimate
            </button>
          </div>
        </div>
      </div>

      {/* LeadFormPopup */}
      <LeadFormPopup
        isOpen={isLeadFormOpen}
        onClose={() => setIsLeadFormOpen(false)}
      />
    </section>
  );
}
