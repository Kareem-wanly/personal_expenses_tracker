"use client";

import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "light", label: "فاتح", icon: SunIcon },
  { value: "dark", label: "داكن", icon: MoonIcon },
  { value: "system", label: "تلقائي", icon: MonitorIcon },
] as const;

const noop = () => () => {};

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  // Theme is only known on the client; avoid a hydration mismatch.
  const mounted = useSyncExternalStore(noop, () => true, () => false);

  return (
    <div role="radiogroup" aria-label="المظهر" className="grid grid-cols-3 gap-2 rounded-xl bg-muted p-1">
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const active = mounted && theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(value)}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium text-muted-foreground transition-colors",
              active && "bg-background text-foreground shadow-sm",
            )}
          >
            <Icon className="size-4" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
