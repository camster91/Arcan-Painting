"use client";

import { useState, useEffect } from "react";
import { Download, X, Smartphone, Monitor } from "lucide-react";

export default function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed or in standalone mode
    const checkInstallStatus = () => {
      const standalone = window.matchMedia(
        "(display-mode: standalone)",
      ).matches;
      const isInWebAppiOS = window.navigator.standalone === true;
      const isInWebAppChrome = window.matchMedia(
        "(display-mode: standalone)",
      ).matches;

      setIsStandalone(standalone || isInWebAppiOS || isInWebAppChrome);
      setIsInstalled(standalone || isInWebAppiOS || isInWebAppChrome);
    };

    checkInstallStatus();

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      console.log("PWA: Install prompt available");
      e.preventDefault();
      setDeferredPrompt(e);

      // Show our custom install prompt after a delay
      setTimeout(() => {
        if (!isInstalled) {
          setShowInstallPrompt(true);
        }
      }, 5000); // Wait 5 seconds before showing
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      console.log("PWA: App installed successfully");
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);

      // Show success message
      showNotification("App installed successfully!", "success");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    // Check if user dismissed the prompt before
    const dismissed = localStorage.getItem("pwa-install-dismissed");
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const daysSinceDismissed =
        (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);

      // Show again after 7 days
      if (daysSinceDismissed < 7) {
        setShowInstallPrompt(false);
      }
    }

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [isInstalled]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      // Show the install prompt
      deferredPrompt.prompt();

      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === "accepted") {
        console.log("PWA: User accepted the install prompt");
        showNotification("Installing app...", "info");
      } else {
        console.log("PWA: User dismissed the install prompt");
        localStorage.setItem("pwa-install-dismissed", Date.now().toString());
      }

      // Clear the deferredPrompt
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    } catch (error) {
      console.error("PWA: Install failed:", error);
      showNotification("Installation failed. Please try again.", "error");
    }
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    localStorage.setItem("pwa-install-dismissed", Date.now().toString());
  };

  const showNotification = (message, type) => {
    // Simple notification - you could integrate with a toast library
    console.log(`${type.toUpperCase()}: ${message}`);

    // Create a simple toast notification
    const toast = document.createElement("div");
    toast.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg text-white max-w-sm ${
      type === "success"
        ? "bg-green-500"
        : type === "error"
          ? "bg-red-500"
          : "bg-blue-500"
    }`;
    toast.textContent = message;

    document.body.appendChild(toast);

    // Animate in
    toast.style.transform = "translateX(100%)";
    setTimeout(() => {
      toast.style.transform = "translateX(0)";
      toast.style.transition = "transform 0.3s ease";
    }, 100);

    // Remove after 3 seconds
    setTimeout(() => {
      toast.style.transform = "translateX(100%)";
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 3000);
  };

  // Don't show if already installed or in standalone mode
  if (isInstalled || isStandalone || !showInstallPrompt || !deferredPrompt) {
    return null;
  }

  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    );

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            {isMobile ? (
              <Smartphone className="w-8 h-8 text-amber-500" />
            ) : (
              <Monitor className="w-8 h-8 text-amber-500" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Install Arcan CRM
            </h3>
            <p className="text-slate-600 text-sm mb-4">
              {isMobile
                ? "Add to your home screen for quick access and offline use"
                : "Install as an app for better performance and offline access"}
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={handleInstall}
                className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <Download size={16} />
                Install
              </button>
              <button
                onClick={handleDismiss}
                className="text-slate-500 hover:text-slate-700 px-3 py-2 text-sm"
              >
                Not now
              </button>
            </div>

            {/* Benefits list */}
            <div className="mt-4 text-xs text-slate-500">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                <span>Works offline</span>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                <span>Faster loading</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                <span>Native app experience</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-slate-400 hover:text-slate-600 p-1"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

// PWA Status indicator for admin users
export function PWAStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const checkStandalone = () => {
      const standalone = window.matchMedia(
        "(display-mode: standalone)",
      ).matches;
      const isInWebAppiOS = window.navigator.standalone === true;
      setIsStandalone(standalone || isInWebAppiOS);
    };

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    checkStandalone();
    setIsOnline(navigator.onLine);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isStandalone) return null;

  return (
    <div className="fixed top-4 right-4 z-40">
      <div
        className={`px-3 py-1 rounded-full text-xs font-medium ${
          isOnline ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
        }`}
      >
        {isOnline ? "● Online" : "● Offline"}
      </div>
    </div>
  );
}
