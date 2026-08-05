/**
 * Stores the user's light or dark theme preference and makes the theme controls
 * available throughout the application without passing props between pages.
 */
import { useEffect, useMemo, useState } from "react";
import { ThemeModeContext } from "./themeModeStore";

export function ThemeModeProvider({ children }) {
  // Initialize from storage so the chosen appearance survives refreshes.
  const [mode, setMode] = useState(
    () => localStorage.getItem("stayflow_theme") || "light",
  );

  useEffect(() => {
    // Update both persistent storage and the HTML theme attribute.
    localStorage.setItem("stayflow_theme", mode);
    document.documentElement.dataset.theme = mode;
  }, [mode]);

  // Share a stable theme value and one simple toggle function.
  const value = useMemo(
    () => ({
      mode,
      toggleMode: () =>
        setMode((current) => (current === "light" ? "dark" : "light")),
    }),
    [mode],
  );

  return (
    <ThemeModeContext.Provider value={value}>
      {children}
    </ThemeModeContext.Provider>
  );
}
