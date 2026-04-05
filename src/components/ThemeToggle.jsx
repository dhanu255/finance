import React from "react";
import { useAppState } from "../context/AppStateContext";
import { useAppDispatch } from "../context/AppStateContext";

export function ThemeToggle() {
  const { theme } = useAppState();
  const dispatch  = useAppDispatch();

  const isDark = theme === "dark";

  return (
    <button
      className="btn btn-secondary"
      onClick={() => dispatch({ type: "setTheme", payload: isDark ? "light" : "dark" })}
      type="button"
      aria-pressed={isDark}
      aria-label="Toggle color theme"
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? "☀️ Light mode" : "🌙 Dark mode"}
    </button>
  );
}
