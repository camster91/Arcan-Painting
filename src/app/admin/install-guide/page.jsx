"use client";

import { useState } from "react";
import {
  Smartphone,
  Monitor,
  Download,
  CheckCircle,
  Wifi,
  WifiOff,
  Home,
  Share,
  MoreVertical,
  Maximize,
} from "lucide-react";

export default function InstallGuidePage() {
  const [currentPlatform, setCurrentPlatform] = useState("ios");

  const installSteps = {
    ios: [
      {
        step: 1,
        title: "Open Safari",
        description: "Navigate to arcanpainting.ca/admin in Safari browser",
        icon: <Monitor className="w-6 h-6" />,
      },
      {
        step: 2,
        title: "Tap Share Button",
        description: "Tap the share button (square with arrow) at the bottom",
        icon: <Share className="w-6 h-6" />,
      },
      {
        step: 3,
        title: "Add to Home Screen",
        description: "Scroll down and tap 'Add to Home Screen'",
        icon: <Home className="w-6 h-6" />,
      },
      {
        step: 4,
        title: "Confirm Installation",
        description: "Tap 'Add' to install the app to your home screen",
        icon: <CheckCircle className="w-6 h-6" />,
      },
    ],
    android: [
      {
        step: 1,
        title: "Open Chrome",
        description: "Navigate to arcanpainting.ca/admin in Chrome browser",
        icon: <Monitor className="w-6 h-6" />,
      },
      {
        step: 2,
        title: "Install Banner",
        description: "Tap 'Install' when the banner appears, or tap menu (⋮)",
        icon: <Download className="w-6 h-6" />,
      },
      {
        step: 3,
        title: "Add to Home screen",
        description: "Select 'Add to Home screen' from the menu",
        icon: <Home className="w-6 h-6" />,
      },
      {
        step: 4,
        title: "Confirm Installation",
        description: "Tap 'Add' to install the app",
        icon: <CheckCircle className="w-6 h-6" />,
      },
    ],
    desktop: [
      {
        step: 1,
        title: "Open Chrome/Edge",
        description: "Navigate to arcanpainting.ca/admin",
        icon: <Monitor className="w-6 h-6" />,
      },
      {
        step: 2,
        title: "Install Button",
        description: "Look for the install button in the address bar",
        icon: <Download className="w-6 h-6" />,
      },
      {
        step: 3,
        title: "Install App",
        description: "Click 'Install' in the popup dialog",
        icon: <Maximize className="w-6 h-6" />,
      },
      {
        step: 4,
        title: "Launch App",
        description: "The app will open in its own window",
        icon: <CheckCircle className="w-6 h-6" />,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Smartphone className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-4">
            Install Arcan CRM App
          </h1>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">
            Get the full native app experience on your phone, tablet, or
            desktop. Works offline and loads instantly!
          </p>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-xl p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <WifiOff className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">Works Offline</h3>
            <p className="text-slate-600 text-sm">
              Access your data even without internet connection
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Download className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">
              Lightning Fast
            </h3>
            <p className="text-slate-600 text-sm">
              Instant loading with cached data and resources
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 text-center">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Smartphone className="w-6 h-6 text-amber-600" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">Native Feel</h3>
            <p className="text-slate-600 text-sm">
              Full-screen app experience with home screen icon
            </p>
          </div>
        </div>

        {/* Platform Selection */}
        <div className="bg-white rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-6 text-center">
            Choose Your Device
          </h2>

          <div className="flex justify-center gap-4 mb-8">
            <button
              onClick={() => setCurrentPlatform("ios")}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                currentPlatform === "ios"
                  ? "bg-amber-500 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              iPhone/iPad
            </button>
            <button
              onClick={() => setCurrentPlatform("android")}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                currentPlatform === "android"
                  ? "bg-amber-500 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Android
            </button>
            <button
              onClick={() => setCurrentPlatform("desktop")}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                currentPlatform === "desktop"
                  ? "bg-amber-500 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Desktop
            </button>
          </div>

          {/* Installation Steps */}
          <div className="space-y-6">
            {installSteps[currentPlatform].map((step) => (
              <div key={step.step} className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                  <span className="text-amber-700 font-bold">{step.step}</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 mb-1">
                    {step.title}
                  </h3>
                  <p className="text-slate-600 text-sm">{step.description}</p>
                </div>
                <div className="flex-shrink-0 text-slate-400">{step.icon}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Features List */}
        <div className="bg-white rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-6">
            What You Get
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-slate-700">Home screen shortcut</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-slate-700">Full-screen experience</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-slate-700">Offline functionality</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-slate-700">Push notifications</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-slate-700">Background sync</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-slate-700">Faster loading times</span>
            </div>
          </div>
        </div>

        {/* Troubleshooting */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <h2 className="text-xl font-bold text-amber-900 mb-4">
            Troubleshooting
          </h2>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-amber-800 mb-1">
                Don't see the install option?
              </h3>
              <p className="text-amber-700 text-sm">
                Make sure you're using a supported browser (Safari on iOS,
                Chrome on Android). The install prompt may take a few seconds to
                appear.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-amber-800 mb-1">
                App not working offline?
              </h3>
              <p className="text-amber-700 text-sm">
                Visit a few pages while online first to cache the data. The app
                will then work offline for previously visited content.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-amber-800 mb-1">Need help?</h3>
              <p className="text-amber-700 text-sm">
                Contact support or check with your admin if you're having
                installation issues.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Install Button */}
        <div className="text-center mt-12">
          <a
            href="/admin"
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-8 py-3 rounded-lg font-medium transition-colors"
          >
            <Download size={20} />
            Go to Admin Panel & Install
          </a>
        </div>
      </div>
    </div>
  );
}
