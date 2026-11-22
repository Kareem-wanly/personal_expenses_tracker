"use client";

import { motion } from "motion/react";

import { CategoryIcon } from "@/components/category-icon";
import { formatMoney, formatPercent } from "@/lib/money";
import type { CategoryTotal } from "@/server/queries";

const EASE = [0.32, 0.72, 0, 1] as const;

/** Thin progress line under a category that has its own monthly budget. */
function CategoryBudget({ spent, budget, currency }: { spent: number; budget: number; currency: string }) {
  const ratio = spent / budget;
  const tone = ratio >= 1 ? "var(--negative)" : ratio >= 0.8 ? "var(--warning)" : "var(--ink)";
  return (
    <div className="mt-1.5 flex items-center gap-2">
      <div
        className="h-1.5 flex-1 overflow-hidden rounded-full bg-foreground/[0.08]"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(Math.min(ratio, 1) * 100)}
        aria-label="نسبة استهلاك ميزانية التصنيف"
      >
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: tone }}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(ratio, 1) * 100}%` }}
          transition={{ duration: 0.7, ease: EASE }}
        />
      </div>
      <span className="shrink-0 text-[12px] text-muted-foreground tabular">
        {ratio >= 1
          ? `تجاوز بـ ${formatMoney(spent - budget, currency)}`
          : `من ${formatMoney(budget, currency)}`}
      </span>
    </div>
  );
}

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
          {
            categoryId: "rest",
            name: "أخرى",
            icon: "•",
            color: "var(--muted-foreground)",
            budget: null,
            total: restTotal,
            count: 0,
          },
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
            <div className="list-row-body min-w-0 flex-1 py-3">
              <div className="flex items-center gap-2">
                <span className="min-w-0 flex-1 truncate text-[15px]">{c.name}</span>
                <span className="text-[13px] text-muted-foreground tabular">
                  {formatPercent(total > 0 ? c.total / total : 0)}
                </span>
                <span className="w-24 shrink-0 text-end text-[15px] font-semibold tabular" dir="ltr">
                  {formatMoney(c.total, currency)}
                </span>
              </div>
              {c.budget ? <CategoryBudget spent={c.total} budget={c.budget} currency={currency} /> : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
