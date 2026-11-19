"use client";

import { CategoryIcon } from "@/components/category-icon";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants";
import { formatMoney } from "@/lib/money";
import type { ExpenseRow } from "@/server/queries";

import { openExpenseForm } from "./expense-form-store";

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
      className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-start transition-colors hover:bg-muted/60 active:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <CategoryIcon icon={expense.categoryIcon} color={expense.categoryColor} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">
          {expense.note || expense.categoryName || "غير مصنّف"}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {[
            expense.note ? expense.categoryName ?? "غير مصنّف" : null,
            meta,
            PAYMENT_METHOD_LABELS[expense.paymentMethod],
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>
      <span className="shrink-0 font-semibold tabular" dir="ltr">
        -{formatMoney(expense.amount, currency)}
      </span>
    </button>
  );
}
