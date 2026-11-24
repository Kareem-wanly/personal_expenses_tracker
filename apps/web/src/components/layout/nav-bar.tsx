"use client";

import { motion, useScroll, useTransform } from "motion/react";

import { TABS } from "@/lib/tabs";

import { useTabNav } from "./tab-nav";

/**
 * Compact title bar that fades in once the page's large title scrolls
 * away, like a collapsing iOS navigation bar. Decorative: the page's own
 * <h1> stays the accessible title.
 */
export function NavBar() {
  const { current } = useTabNav();
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [28, 60], [0, 1]);
  const y = useTransform(scrollY, [28, 60], [6, 0]);

  if (current < 0) return null;

  return (
    <motion.div
      aria-hidden
      style={{ opacity, viewTransitionName: "nav-bar" }}
      className="glass-bar pointer-events-none fixed inset-x-0 top-0 z-30 pt-safe"
    >
      <div className="mx-auto flex h-11 max-w-2xl items-center justify-center">
        <motion.span style={{ y }} className="text-[17px] font-semibold">
          {TABS[current].label}
        </motion.span>
      </div>
    </motion.div>
  );
}
