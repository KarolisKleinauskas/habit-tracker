"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useLayoutEffect, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";
import {
  THEME_STORAGE_KEY,
  applyTheme,
  readThemePreference,
  type ThemePreference,
} from "@/lib/theme";

const OPTIONS: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Šviesi", icon: Sun },
  { value: "dark", label: "Tamsi", icon: Moon },
  { value: "system", label: "Sistemos", icon: Monitor },
];

const THEME_CHANGE_EVENT = "themechange";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(THEME_CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(THEME_CHANGE_EVENT, onChange);
  };
}

export function ThemeToggle() {
  // Server snapshot is "system"; React re-renders with the stored value after hydration.
  const preference = useSyncExternalStore(subscribe, readThemePreference, () => "system");

  // Re-apply after a dev Strict Mode remount resets <html> attributes; no-op in production.
  useLayoutEffect(() => {
    applyTheme(readThemePreference());
  }, []);

  // Follow OS changes while "system" is selected.
  useLayoutEffect(() => {
    if (preference !== "system") return;
    const media = matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [preference]);

  function select(value: ThemePreference) {
    try {
      if (value === "system") localStorage.removeItem(THEME_STORAGE_KEY);
      else localStorage.setItem(THEME_STORAGE_KEY, value);
    } catch {
      // Storage unavailable (private mode); the choice applies to this page only.
    }
    applyTheme(value);
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  }

  return (
    <div role="radiogroup" aria-label="Tema" className="grid grid-cols-3 gap-2">
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const checked = preference === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={checked}
            onClick={() => select(value)}
            className={cn(
              "flex h-16 flex-col items-center justify-center gap-1 rounded-lg border text-sm transition-colors",
              checked
                ? "border-foreground bg-accent font-medium"
                : "text-muted-foreground hover:bg-accent",
            )}
          >
            <Icon className="size-5" aria-hidden />
            {label}
          </button>
        );
      })}
    </div>
  );
}
