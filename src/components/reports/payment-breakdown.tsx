"use client";

import { motion } from "motion/react";

import type { PaymentMethod } from "@/db/schema";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants";
import { formatMoney, formatPercent } from "@/lib/money";

/** Fixed slot per method, so a method keeps its colour in every month. */
const SLOT: Record<PaymentMethod, string> = {
  cash: "var(--series-1)",
  card: "var(--series-2)",
  transfer: "var(--series-3)",
};

const EASE = [0.32, 0.72, 0, 1] as const;

/** Parts-of-whole as one segmented bar, labelled by the rows below it. */
export function PaymentBreakdown({
  items,
  total,
  currency,
}: {
  items: { method: PaymentMethod; total: number }[];
  total: number;
  currency: string;
}) {
  const sorted = [...items].sort((a, b) => b.total - a.total);
  return (
    <div className="surface p-4">
      <div
        className="flex h-3.5 gap-[2px] overflow-hidden rounded-full"
        role="img"
        aria-label="توزيع المصاريف حسب طريقة الدفع"
      >
        {sorted.map((m, i) => (
          <motion.span
            key={m.method}
            className="h-full min-w-1.5 origin-right first:rounded-s-full last:rounded-e-full"
            style={{ backgroundColor: SLOT[m.method], flexGrow: total > 0 ? m.total / total : 0 }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.1 + i * 0.06 }}
          />
        ))}
      </div>
      <ul className="inset-list mt-3">
        {sorted.map((m) => (
          <li key={m.method} className="flex items-center gap-3">
            <span
              aria-hidden
              className="size-3 shrink-0 rounded-full"
              style={{ backgroundColor: SLOT[m.method] }}
            />
            <div className="list-row-body flex min-w-0 flex-1 items-center gap-2 py-3">
              <span className="flex-1 text-[15px]">{PAYMENT_METHOD_LABELS[m.method]}</span>
              <span className="text-[13px] text-muted-foreground tabular">
                {formatPercent(total > 0 ? m.total / total : 0)}
              </span>
              <span className="w-24 shrink-0 text-end text-[15px] font-semibold tabular" dir="ltr">
                {formatMoney(m.total, currency)}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
