"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  isDark: false,
  toggleTheme: () => {},
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  // Synchronize with document and local storage
  const applyThemeToDOM = useCallback((t: Theme) => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", t);
      if (t === "dark") {
        document.documentElement.classList.add("dark");
        document.body.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
        document.body.classList.remove("dark");
      }
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = (localStorage.getItem("cognalyze-theme") || localStorage.getItem("cognalyze_theme")) as Theme | null;
      // Default state should be OFF (light) initially per prompt
      if (stored === "dark") {
        setThemeState("dark");
        applyThemeToDOM("dark");
      } else {
        setThemeState("light");
        applyThemeToDOM("light");
      }
    } catch {
      setThemeState("light");
      applyThemeToDOM("light");
    }
  }, [applyThemeToDOM]);

  const setTheme = useCallback(
    (nextTheme: Theme) => {
      setThemeState(nextTheme);
      applyThemeToDOM(nextTheme);
      try {
        localStorage.setItem("cognalyze-theme", nextTheme);
        localStorage.setItem("cognalyze_theme", nextTheme);
      } catch (err) {
        console.warn("[Theme] Could not persist theme preference:", err);
      }
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("cognalyze-theme-change", { detail: { theme: nextTheme } })
        );
      }
    },
    [applyThemeToDOM]
  );

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark: theme === "dark",
        toggleTheme,
        setTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  return context;
}
