import { useState, useEffect } from "react";
import { Heart, Users, Star, Quote } from "lucide-react";

export default function AboutSection() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 },
    );

    const section = document.getElementById("about");
    if (section) observer.observe(section);

    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="about"
      className="relative py-20 lg:py-32 overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700"
    >
      {/* Enhanced Background Effects */}
      <div className="absolute inset-0">
        {/* Animated gradient orbs */}
        <div className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-r from-amber-400/10 to-yellow-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-gradient-to-r from-blue-400/10 to-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>

        {/* Geometric pattern */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.3'%3E%3Cpath d='M40 0L0 40L40 80L80 40Z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              backgroundSize: "80px 80px",
            }}
          ></div>
        </div>
      </div>

      <div className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left column - Content */}
          <div
            className={`transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-6 py-3 mb-8">
              <div className="bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full p-1.5">
                <Heart size={18} className="text-white" />
              </div>
              <span className="text-white/90 text-base lg:text-lg font-medium">
                From Argentina to Toronto
              </span>
            </div>

            {/* Main headline */}
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-8">
              Three generations of painting excellence
            </h2>

            {/* Description paragraphs in one glassy card */}
            <div className="space-y-6 mb-12">
              <div className="relative backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl p-6 lg:p-8">
                <div className="space-y-6">
                  <p className="text-slate-300 text-lg leading-relaxed">
                    Our story begins with my father,{" "}
                    <strong className="text-white">Jose Cañabate</strong>, who
                    started our painting business back in Argentina. When he
                    immigrated to Toronto, Canada, he brought with him decades
                    of craftsmanship and an unwavering commitment to quality
                    that would become the foundation of our family enterprise.
                  </p>

                  <p className="text-slate-300 text-lg leading-relaxed">
                    The name <strong className="text-amber-400">ARCAN</strong>{" "}
                    represents our journey -{" "}
                    <em className="text-amber-300">Argentina Canada</em> -
                    symbolizing the bridge between our heritage and our new
                    Toronto home. My older brother{" "}
                    <strong className="text-white">Pablo</strong> and I worked
                    alongside our father from time to time, learning the trade
                    while serving Toronto homeowners. When our youngest brother{" "}
                    <strong className="text-white">JJ</strong> was old enough,
                    he began working with our father full-time.
                  </p>

                  <p className="text-slate-300 text-lg leading-relaxed">
                    As our father grew older, Pablo and I realized it was time
                    to step up and help him transition into retirement. That's
                    when Arcan Painting became{" "}
                    <strong className="text-amber-400">Arcan and Sons</strong> -
                    honoring our father's legacy while ensuring his values and
                    standards live on through the next generation serving the
                    GTA.
                  </p>
                </div>
              </div>
            </div>

            {/* Enhanced Signature */}
            <div className="relative backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl p-6 lg:p-8">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center shadow-xl">
                  <Users size={24} className="text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white font-dancing-script mb-1">
                    — Gerardo Cañabate
                  </div>
                  <div className="text-amber-400 font-semibold">
                    Co‑Owner & Lead Painter
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right column - Enhanced Images */}
          <div
            className={`relative transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
            style={{ animationDelay: "0.3s" }}
          >
            {/* Main image with enhanced styling */}
            <div className="relative">
              <div className="relative overflow-hidden rounded-3xl">
                <img
                  src="https://ucarecdn.com/163d1bd0-c531-4fa3-80b4-7e5dfa193f78/-/format/auto/"
                  alt="The Cañabate family - Jose and his three sons Pablo, Gerardo, and JJ painting a Toronto house, working together as a family team"
                  className="w-full h-[400px] object-cover"
                />

                {/* Image overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent"></div>

                {/* Border effect */}
                <div className="absolute inset-0 rounded-3xl ring-1 ring-white/20"></div>
              </div>

              {/* Enhanced testimonial card */}
              <div className="relative mt-8 backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl p-6 lg:p-8 shadow-xl">
                {/* Background decoration */}
                <div className="absolute -top-2 -right-2 w-12 h-12 bg-gradient-to-br from-amber-400/20 to-yellow-500/20 rounded-full blur-lg"></div>

                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-slate-700 to-slate-900 rounded-full flex items-center justify-center shadow-xl border border-white/20">
                      <span className="text-white font-bold text-xl">JC</span>
                    </div>
                    <div>
                      <div className="font-bold text-white text-lg">
                        Jose Cañabate
                      </div>
                      <div className="text-amber-400 font-medium">
                        Founder & Master Painter
                      </div>
                    </div>
                  </div>

                  {/* Quote icon */}
                  <div className="mb-3">
                    <Quote size={24} className="text-amber-400" />
                  </div>

                  <p className="text-slate-300 text-base lg:text-lg leading-relaxed italic">
                    "Hard work, attention to detail, and treating every home
                    like it's your own - these are the values I've passed down
                    to my sons."
                  </p>

                  {/* Star rating */}
                  <div className="flex items-center gap-1 mt-4">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        className="text-amber-400 fill-amber-400"
                      />
                    ))}
                    <span className="text-slate-400 text-sm ml-2">
                      Family Legacy
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx global>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}
