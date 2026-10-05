"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";

const ModalContext = createContext();

export function ModalProvider({ children }) {
  const [modalCount, setModalCount] = useState(0);
  const isModalOpen = modalCount > 0;
  const openModal = useCallback(() => setModalCount((count) => count + 1), []);
  const closeModal = useCallback(() => setModalCount((count) => Math.max(0, count - 1)), []);

  useEffect(() => {
    if (!isModalOpen) return;
    const { overflow, height } = document.body.style;
    document.body.style.overflow = "hidden";
    document.body.style.height = "100vh";
    return () => {
      document.body.style.overflow = overflow;
      document.body.style.height = height;
    };
  }, [isModalOpen]);

  const value = useMemo(() => ({ isModalOpen, modalCount, openModal, closeModal }),
    [isModalOpen, modalCount, openModal, closeModal]);
  return <ModalContext.Provider value={value}>{children}</ModalContext.Provider>;
}

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) throw new Error("useModal must be used within a ModalProvider");
  return context;
}
