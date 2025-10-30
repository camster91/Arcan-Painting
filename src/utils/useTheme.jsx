import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [mounted, setMounted] = useState(false);

  // Initialize theme as light only
  useEffect(() => {
    setMounted(true);
  }, []);

  const value = {
    theme: "light",
    toggleTheme: () => {}, // No-op function for compatibility
    isDark: false,
    isLight: true,
    mounted,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

// Theme color utilities - only light mode colors
export const colors = {
  light: {
    // Primary colors
    primary: "#f59e0b", // amber-500
    primaryHover: "#d97706", // amber-600
    secondary: "#6b7280", // gray-500

    // Backgrounds
    bg: "#ffffff",
    bgSecondary: "#f8fafc", // slate-50
    bgTertiary: "#f1f5f9", // slate-100

    // Text
    text: "#1e293b", // slate-800
    textSecondary: "#64748b", // slate-500
    textMuted: "#94a3b8", // slate-400

    // Borders
    border: "#e2e8f0", // slate-200
    borderHover: "#cbd5e1", // slate-300

    // Cards
    card: "#ffffff",
    cardHover: "#f8fafc",

    // Accent colors
    accent: "#3b82f6", // blue-500
    success: "#10b981", // emerald-500
    warning: "#f59e0b", // amber-500
    error: "#ef4444", // red-500
  },
};

export function getThemeColors(isDark) {
  return colors.light; // Always return light colors
}
