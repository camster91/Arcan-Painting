import { useState, useEffect } from "react";

export default function StatusFilterCarousel({
  currentStatus,
  onStatusChange,
  statusCounts = {},
}) {
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const statuses = [
    {
      key: "all",
      label: "All Leads",
      color: "bg-slate-100 text-slate-700 border-slate-200",
      activeColor: "bg-slate-800 text-white border-slate-800",
    },
    {
      key: "new",
      label: "New",
      color: "bg-blue-50 text-blue-700 border-blue-200",
      activeColor: "bg-blue-500 text-white border-blue-500",
    },
    {
      key: "contacted",
      label: "Contacted",
      color: "bg-yellow-50 text-yellow-700 border-yellow-200",
      activeColor: "bg-yellow-500 text-white border-yellow-500",
    },
    {
      key: "estimate_scheduled",
      label: "Estimate Scheduled",
      color: "bg-purple-50 text-purple-700 border-purple-200",
      activeColor: "bg-purple-500 text-white border-purple-500",
    },
    {
      key: "estimate_sent",
      label: "Estimate Sent",
      color: "bg-orange-50 text-orange-700 border-orange-200",
      activeColor: "bg-orange-500 text-white border-orange-500",
    },
    {
      key: "follow_up",
      label: "Follow Up",
      color: "bg-amber-50 text-amber-700 border-amber-200",
      activeColor: "bg-amber-500 text-white border-amber-500",
    },
    {
      key: "won",
      label: "Won",
      color: "bg-green-50 text-green-700 border-green-200",
      activeColor: "bg-green-500 text-white border-green-500",
    },
    {
      key: "lost",
      label: "Lost",
      color: "bg-red-50 text-red-700 border-red-200",
      activeColor: "bg-red-500 text-white border-red-500",
    },
  ];

  const checkScrollButtons = (container) => {
    if (!container) return;
    setCanScrollLeft(container.scrollLeft > 0);
    setCanScrollRight(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 1,
    );
  };

  useEffect(() => {
    const container = document.getElementById("status-carousel");
    if (container) {
      checkScrollButtons(container);
      const handleScroll = () => checkScrollButtons(container);
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, []);

  const scrollLeft = () => {
    const container = document.getElementById("status-carousel");
    if (container) {
      container.scrollBy({ left: -200, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    const container = document.getElementById("status-carousel");
    if (container) {
      container.scrollBy({ left: 200, behavior: "smooth" });
    }
  };

  return (
    <div className="relative px-4 py-4 bg-white border-b border-slate-200">
      {/* Scroll buttons for larger screens */}
      {canScrollLeft && (
        <button
          onClick={scrollLeft}
          className="hidden lg:flex absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white shadow-lg rounded-full items-center justify-center z-10 hover:bg-slate-50 transition-colors"
        >
          ←
        </button>
      )}

      {canScrollRight && (
        <button
          onClick={scrollRight}
          className="hidden lg:flex absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white shadow-lg rounded-full items-center justify-center z-10 hover:bg-slate-50 transition-colors"
        >
          →
        </button>
      )}

      {/* Status carousel */}
      <div
        id="status-carousel"
        className="flex gap-3 overflow-x-auto scrollbar-hide pb-2"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {statuses.map((status) => {
          const isActive = currentStatus === status.key;
          const count = statusCounts[status.key] || 0;
          const totalCount = Object.values(statusCounts).reduce(
            (sum, c) => sum + c,
            0,
          );
          const displayCount = status.key === "all" ? totalCount : count;

          return (
            <button
              key={status.key}
              onClick={() => onStatusChange(status.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all whitespace-nowrap ${
                isActive ? status.activeColor : status.color
              } hover:shadow-sm`}
            >
              <span>{status.label}</span>
              {displayCount > 0 && (
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-white text-slate-600 border border-slate-300"
                  }`}
                >
                  {displayCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Mobile scroll indicator */}
      <div className="lg:hidden mt-2 flex justify-center">
        <div className="flex space-x-1">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="w-1 h-1 rounded-full bg-slate-300" />
          ))}
        </div>
      </div>
    </div>
  );
}
