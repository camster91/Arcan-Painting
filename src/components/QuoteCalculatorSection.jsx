"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import {
  Calculator,
  Paintbrush,
  Home,
  Building2,
  AlertCircle,
  Move,
} from "lucide-react";

export default function QuoteCalculatorSection() {
  const [type, setType] = useState("interior");
  const [squareFeet, setSquareFeet] = useState(600);
  const [rooms, setRooms] = useState(3);
  const [quality, setQuality] = useState("standard");
  const [ceilings, setCeilings] = useState(false);
  const [trim, setTrim] = useState(true);
  const [coats, setCoats] = useState(2);
  const [error, setError] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [cardPosition, setCardPosition] = useState({ x: 0, y: 0 });
  const cardRef = useRef(null);
  const dragStartRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 },
    );

    const section = document.getElementById("quote");
    if (section) observer.observe(section);

    return () => observer.disconnect();
  }, []);

  // Dragging functionality
  const handleMouseDown = (e) => {
    if (e.target.closest("input, button, select")) return; // Don't drag when interacting with form elements

    setIsDragging(true);
    const rect = cardRef.current.getBoundingClientRect();
    dragStartRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleTouchStart = (e) => {
    if (e.target.closest("input, button, select")) return;

    setIsDragging(true);
    const touch = e.touches[0];
    const rect = cardRef.current.getBoundingClientRect();
    dragStartRef.current = {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    };
    setDragOffset({
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;

    const container = cardRef.current.parentElement;
    const containerRect = container.getBoundingClientRect();
    const cardRect = cardRef.current.getBoundingClientRect();

    const newX = Math.max(
      0,
      Math.min(
        containerRect.width - cardRect.width,
        e.clientX - containerRect.left - dragOffset.x,
      ),
    );
    const newY = Math.max(
      0,
      Math.min(
        containerRect.height - cardRect.height,
        e.clientY - containerRect.top - dragOffset.y,
      ),
    );

    setCardPosition({ x: newX, y: newY });
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();

    const touch = e.touches[0];
    const container = cardRef.current.parentElement;
    const containerRect = container.getBoundingClientRect();
    const cardRect = cardRef.current.getBoundingClientRect();

    const newX = Math.max(
      0,
      Math.min(
        containerRect.width - cardRect.width,
        touch.clientX - containerRect.left - dragOffset.x,
      ),
    );
    const newY = Math.max(
      0,
      Math.min(
        containerRect.height - cardRect.height,
        touch.clientY - containerRect.top - dragOffset.y,
      ),
    );

    setCardPosition({ x: newX, y: newY });
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleDragEnd);
      document.addEventListener("touchmove", handleTouchMove, {
        passive: false,
      });
      document.addEventListener("touchend", handleDragEnd);

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleDragEnd);
        document.removeEventListener("touchmove", handleTouchMove);
        document.removeEventListener("touchend", handleDragEnd);
      };
    }
  }, [isDragging, dragOffset]);

  const fmt = (n) => n.toLocaleString(undefined, { maximumFractionDigits: 0 });

  const estimate = useMemo(() => {
    setError(null);
    const sf = Number(squareFeet) || 0;
    const rm = Number(rooms) || 0;
    const ct = Number(coats) || 1;

    if (sf <= 0 || rm <= 0 || ct <= 0) {
      return { low: 0, high: 0 };
    }

    // Base rates (rough heuristics for quick ballpark)
    const baseRatePerSf = type === "interior" ? 2.3 : 3.2; // USD per sq ft
    const roomAdj = 1 + Math.min(Math.max((rm - 3) * 0.05, -0.15), 0.25); // +/- 15-25%
    const coatsAdj = 1 + (ct - 2) * 0.18; // each extra/less coat ~18%

    const qualityAdj =
      quality === "premium" ? 1.22 : quality === "deluxe" ? 1.38 : 1;
    const ceilingsAdj = ceilings ? 1.1 : 1; // +10%
    const trimAdj = trim ? 1.12 : 1; // +12%

    let base = sf * baseRatePerSf;
    let total = base * roomAdj * coatsAdj * qualityAdj * ceilingsAdj * trimAdj;

    // Exterior complexity buffer
    if (type === "exterior") {
      total *= 1.08; // ladders, weather windows, masking
    }

    const low = Math.max(250, total * 0.9);
    const high = total * 1.15;

    return { low: Math.round(low), high: Math.round(high) };
  }, [type, squareFeet, rooms, quality, ceilings, trim, coats]);

  const handleNumber = (setter) => (e) => {
    const v = e.target.value;
    if (v === "") {
      setter("");
      return;
    }
    const num = Number(v);
    if (Number.isNaN(num)) {
      setError("Please enter a valid number");
    } else {
      setter(Math.max(0, num));
    }
  };

  return (
    <section
      id="quote"
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

      <div className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-[800px]">
        {/* Enhanced Section Header */}
        <div
          className={`text-center mb-16 lg:mb-24 transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-6 py-3 mb-8">
            <div className="bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full p-1.5">
              <Calculator size={18} className="text-white" />
            </div>
            <span className="text-white/90 text-lg font-medium">
              Quick Estimate Calculator
            </span>
          </div>

          {/* Main Headline */}
          <h2 className="text-3xl lg:text-4xl font-bold text-white leading-tight mb-8">
            Get Your Ballpark Estimate in 30 Seconds
          </h2>

          {/* Subtitle */}
          <p className="text-lg lg:text-xl text-slate-300 max-w-4xl mx-auto leading-relaxed mb-12">
            This rough range helps you plan your budget. We'll provide exact
            pricing after a
            <span className="text-amber-400 font-semibold">
              {" "}
              quick walkthrough and color consultation
            </span>
          </p>
        </div>

        {/* Draggable Calculator Card */}
        <div className="relative w-full h-full">
          <div
            ref={cardRef}
            className={`absolute bg-white/95 backdrop-blur-md rounded-3xl border border-white/20 shadow-2xl p-8 md:p-10 max-w-4xl w-full transition-all duration-300 cursor-move ${isDragging ? "scale-105 shadow-3xl z-50" : "z-10"}`}
            style={{
              transform: `translate(${cardPosition.x}px, ${cardPosition.y}px)`,
              animation:
                isVisible && !isDragging
                  ? "fadeInUp 0.8s ease-out both"
                  : "none",
            }}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
          >
            {/* Drag Indicator */}
            <div className="flex items-center justify-center mb-6">
              <div className="flex items-center gap-2 text-slate-400 text-lg">
                <Move size={20} />
                <span>Drag me around!</span>
              </div>
            </div>

            {/* Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-lg font-medium text-slate-700 mb-3">
                  Project type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setType("interior")}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border text-lg font-medium transition-colors ${
                      type === "interior"
                        ? "border-amber-500 bg-amber-50 text-amber-700"
                        : "border-slate-300 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <Home size={18} /> Interior
                  </button>
                  <button
                    onClick={() => setType("exterior")}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border text-lg font-medium transition-colors ${
                      type === "exterior"
                        ? "border-amber-500 bg-amber-50 text-amber-700"
                        : "border-slate-300 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <Building2 size={18} /> Exterior
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-lg font-medium text-slate-700 mb-3">
                  Square footage
                </label>
                <input
                  type="number"
                  min="0"
                  inputMode="numeric"
                  value={squareFeet}
                  onChange={handleNumber(setSquareFeet)}
                  className="w-full px-4 py-3 text-lg border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  placeholder="e.g. 600"
                />
                <p className="text-sm text-slate-500 mt-2">
                  Total paintable area (estimate is fine)
                </p>
              </div>

              <div>
                <label className="block text-lg font-medium text-slate-700 mb-3">
                  Number of rooms
                </label>
                <input
                  type="number"
                  min="1"
                  inputMode="numeric"
                  value={rooms}
                  onChange={handleNumber(setRooms)}
                  className="w-full px-4 py-3 text-lg border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  placeholder="e.g. 3"
                />
              </div>

              <div>
                <label className="block text-lg font-medium text-slate-700 mb-3">
                  Paint quality
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: "standard", label: "Standard" },
                    { key: "premium", label: "Premium" },
                    { key: "deluxe", label: "Deluxe" },
                  ].map((q) => (
                    <button
                      key={q.key}
                      onClick={() => setQuality(q.key)}
                      className={`px-4 py-3 rounded-lg border text-lg font-medium transition-colors ${
                        quality === q.key
                          ? "border-amber-500 bg-amber-50 text-amber-700"
                          : "border-slate-300 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {q.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-lg font-medium text-slate-700 mb-3">
                  Extras
                </label>
                <div className="flex flex-wrap gap-4">
                  <label className="inline-flex items-center gap-3 text-lg text-slate-700">
                    <input
                      type="checkbox"
                      checked={ceilings}
                      onChange={(e) => setCeilings(e.target.checked)}
                      className="w-5 h-5 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                    />
                    Include ceilings
                  </label>
                  <label className="inline-flex items-center gap-3 text-lg text-slate-700">
                    <input
                      type="checkbox"
                      checked={trim}
                      onChange={(e) => setTrim(e.target.checked)}
                      className="w-5 h-5 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                    />
                    Include trim/doors
                  </label>
                  <label className="inline-flex items-center gap-3 text-lg text-slate-700">
                    Coats:
                    <select
                      value={coats}
                      onChange={(e) => setCoats(Number(e.target.value))}
                      className="px-3 py-2 text-lg border border-slate-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    >
                      <option value={1}>1</option>
                      <option value={2}>2</option>
                      <option value={3}>3</option>
                    </select>
                  </label>
                </div>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="mt-6 flex items-center gap-3 text-red-600 text-lg">
                <AlertCircle size={20} /> {error}
              </div>
            )}

            {/* Result */}
            <div className="mt-8 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <div className="text-slate-400 text-lg">
                  Your Estimated Range
                </div>
                <div className="text-5xl lg:text-6xl font-bold text-white mt-2">
                  ${fmt(estimate.low)} – ${fmt(estimate.high)}
                </div>
                <div className="text-sm text-slate-400 mt-2">
                  Based on your inputs. Includes prep, materials, and cleanup.
                </div>
              </div>
              <button
                className="w-full md:w-auto px-8 py-4 rounded-xl font-bold text-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-900 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                onClick={() => {
                  const el = document.getElementById("contact");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Lock in a free exact quote
              </button>
            </div>
          </div>
        </div>

        {/* Note */}
        <p className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-sm text-slate-400 text-center">
          This is a rough estimate for planning purposes only and not a final
          bid.
        </p>
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
