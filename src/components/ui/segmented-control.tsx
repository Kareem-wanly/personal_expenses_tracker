"use client";

import { motion } from "motion/react";
import { useId } from "react";

import { cn } from "@/lib/utils";

type Option<T extends string> = { value: T; label: React.ReactNode };

/**
 * iOS segmented control: a sliding "thumb" marks the selected segment.
 * Built on native radio inputs, so it works inside plain <form>s, with the
 * keyboard (arrow keys) and with screen readers.
 */
export function SegmentedControl<T extends string>({
  name,
  options,
  value,
  onChange,
  label,
  className,
}: {
  /** Form field name; omit for a purely visual control. */
  name?: string;
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Accessible name for the group. */
  label: string;
  className?: string;
}) {
  const id = useId();
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn("flex rounded-[10px] bg-foreground/[0.06] p-0.5 dark:bg-white/[0.1]", className)}
    >
      {options.map((o) => {
        const checked = o.value === value;
        return (
          <label
            key={o.value}
            className={cn(
              "relative flex h-8 flex-1 cursor-pointer items-center justify-center rounded-[8px] px-2 text-[13px] font-semibold",
              "transition-colors duration-200 has-focus-visible:ring-2 has-focus-visible:ring-ring",
              checked ? "text-foreground" : "text-foreground/60",
            )}
          >
            <input
              type="radio"
              name={name ?? id}
              value={o.value}
              checked={checked}
              onChange={() => onChange(o.value)}
              className="sr-only"
            />
            {checked && (
              <motion.span
                layoutId={`${id}-thumb`}
                transition={{ type: "spring", stiffness: 500, damping: 38 }}
                className="absolute inset-0 rounded-[8px] bg-card shadow-[0_3px_8px_rgb(0_0_0/0.12),0_3px_1px_rgb(0_0_0/0.04)] dark:bg-[#636366]"
              />
            )}
            <span className="relative">{o.label}</span>
          </label>
        );
      })}
    </div>
  );
}
