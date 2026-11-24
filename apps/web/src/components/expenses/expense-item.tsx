"use client";

import { useRef } from "react";

import { CategoryIcon } from "@/components/category-icon";
import { PAYMENT_METHOD_LABELS } from "@masrufi/core/constants";
import { formatMoney } from "@masrufi/core/money";
import type { ExpenseRow } from "@/server/queries";

import { openExpenseForm } from "./expense-form-store";
import { openExpenseMenu } from "./expense-menu-store";

/** Hold this long (ms) to open the context menu, like iOS. */
const HOLD_MS = 450;
/** Moving further than this (px) means scroll/swipe, not a hold. */
const MOVE_TOLERANCE = 8;

/** The row's content, shared by the list and the lifted menu preview. */
export function ExpenseRowContent({
  expense,
  currency,
  meta,
}: {
  expense: ExpenseRow;
  currency: string;
  meta?: string;
}) {
  return (
    <>
      <CategoryIcon icon={expense.categoryIcon} color={expense.categoryColor} className="size-10 rounded-[11px]" />
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
              expense.originalCurrency && expense.originalAmount !== null
                ? formatMoney(expense.originalAmount, expense.originalCurrency)
                : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        <span className="shrink-0 text-[16px] font-semibold tabular" dir="ltr">
          −{formatMoney(expense.amount, currency)}
        </span>
      </div>
    </>
  );
}

/**
 * One row of an inset-grouped list (`.inset-list`). Tap to edit; press and
 * hold (or right-click) for the context menu.
 */
export function ExpenseItem({
  expense,
  currency,
  meta,
}: {
  expense: ExpenseRow;
  currency: string;
  meta?: string;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const hold = useRef<{ timer: ReturnType<typeof setTimeout>; x: number; y: number } | null>(null);
  // The click that follows a long press must not also open the editor.
  const suppressClick = useRef(false);

  function openMenu() {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    navigator.vibrate?.(15);
    suppressClick.current = true;
    openExpenseMenu({
      expense,
      currency,
      meta,
      rect: { top: r.top, left: r.left, width: r.width, height: r.height },
      origin: el,
    });
  }

  function cancelHold() {
    if (hold.current) clearTimeout(hold.current.timer);
    hold.current = null;
  }

  return (
    <button
      ref={ref}
      type="button"
      onClick={() => {
        if (suppressClick.current) {
          suppressClick.current = false;
          return;
        }
        openExpenseForm(expense);
      }}
      onPointerDown={(e) => {
        suppressClick.current = false;
        cancelHold();
        if (e.pointerType === "mouse") return; // mouse users right-click
        hold.current = { timer: setTimeout(openMenu, HOLD_MS), x: e.clientX, y: e.clientY };
      }}
      onPointerMove={(e) => {
        const h = hold.current;
        if (h && Math.hypot(e.clientX - h.x, e.clientY - h.y) > MOVE_TOLERANCE) cancelHold();
      }}
      onPointerUp={cancelHold}
      onPointerCancel={cancelHold}
      onContextMenu={(e) => {
        // Android fires this on long-press too; desktop on right-click.
        // Whichever comes first (this or our timer) opens it, once.
        e.preventDefault();
        cancelHold();
        if (!suppressClick.current) openMenu();
      }}
      className="flex w-full select-none items-center gap-3 ps-4 text-start transition-colors duration-150 [-webkit-touch-callout:none] active:bg-foreground/[0.06] focus-visible:bg-foreground/[0.04] focus-visible:outline-none"
    >
      <ExpenseRowContent expense={expense} currency={currency} meta={meta} />
    </button>
  );
}
