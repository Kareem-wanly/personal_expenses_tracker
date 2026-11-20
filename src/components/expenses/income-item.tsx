"use client";

import { INCOME_SOURCE_META } from "@/lib/constants";
import { formatMoney } from "@/lib/money";
import type { IncomeRow } from "@/server/queries";

import { openIncomeForm } from "./expense-form-store";

/** One income row in an inset-grouped list; tap to edit. */
export function IncomeItem({ item, currency, meta }: { item: IncomeRow; currency: string; meta?: string }) {
  const source = INCOME_SOURCE_META[item.source];
  return (
    <button
      type="button"
      onClick={() => openIncomeForm(item)}
      className="flex w-full items-center gap-3 ps-4 text-start transition-colors duration-150 active:bg-foreground/[0.06] focus-visible:bg-foreground/[0.04] focus-visible:outline-none"
    >
      <span
        aria-hidden
        className="flex size-10 shrink-0 items-center justify-center rounded-[11px] text-lg"
        style={{ backgroundColor: `${source.color}22` }}
      >
        {source.icon}
      </span>
      <div className="list-row-body flex min-w-0 flex-1 items-center gap-3 py-3 pe-4">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[16px] font-medium">{item.note || source.label}</p>
          <p className="mt-0.5 truncate text-[13px] text-muted-foreground">
            {[item.note ? source.label : null, meta].filter(Boolean).join(" · ")}
          </p>
        </div>
        <span className="shrink-0 text-[16px] font-semibold text-[#248a3d] tabular dark:text-[#30d158]">
          +{formatMoney(item.amount, currency)}
        </span>
      </div>
    </button>
  );
}
