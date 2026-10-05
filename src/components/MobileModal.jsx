"use client";

import { useEffect, useRef, useId } from "react";
import { X } from "lucide-react";
import { containDialogFocus } from "@/utils/dialogFocus";
import { useModal } from "@/contexts/ModalContext";

export default function MobileModal({
  isOpen, onClose, title, children, footer, className = "", showCloseButton = true,
}) {
  const { openModal, closeModal } = useModal();
  const dialogRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) return;
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;
    openModal();
    dialog.showModal();
    return () => {
      dialog.close();
      closeModal();
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [isOpen, openModal, closeModal]);

  if (!isOpen) return null;

  return (
    <dialog ref={dialogRef} tabIndex={-1} onKeyDown={containDialogFocus} aria-labelledby={titleId} aria-modal="true"
      onCancel={(event) => { event.preventDefault(); event.stopPropagation(); onClose(); }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
      className={`fixed inset-0 m-auto w-full h-[100dvh] max-w-none max-h-none p-0 bg-transparent
        lg:w-[calc(100%_-_2rem)] lg:h-auto lg:max-w-4xl lg:max-h-[90dvh] backdrop:bg-black/50 ${className}`}>
      <div className="h-full lg:max-h-[90dvh] bg-white lg:rounded-xl flex flex-col overflow-hidden">
        <header className="shrink-0 flex items-start justify-between gap-4 border-b border-slate-200 px-4 py-4 lg:px-6">
          <h2 id={titleId} className="min-w-0 text-xl lg:text-2xl font-bold text-slate-900 break-words">{title}</h2>
          {showCloseButton && (
            <button type="button" onClick={onClose} aria-label="Close"
              className="shrink-0 min-h-11 min-w-11 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-amber-600">
              <X size={24} aria-hidden="true" />
            </button>
          )}
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 lg:bg-white p-4 lg:p-8">
          {children}
        </div>
        {footer && (
          <footer className="shrink-0 border-t border-slate-200 bg-white p-4 lg:p-6"
            style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}>{footer}</footer>
        )}
      </div>
    </dialog>
  );
}
