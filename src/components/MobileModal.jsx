"use client";

import { useEffect } from "react";
import { X, ChevronLeft } from "lucide-react";
import { useModal } from "@/contexts/ModalContext";

export default function MobileModal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  className = "",
  showCloseButton = true,
}) {
  const { openModal, closeModal } = useModal();

  useEffect(() => {
    if (isOpen) {
      openModal();
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
      return () => {
        closeModal();
        document.body.style.overflow = "unset";
      };
    }
  }, [isOpen, openModal, closeModal]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    const handleBackButton = (e) => {
      if (isOpen) {
        e.preventDefault();
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      window.addEventListener("popstate", handleBackButton);

      // Push a new state to handle back button
      window.history.pushState({ modal: true }, "");
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("popstate", handleBackButton);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      {/* Desktop backdrop */}
      <div
        className="hidden lg:block absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Modal Container - Full screen on mobile, centered card on desktop */}
      <div
        className={`
        absolute inset-0 lg:inset-4 xl:inset-8 2xl:inset-16
        bg-white lg:rounded-2xl lg:shadow-2xl
        flex flex-col overflow-hidden
        lg:max-w-4xl lg:max-h-[90vh] lg:mx-auto lg:my-auto
        ${className}
      `}
      >
        {/* Header - More prominent on mobile */}
        <div className="flex-shrink-0 bg-white border-b border-slate-200">
          <div className="px-4 py-4 lg:px-6 lg:py-5">
            <div className="flex items-center justify-between">
              {/* Mobile back button style */}
              <div className="flex items-center gap-3 lg:gap-0">
                {showCloseButton && (
                  <button
                    onClick={onClose}
                    className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900 rounded-lg transition-colors"
                    aria-label="Go back"
                  >
                    <ChevronLeft size={24} />
                  </button>
                )}
                <h2 className="text-xl lg:text-2xl font-bold text-slate-900">
                  {title}
                </h2>
              </div>

              {/* Desktop close button */}
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="hidden lg:flex p-2 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
                  aria-label="Close"
                >
                  <X size={24} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content - Scrollable area with proper spacing */}
        <div className="flex-1 overflow-y-auto bg-slate-50 lg:bg-white">
          <div className="p-4 lg:p-8 pb-safe">
            <div className="max-w-none">{children}</div>
          </div>
        </div>

        {/* Footer - Sticky at bottom with safe area */}
        {footer && (
          <div className="flex-shrink-0 bg-white border-t border-slate-200 p-4 lg:p-6 pb-safe">
            <div className="max-w-none">{footer}</div>
          </div>
        )}
      </div>

      {/* Animations */}
      <style jsx global>{`
        /* Mobile: slide up from bottom */
        @media (max-width: 1023px) {
          .fixed.inset-0.z-\\[60\\] > .absolute {
            animation: slideUpMobile 0.3s cubic-bezier(0.32, 0.72, 0, 1);
          }
        }
        
        /* Desktop: fade and scale */
        @media (min-width: 1024px) {
          .fixed.inset-0.z-\\[60\\] > .absolute {
            animation: fadeScaleDesktop 0.25s cubic-bezier(0.32, 0.72, 0, 1);
          }
        }

        @keyframes slideUpMobile {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }

        @keyframes fadeScaleDesktop {
          from {
            opacity: 0;
            transform: scale(0.96) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        /* Safe area support for devices with notches */
        .pb-safe {
          padding-bottom: max(1rem, env(safe-area-inset-bottom));
        }
      `}</style>
    </div>
  );
}
