"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

const AdminAuthContext = createContext();

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within AdminAuthProvider");
  }
  return context;
}

function goToLogin() {
  if (typeof window === "undefined") return;
  const redirect = encodeURIComponent(window.location.pathname);
  window.location.replace(`/account/signin?callbackUrl=${redirect}`);
}

export function AdminAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [authError, setAuthError] = useState(null);

  const checkAuth = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      setAuthError(null);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        goToLogin();
      }, 5000);

      const res = await fetch("/api/local-auth/me", {
        credentials: "include",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        goToLogin();
        return;
      }

      const userData = await res.json();
      setUser(userData);
      setAuthChecked(true);
    } catch (error) {
      if (error.name !== "AbortError") {
        goToLogin();
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/local-auth/logout", { method: "POST", credentials: "include" });
    } catch {}
    window.location.replace("/account/signin");
  }, []);

  const refreshAuth = useCallback(() => checkAuth(false), [checkAuth]);

  useEffect(() => {
    checkAuth(true);
  }, [checkAuth]);

  return (
    <AdminAuthContext.Provider value={{ user, loading, authChecked, authError, logout, refreshAuth }}>
      {children}
    </AdminAuthContext.Provider>
  );
}
