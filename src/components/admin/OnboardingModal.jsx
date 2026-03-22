"use client";

import { useState } from "react";
import { X, Mail, Bot, MapPin, BarChart3, Calendar, Check } from "lucide-react";

const FEATURES = [
  { icon: Mail, label: "Gmail", desc: "Send estimates & invoices from your email" },
  { icon: Bot, label: "AI Assistant", desc: "Smart marketing powered by Google AI" },
  { icon: MapPin, label: "Google Business", desc: "Manage your Business Profile" },
  { icon: BarChart3, label: "Google Ads", desc: "Run & track ad campaigns" },
  { icon: Calendar, label: "Calendar", desc: "Sync your schedule" },
];

export default function OnboardingModal({ onComplete, onSkip }) {
  const [connecting, setConnecting] = useState(false);

  const handleConnect = async () => {
    setConnecting(true);
    // Record that we prompted, then redirect to Google OAuth
    try {
      await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "prompted" }),
      });
    } catch {
      // Non-critical, continue with connect
    }
    window.location.href = "/api/marketing/google/connect?from=onboarding";
  };

  const handleSkip = async () => {
    try {
      await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "complete" }),
      });
    } catch {
      // Continue even if API call fails
    }
    onSkip?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 px-6 py-8 text-center text-white">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <img
              src="/logo.png"
              alt="Arcan Painting"
              className="w-12 h-12 object-contain"
            />
          </div>
          <h2 className="text-2xl font-bold mb-2">Welcome to Arcan Painting!</h2>
          <p className="text-amber-100 text-sm">
            Let's get your workspace set up in one step.
          </p>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          <p className="text-slate-700 text-sm mb-5">
            Connect your Google account to unlock all these features:
          </p>

          <div className="space-y-3 mb-6">
            {FEATURES.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="flex-shrink-0 w-9 h-9 bg-amber-50 rounded-lg flex items-center justify-center">
                  <Icon size={18} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">{label}</p>
                  <p className="text-xs text-slate-500">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Connect Button */}
          <button
            onClick={handleConnect}
            disabled={connecting}
            className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white rounded-xl font-medium transition-colors text-sm"
          >
            {connecting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Connect Google Account
              </>
            )}
          </button>

          {/* Skip link */}
          <button
            onClick={handleSkip}
            className="w-full mt-3 px-4 py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            Skip for now — I'll set this up later
          </button>
        </div>
      </div>
    </div>
  );
}
