"use client";

import { motion } from "motion/react";

import { formatPercent } from "@/lib/money";

/**
 * Activity-ring style progress for the monthly budget. Past 100% a second
 * lap overlaps the first, like closing a ring twice.
 */
export function BudgetRing({
  ratio,
  size = 84,
  stroke = 11,
}: {
  ratio: number;
  size?: number;
  stroke?: number;
}) {
  const r = (size - stroke) / 2;
  const first = Math.min(ratio, 1);
  const overflow = Math.min(Math.max(ratio - 1, 0), 1);
  const tone = ratio > 1 ? "#ff6b5e" : ratio >= 0.8 ? "#ffd60a" : "#ffffff";

  const ring = (progress: number, delay: number, opacity = 1) => (
    <motion.circle
      cx={size / 2}
      cy={size / 2}
      r={r}
      fill="none"
      stroke={tone}
      strokeOpacity={opacity}
      strokeWidth={stroke}
      strokeLinecap="round"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: progress }}
      transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay }}
    />
  );

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`استهلاك الميزانية ${formatPercent(ratio)}`}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="white"
          strokeOpacity={0.2}
          strokeWidth={stroke}
        />
        {first > 0 && ring(first, 0.15)}
        {overflow > 0 && ring(overflow, 1.1, 0.9)}
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[15px] font-bold tabular">
        {Math.round(ratio * 100)}%
      </span>
    </div>
  );
}
