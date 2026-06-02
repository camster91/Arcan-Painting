"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import QuoteCalculatorSection from "@/components/QuoteCalculatorSection";

export default function QuotePage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return (
    <div className="min-h-screen bg-white transition-colors duration-300">
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        {mounted && <QuoteCalculatorSection />}
      </main>
      <Footer />
    </div>
  );
}
