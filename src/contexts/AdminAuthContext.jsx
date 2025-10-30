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

export function AdminAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [authError, setAuthError] = useState(null);

  const checkAuth = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      setAuthError(null);

      // Add timeout to prevent hanging forever
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const res = await fetch("/api/local-auth/me", {
        credentials: "include",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        // Redirect to login with current page as callback
        const redirect = encodeURIComponent(window.location.pathname);
        window.location.href = `/account/signin?callbackUrl=${redirect}`;
        return;
      }

      const userData = await res.json();
      setUser(userData);
      setAuthChecked(true);
    } catch (error) {
      console.error("Auth check failed:", error);

      // Handle different error types
      if (error.name === "AbortError") {
        setAuthError(
          "Authentication check timed out. Please refresh the page.",
        );
        setAuthChecked(true); // Set to true to show error state instead of infinite loading
      } else {
        // Redirect to login on other errors
        window.location.href = "/account/signin";
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/local-auth/logout", {
        method: "POST",
        credentials: "include",
      });
      window.location.href = "/account/signin";
    } catch (error) {
      console.error("Logout failed:", error);
      // Force redirect even on error
      window.location.href = "/account/signin";
    }
  }, []);

  const refreshAuth = useCallback(() => {
    return checkAuth(false);
  }, [checkAuth]);

  // Initial auth check
  useEffect(() => {
    checkAuth(true);
  }, [checkAuth]);

  const value = {
    user,
    loading,
    authChecked,
    authError,
    logout,
    refreshAuth,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}
