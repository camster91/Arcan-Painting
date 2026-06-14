"use client";

import { useState, useEffect } from "react";

function ProgressBar({ step }) {
  return (
    <div className="flex gap-2 max-w-xs mx-auto mb-10">
      {[1, 2, 3, 4].map((s) => (
        <div
          key={s}
          className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
            s <= step ? "bg-amber-500" : "bg-gray-200"
          }`}
        />
      ))}
    </div>
  );
}

function StepWelcome({ onNext }) {
  return (
    <div className="text-center py-12 px-6">
      <div className="text-6xl mb-6">🎨</div>
      <h1 className="text-3xl font-bold text-gray-900 mb-3">
        Welcome to your Command Centre
      </h1>
      <p className="text-lg text-gray-500 mb-8">
        Let's get you set up in a couple of minutes. This only happens once.
      </p>
      <button
        onClick={onNext}
        className="bg-amber-500 hover:bg-amber-600 text-white font-semibold text-lg px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all"
      >
        Let's Go &rarr;
      </button>
    </div>
  );
}

function StepBusinessInfo({ onNext, onBack }) {
  const [form, setForm] = useState({
    businessName: "Arcan Painting",
    phone: "(416) 727-2148",
    email: "info@arcanpainting.ca",
    address: "",
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "save_business_info",
          company_name: form.businessName,
          company_phone: form.phone,
          company_email: form.email,
          company_address: form.address,
        }),
      });
      onNext();
    } catch {
      setSaving(false);
    }
  };

  return (
    <div className="py-8 px-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">
        Your business info
      </h1>
      <p className="text-gray-500 mb-8 text-center">
        This helps personalize your dashboard and marketing tools
      </p>
      <div className="space-y-5 max-w-md mx-auto">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Business Name
          </label>
          <input
            type="text"
            value={form.businessName}
            onChange={(e) => setForm({ ...form, businessName: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone
          </label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Address
          </label>
          <input
            type="text"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="123 Main St, Toronto, ON M5V 1A1"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors"
          />
        </div>
        <div className="flex gap-3 pt-4">
          <button
            onClick={onBack}
            className="px-6 py-3 text-gray-500 hover:text-gray-700 font-medium rounded-xl transition-colors"
          >
            Back
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white font-semibold py-3 rounded-xl shadow-lg transition-all"
          >
            {saving ? "Saving..." : "Save & Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}

function StepConnectGoogle({ onNext, onBack }) {
  const [googleConnected, setGoogleConnected] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetch("/api/onboarding", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return;
        setChecking(false);
        if (data.googleConnected) {
          setGoogleConnected(true);
          setTimeout(() => onNext(), 1500);
        }
      })
      .catch(() => {
        if (mounted) setChecking(false);
      });
    return () => {
      mounted = false;
    };
  }, [onNext]);

  const handleSkip = async () => {
    await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ action: "set_step", step: 4 }),
    });
    onNext();
  };

  return (
    <div className="py-8 px-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">
        Unlock your marketing tools
      </h1>
      <p className="text-gray-500 mb-8 text-center">
        Connect Google to activate AI, Gmail, and Google Business Profile
      </p>
      <div className="max-w-md mx-auto">
        <div className="border-2 border-blue-100 bg-blue-50 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <svg viewBox="0 0 24 24" width="28" height="28">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            <span className="text-xl font-bold text-gray-800">
              Connect with Google
            </span>
          </div>
          {googleConnected ? (
            <div className="flex items-center gap-2 text-green-700 font-semibold text-lg py-4">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Connected! Continuing...
            </div>
          ) : (
            <>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center gap-2 text-gray-700">
                  <span className="text-green-600">&#10003;</span> AI Assistant
                  (Gemini) — free with your Google account
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <span className="text-green-600">&#10003;</span> Gmail — read
                  and reply to client emails
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <span className="text-green-600">&#10003;</span> Google
                  Business Profile — post updates & reply to reviews
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <span className="text-green-600">&#10003;</span> Google Ads —
                  view and manage campaigns
                </li>
              </ul>
              {checking ? (
                <div className="text-center py-3 text-gray-400">
                  Checking connection...
                </div>
              ) : (
                <a
                  href="/api/marketing/google/connect"
                  className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-center py-3 rounded-xl transition-colors"
                >
                  Connect Google Account
                </a>
              )}
            </>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={onBack}
            className="px-6 py-2 text-gray-400 hover:text-gray-600 text-sm transition-colors"
          >
            Back
          </button>
          {!googleConnected && (
            <button
              onClick={handleSkip}
              className="flex-1 text-gray-400 hover:text-gray-600 text-sm py-2 transition-colors"
            >
              Skip for now — I'll connect later
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function StepDone() {
  const handleFinish = () => {
    fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ action: "complete" }),
    }).then(() => {
      window.location.href = "/admin";
    });
  };

  return (
    <div className="text-center py-12 px-6">
      <div className="text-6xl mb-4">🎉</div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        You're all set!
      </h1>
      <p className="text-gray-500 mb-8">
        Your Arcan Painting Command Centre is ready.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto mb-8">
        <a
          href="/admin/leads/new"
          className="block p-4 bg-white border border-gray-200 rounded-xl hover:border-amber-300 hover:shadow-md transition-all"
        >
          <div className="text-2xl mb-2">📋</div>
          <div className="font-semibold text-gray-900 text-sm">Add a lead</div>
          <div className="text-xs text-gray-500 mt-1">
            Start tracking new clients
          </div>
        </a>
        <a
          href="/admin/calendar"
          className="block p-4 bg-white border border-gray-200 rounded-xl hover:border-amber-300 hover:shadow-md transition-all"
        >
          <div className="text-2xl mb-2">📅</div>
          <div className="font-semibold text-gray-900 text-sm">
            Book estimate
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Schedule a site visit
          </div>
        </a>
      </div>
      <button
        onClick={handleFinish}
        className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-lg py-4 px-8 rounded-2xl shadow-lg transition-all"
      >
        Go to Dashboard &rarr;
      </button>
    </div>
  );
}

export default function OnboardingPage() {
  const [step, setStep] = useState(1);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="pt-8 pb-4 text-center">
        <span className="text-xl font-bold text-amber-600">
          Arcan Painting
        </span>
      </div>
      <div className="flex-1 flex flex-col max-w-lg mx-auto w-full px-4">
        <ProgressBar step={step} />
        {step === 1 && <StepWelcome onNext={() => setStep(2)} />}
        {step === 2 && (
          <StepBusinessInfo
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && (
          <StepConnectGoogle
            onNext={() => setStep(4)}
            onBack={() => setStep(2)}
          />
        )}
        {step === 4 && <StepDone />}
      </div>
    </div>
  );
}
