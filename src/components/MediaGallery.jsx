import { useState, useEffect } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Download,
  Share2,
  Maximize2,
} from "lucide-react";

export default function MediaGallery() {
  const [mediaItems, setMediaItems] = useState([]);
  const [displayedItems, setDisplayedItems] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentLightboxIndex, setCurrentLightboxIndex] = useState(0);
  const [videoStates, setVideoStates] = useState({});
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const itemsPerPage = 6; // Changed from 12 to 6

  // Enhanced media data with more realistic assets
  const allMediaItems = [
    // Original asset from user's image
    {
      id: 1,
      type: "image",
      src: "https://ucarecdn.com/e0a5a531-0739-43d5-88c9-5245ac7df197/",
      thumbnail:
        "https://ucarecdn.com/e0a5a531-0739-43d5-88c9-5245ac7df197/-/resize/400x300/",
      alt: "Residential exterior painting project",
      title: "Modern Home Exterior",
      location: "Toronto, ON",
      category: "Exterior",
    },
    {
      id: 2,
      type: "video",
      src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      thumbnail:
        "https://raw.createusercontent.com/d2ce145f-1c9a-4775-a08c-4100b9befc80/-/resize/400x300/",
      alt: "Interior painting time-lapse",
      title: "Living Room Transformation",
      location: "Toronto, ON",
      category: "Interior",
      duration: "2:45",
    },
    {
      id: 3,
      type: "image",
      src: "https://raw.createusercontent.com/53389e1e-51cd-469e-b473-29eac22ce64a/",
      thumbnail:
        "https://raw.createusercontent.com/53389e1e-51cd-469e-b473-29eac22ce64a/-/resize/400x300/",
      alt: "Victorian house restoration",
      title: "Heritage Home Revival",
      location: "Cabbagetown, Toronto",
      category: "Restoration",
    },
    {
      id: 4,
      type: "image",
      src: "https://raw.createusercontent.com/d2ce145f-1c9a-4775-a08c-4100b9befc80/",
      thumbnail:
        "https://raw.createusercontent.com/d2ce145f-1c9a-4775-a08c-4100b9befc80/-/resize/400x300/",
      alt: "Modern living room accent wall",
      title: "Contemporary Interior",
      location: "King West, Toronto",
      category: "Interior",
    },
    {
      id: 5,
      type: "video",
      src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
      thumbnail:
        "https://raw.createusercontent.com/d50a77c7-d90c-45ba-9576-7a2cf47250e2/-/resize/400x300/",
      alt: "Commercial painting process",
      title: "Office Makeover Process",
      location: "Financial District",
      category: "Commercial",
      duration: "1:30",
    },
    {
      id: 6,
      type: "image",
      src: "https://raw.createusercontent.com/f65dfae2-70a9-4a7d-8940-81b3d3886d79/",
      thumbnail:
        "https://raw.createusercontent.com/f65dfae2-70a9-4a7d-8940-81b3d3886d79/-/resize/400x300/",
      alt: "Kitchen cabinet refinishing",
      title: "Cabinet Transformation",
      location: "Leslieville, Toronto",
      category: "Specialty",
    },
    {
      id: 7,
      type: "image",
      src: "https://raw.createusercontent.com/7d37dacc-c925-4e2b-8f27-fed02d035c24/",
      thumbnail:
        "https://raw.createusercontent.com/7d37dacc-c925-4e2b-8f27-fed02d035c24/-/resize/400x300/",
      alt: "Bungalow exterior repaint",
      title: "Heritage Bungalow Revival",
      location: "The Beaches",
      category: "Exterior",
    },
    {
      id: 8,
      type: "video",
      src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      thumbnail:
        "https://raw.createusercontent.com/cc8b1f97-59b0-444a-bba4-69e3af897526/-/resize/400x300/",
      alt: "Hallway painting timelapse",
      title: "Condo Hallway Transformation",
      location: "Liberty Village",
      category: "Interior",
      duration: "3:20",
    },
    {
      id: 9,
      type: "image",
      src: "https://raw.createusercontent.com/0ec3d70a-b3a9-40cf-aa06-5429e9b5673e/",
      thumbnail:
        "https://raw.createusercontent.com/0ec3d70a-b3a9-40cf-aa06-5429e9b5673e/-/resize/400x300/",
      alt: "Storefront facade repaint",
      title: "Boutique Storefront Update",
      location: "Queen Street West",
      category: "Commercial",
    },
    {
      id: 10,
      type: "image",
      src: "https://raw.createusercontent.com/faa1a748-2caa-4e77-91fe-bf91f2de16f4/",
      thumbnail:
        "https://raw.createusercontent.com/faa1a748-2caa-4e77-91fe-bf91f2de16f4/-/resize/400x300/",
      alt: "Staircase restoration",
      title: "Grand Staircase Restoration",
      location: "Rosedale, Toronto",
      category: "Interior",
    },
    {
      id: 11,
      type: "image",
      src: "https://raw.createusercontent.com/43706a76-1c6e-46b8-a1ee-6a562bf87456/",
      thumbnail:
        "https://raw.createusercontent.com/43706a76-1c6e-46b8-a1ee-6a562bf87456/-/resize/400x300/",
      alt: "Bedroom accent wall",
      title: "Master Bedroom Feature Wall",
      location: "High Park Area",
      category: "Interior",
    },
    {
      id: 12,
      type: "image",
      src: "https://raw.createusercontent.com/71313112-29a6-494a-a20f-b9fefa4f2340/",
      thumbnail:
        "https://raw.createusercontent.com/71313112-29a6-494a-a20f-b9fefa4f2340/-/resize/400x300/",
      alt: "Bathroom renovation",
      title: "Spa-Inspired Bathroom",
      location: "Yorkville, Toronto",
      category: "Interior",
    },
  ];

  useEffect(() => {
    // Initialize media items
    setMediaItems(allMediaItems);

    // Load first 6 items only
    const initialItems = allMediaItems.slice(0, itemsPerPage);
    setDisplayedItems(initialItems);

    // Intersection observer for animation
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 },
    );

    const section = document.getElementById("media-gallery");
    if (section) observer.observe(section);

    return () => observer.disconnect();
  }, []);

  const loadMoreItems = () => {
    setLoading(true);

    setTimeout(() => {
      const nextPage = currentPage + 1;
      const startIndex = 0;
      const endIndex = nextPage * itemsPerPage;
      const newItems = allMediaItems.slice(startIndex, endIndex);

      setDisplayedItems(newItems);
      setCurrentPage(nextPage);
      setLoading(false);
    }, 800);
  };

  const hasMoreItems = displayedItems.length < allMediaItems.length;

  const openLightbox = (index) => {
    setCurrentLightboxIndex(index);
    setLightboxOpen(true);
    document.body.style.overflow = "hidden";
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    document.body.style.overflow = "unset";

    // Pause any playing videos
    const videos = document.querySelectorAll(".lightbox-video");
    videos.forEach((video) => video.pause());
  };

  const goToPrevious = () => {
    const newIndex =
      currentLightboxIndex > 0
        ? currentLightboxIndex - 1
        : displayedItems.length - 1;
    setCurrentLightboxIndex(newIndex);
  };

  const goToNext = () => {
    const newIndex =
      currentLightboxIndex < displayedItems.length - 1
        ? currentLightboxIndex + 1
        : 0;
    setCurrentLightboxIndex(newIndex);
  };

  const toggleVideoPlay = (videoId) => {
    setVideoStates((prev) => ({
      ...prev,
      [videoId]: {
        ...prev[videoId],
        isPlaying: !prev[videoId]?.isPlaying,
      },
    }));
  };

  const toggleVideoMute = (videoId) => {
    setVideoStates((prev) => ({
      ...prev,
      [videoId]: {
        ...prev[videoId],
        isMuted: !prev[videoId]?.isMuted,
      },
    }));
  };

  const getCategoryColor = (category) => {
    const colors = {
      Interior: "bg-blue-100 text-blue-800",
      Exterior: "bg-green-100 text-green-800",
      Commercial: "bg-purple-100 text-purple-800",
      Specialty: "bg-amber-100 text-amber-800",
      Restoration: "bg-red-100 text-red-800",
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  const currentItem = displayedItems[currentLightboxIndex];

  return (
    <section id="media-gallery" className="py-16 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div
          className={`text-center mb-12 transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="inline-flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-full px-6 py-3 mb-6">
            <div className="bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full p-1.5">
              <Maximize2 size={16} className="text-white" />
            </div>
            <span className="text-amber-700 text-sm font-medium">
              Our Work Portfolio
            </span>
          </div>

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
            Recent Projects Gallery
          </h2>

          <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto">
            Explore our latest painting projects across Toronto. Click on any
            image or video to see the full transformation in detail.
          </p>
        </div>

        {/* Media Grid - Changed to 2-3 columns */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {displayedItems.map((item, index) => (
            <div
              key={item.id}
              className={`group relative bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105 ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-4"
              }`}
              style={{
                animationDelay: isVisible ? `${index * 100}ms` : "0ms",
              }}
              onClick={() => openLightbox(index)}
            >
              {/* Media Container */}
              <div className="aspect-[4/3] relative overflow-hidden">
                {item.type === "image" ? (
                  <img
                    src={item.thumbnail}
                    alt={item.alt}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    loading="lazy"
                  />
                ) : (
                  <>
                    <img
                      src={item.thumbnail}
                      alt={item.alt}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center">
                        <Play size={24} className="text-slate-800 ml-1" />
                      </div>
                    </div>
                    {item.duration && (
                      <div className="absolute bottom-3 right-3 bg-black/70 text-white text-sm px-3 py-1 rounded">
                        {item.duration}
                      </div>
                    )}
                  </>
                )}

                {/* Category Badge */}
                <div className="absolute top-3 left-3">
                  <span
                    className={`text-sm font-medium px-3 py-1 rounded-full ${getCategoryColor(item.category)}`}
                  >
                    {item.category}
                  </span>
                </div>

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <h3 className="font-semibold text-lg mb-1 truncate">
                      {item.title}
                    </h3>
                    <p className="text-sm opacity-90 truncate">
                      {item.location}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Load More Button */}
        {hasMoreItems && (
          <div className="text-center">
            <button
              onClick={loadMoreItems}
              disabled={loading}
              className="inline-flex items-center gap-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 disabled:from-amber-300 disabled:to-yellow-300 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:hover:scale-100"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Loading More...
                </>
              ) : (
                <>
                  <Maximize2 size={20} />
                  Load More Projects
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Lightbox - remains the same */}
      {lightboxOpen && currentItem && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center">
          {/* Close Button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 z-10 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
          >
            <X size={24} className="text-white" />
          </button>

          {/* Navigation */}
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
          >
            <ChevronLeft size={24} className="text-white" />
          </button>

          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
          >
            <ChevronRight size={24} className="text-white" />
          </button>

          {/* Media Content */}
          <div className="max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center p-4">
            {currentItem.type === "image" ? (
              <img
                src={currentItem.src}
                alt={currentItem.alt}
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <div className="relative max-w-full max-h-full">
                <video
                  className="lightbox-video max-w-full max-h-full"
                  controls
                  autoPlay={videoStates[currentItem.id]?.isPlaying}
                  muted={videoStates[currentItem.id]?.isMuted}
                  preload="metadata"
                >
                  <source src={currentItem.src} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            )}
          </div>

          {/* Media Info */}
          <div className="absolute bottom-4 left-4 right-4 bg-black/50 rounded-lg p-4">
            <div className="flex items-center justify-between text-white">
              <div>
                <h3 className="font-semibold text-lg mb-1">
                  {currentItem.title}
                </h3>
                <p className="text-white/80">{currentItem.location}</p>
                <span
                  className={`inline-block text-xs font-medium px-2 py-1 rounded mt-2 ${getCategoryColor(currentItem.category)}`}
                >
                  {currentItem.category}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors">
                  <Share2 size={18} />
                </button>
                <button className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors">
                  <Download size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Image Counter */}
          <div className="absolute top-4 left-4 bg-black/50 text-white text-sm px-3 py-1 rounded">
            {currentLightboxIndex + 1} of {displayedItems.length}
          </div>
        </div>
      )}

      {/* Keyboard Navigation */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-40"
          onKeyDown={(e) => {
            if (e.key === "Escape") closeLightbox();
            if (e.key === "ArrowLeft") goToPrevious();
            if (e.key === "ArrowRight") goToNext();
          }}
          tabIndex={-1}
        />
      )}
    </section>
  );
}
