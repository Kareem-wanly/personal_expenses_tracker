"use client";

import { motion } from "motion/react";

const EASE = [0.32, 0.72, 0, 1] as const;

/**
 * Fades and lifts content in on mount. `index` staggers siblings so a
 * screen assembles top-to-bottom instead of popping in all at once.
 */
export function Reveal({
  children,
  index = 0,
  className,
  as = "div",
}: {
  children: React.ReactNode;
  index?: number;
  className?: string;
  as?: "div" | "section";
}) {
  const Component = as === "section" ? motion.section : motion.div;
  return (
    <Component
      className={className}
      initial={{ opacity: 0, y: 14, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.55, ease: EASE, delay: 0.04 + index * 0.05 }}
    >
      {children}
    </Component>
  );
}
