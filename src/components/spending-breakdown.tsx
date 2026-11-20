"use client";

import { motion } from "motion/react";

import { CategoryIcon } from "@/components/category-icon";
import { formatMoney, formatPercent } from "@/lib/money";
import type { CategoryTotal } from "@/server/queries";

const EASE = [0.32, 0.72, 0, 1] as const;

/**
 * "Storage bar" breakdown: one segmented bar for the whole month, then a
 * ranked list. The bar shows proportions at a glance; the list gives the
 * exact figures.
 */
export function SpendingBreakdown({
  items,
  total,
  currency,
  limit = 4,
  bar = true,
}: {
  items: CategoryTotal[];
  total: number;
  currency: string;
  limit?: number;
  /** Hide the segmented bar when a chart above already shows proportions. */
  bar?: boolean;
}) {
  const shown = items.slice(0, limit);
  const rest = items.slice(limit);
  const restTotal = rest.reduce((a, c) => a + c.total, 0);
  const segments =
    restTotal > 0
      ? [
          ...shown,
          { categoryId: "rest", name: "أخرى", icon: "•", color: "#8e8e93", total: restTotal, count: 0 },
        ]
      : shown;

  return (
    <div className="surface p-4">
      {bar && (
        <div
          className="flex h-3.5 gap-[3px] overflow-hidden rounded-full"
          role="img"
          aria-label="توزيع المصاريف حسب التصنيف"
        >
          {segments.map((c, i) => (
            <motion.span
              key={c.categoryId ?? "none"}
              className="h-full min-w-1.5 origin-right first:rounded-s-full last:rounded-e-full"
              style={{ backgroundColor: c.color, flexGrow: total > 0 ? c.total / total : 0 }}
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ duration: 0.7, ease: EASE, delay: 0.15 + i * 0.06 }}
            />
          ))}
        </div>
      )}

      <ul className={bar ? "inset-list mt-3" : "inset-list -my-1"}>
        {shown.map((c) => (
          <li key={c.categoryId ?? "none"} className="flex items-center gap-3">
            <CategoryIcon icon={c.icon} color={c.color} className="size-8 rounded-[9px] text-[15px]" />
            <div className="list-row-body flex min-w-0 flex-1 items-center gap-2 py-3">
              <span className="min-w-0 flex-1 truncate text-[15px]">{c.name}</span>
              <span className="text-[13px] text-muted-foreground tabular">
                {formatPercent(total > 0 ? c.total / total : 0)}
              </span>
              <span className="w-24 shrink-0 text-end text-[15px] font-semibold tabular" dir="ltr">
                {formatMoney(c.total, currency)}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
