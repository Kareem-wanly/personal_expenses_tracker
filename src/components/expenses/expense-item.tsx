"use client";

import { CategoryIcon } from "@/components/category-icon";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants";
import { formatMoney } from "@/lib/money";
import type { ExpenseRow } from "@/server/queries";

import { openExpenseForm } from "./expense-form-store";

/** One row of an inset-grouped list (`.inset-list`). */
export function ExpenseItem({
  expense,
  currency,
  meta,
}: {
  expense: ExpenseRow;
  currency: string;
  meta?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => openExpenseForm(expense)}
      className="flex w-full items-center gap-3 ps-4 text-start transition-colors duration-150 active:bg-foreground/[0.06] focus-visible:bg-foreground/[0.04] focus-visible:outline-none"
    >
      <CategoryIcon
        icon={expense.categoryIcon}
        color={expense.categoryColor}
        className="size-10 rounded-[11px]"
      />
      <div className="list-row-body flex min-w-0 flex-1 items-center gap-3 py-3 pe-4">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[16px] font-medium">
            {expense.note || expense.categoryName || "غير مصنّف"}
          </p>
          <p className="mt-0.5 truncate text-[13px] text-muted-foreground">
            {[
              expense.note ? (expense.categoryName ?? "غير مصنّف") : null,
              meta,
              PAYMENT_METHOD_LABELS[expense.paymentMethod],
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        <span className="shrink-0 text-[16px] font-semibold tabular" dir="ltr">
          −{formatMoney(expense.amount, currency)}
        </span>
      </div>
    </button>
  );
}
