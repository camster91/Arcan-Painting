import { createContext, useContext, useEffect, useRef, useState } from "react";

// The default context matches the value that ThemeProvider publishes. The
// hook used to throw when called outside a provider; that crashed SSR for
// any component that hit useTheme() in a loader (e.g. a route that
// renders <Header /> at the top of its tree). Because the theme system
// is light-only (toggleTheme is a no-op, isDark is always false), the
// "default" and "inside provider" values are identical — the only
// difference is `mounted`, which is used to skip hydration-mismatched
// animations on the first client render.
//
// `_isDefault` is an internal sentinel used by useTheme() to detect the
// "no provider in scope" case at dev time and warn. Provider values do
// NOT include it; the default value does. Consumers should ignore it.
const DEFAULT_THEME_VALUE = Object.freeze({
  theme: "light",
  toggleTheme: () => {},
  isDark: false,
  isLight: true,
  mounted: false,
  _isDefault: true,
});

const ThemeContext = createContext(DEFAULT_THEME_VALUE);

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
  const ctx = useContext(ThemeContext);
  // Detect the "no ThemeProvider in scope" case. useContext returns the
  // context's defaultValue (the frozen DEFAULT_THEME_VALUE) when no
  // provider is above this component in the tree. Provider values never
  // carry the `_isDefault` sentinel, so this comparison is reliable.
  const isDefault = ctx == null || ctx._isDefault === true;

  // Warn exactly once per component instance (i.e. per call site that
  // invokes useTheme), not once per render — otherwise a frequently
  // re-rendering component floods the console with the same warning.
  // useRef gives us a stable slot that persists across renders for the
  // lifetime of this component instance.
  const hasWarnedRef = useRef(false);
  if (
    isDefault &&
    !hasWarnedRef.current &&
    typeof process !== "undefined" &&
    process.env.NODE_ENV !== "production"
  ) {
    hasWarnedRef.current = true;
    // Defer the actual warn to a microtask so it isn't tied to the
    // current render's frame, and so a burst of mounts (e.g. during
    // SSR streaming) doesn't synchronously flood the console.
    Promise.resolve().then(() => {
      // eslint-disable-next-line no-console
      console.warn(
        "[useTheme] called outside <ThemeProvider> — returning default. " +
          "This component is rendering without a theme provider in scope; " +
          "check the component tree. Default value has `mounted: false`, " +
          "which can cause hydration-skip logic to never fire."
      );
    });
  }

  // Return the default value when no provider is in scope. This is safe
  // because the theme system is light-only and the no-provider case
  // matches the post-mount provider case. The only visible difference
  // is the `mounted` flag, which downstream code uses to skip hydration
  // mismatches; consumers that need that should still wrap with a
  // provider, but a missing provider is no longer fatal.
  return ctx && !isDefault ? ctx : DEFAULT_THEME_VALUE;
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
