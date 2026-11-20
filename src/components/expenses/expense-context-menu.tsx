"use client";

import { CopyPlusIcon, type LucideIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useTransition } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";

import { toISODate } from "@/lib/dates";
import { fromMinor } from "@/lib/money";
import { cn } from "@/lib/utils";
import { deleteExpense, saveExpense } from "@/server/actions";
import type { ExpenseRow } from "@/server/queries";

import { ExpenseRowContent } from "./expense-item";
import { openExpenseForm } from "./expense-form-store";
import { type ExpenseMenuState, closeExpenseMenu, useExpenseMenu } from "./expense-menu-store";

const MARGIN = 16;
const GAP = 10;
const MENU_WIDTH = 250;
const ITEM_HEIGHT = 46;
const LIFT = 1.03;
const SPRING = { type: "spring", stiffness: 420, damping: 32 } as const;

/** Save a copy of `e` through the same validated action the form uses. */
function saveCopy(e: ExpenseRow, date: string) {
  const fd = new FormData();
  fd.set("amount", String(fromMinor(e.amount)));
  fd.set("categoryId", e.categoryId ?? "");
  fd.set("date", date);
  fd.set("note", e.note ?? "");
  fd.set("paymentMethod", e.paymentMethod);
  return saveExpense({ ok: false }, fd);
}

/**
 * iOS-style context menu for an expense row: the row lifts in place over
 * a blurred backdrop and a glass menu opens beside it.
 */
export function ExpenseContextMenu() {
  const menu = useExpenseMenu();

  // Escape closes; the backdrop blocks scrolling underneath.
  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeExpenseMenu();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menu]);

  if (typeof document === "undefined") return null;
  return createPortal(
    <AnimatePresence>{menu && <MenuOverlay key={menu.expense.id} menu={menu} />}</AnimatePresence>,
    document.body,
  );
}

function MenuOverlay({ menu }: { menu: NonNullable<ExpenseMenuState> }) {
  const { expense, currency, meta, rect } = menu;
  const [, startTransition] = useTransition();
  const firstItem = useRef<HTMLButtonElement>(null);

  useEffect(() => firstItem.current?.focus({ preventScroll: true }), []);

  // Layout: menu under the row; if it doesn't fit, above it; if neither
  // fits, slide the row up so both do (what iOS does near the bottom).
  const vh = window.innerHeight;
  const vw = window.innerWidth;
  const menuHeight = ITEM_HEIGHT * 3;
  let rowTop = rect.top;
  let menuTop: number;
  if (rect.top + rect.height + GAP + menuHeight <= vh - MARGIN) {
    menuTop = rect.top + rect.height + GAP;
  } else if (rect.top - GAP - menuHeight >= MARGIN) {
    menuTop = rect.top - GAP - menuHeight;
  } else {
    rowTop = Math.max(MARGIN, vh - MARGIN - menuHeight - GAP - rect.height);
    menuTop = rowTop + rect.height + GAP;
  }
  const below = menuTop > rowTop;
  const rtl = document.documentElement.dir === "rtl";
  // Align the menu with the row's leading edge (right in RTL).
  const menuLeft = rtl
    ? Math.max(MARGIN, rect.left + rect.width - MENU_WIDTH)
    : Math.min(vw - MARGIN - MENU_WIDTH, rect.left);

  function run(action: () => void) {
    closeExpenseMenu();
    action();
  }

  const items: { label: string; icon: LucideIcon; destructive?: boolean; onSelect: () => void }[] = [
    {
      label: "تعديل",
      icon: PencilIcon,
      onSelect: () => run(() => openExpenseForm(expense)),
    },
    {
      label: "تكرار اليوم",
      icon: CopyPlusIcon,
      onSelect: () =>
        run(() =>
          startTransition(async () => {
            const res = await saveCopy(expense, toISODate(new Date()));
            if (res.ok) toast.success("تمت إضافة نسخة بتاريخ اليوم");
            else toast.error(res.message ?? "تعذّر التكرار");
          }),
        ),
    },
    {
      label: "حذف",
      icon: Trash2Icon,
      destructive: true,
      onSelect: () =>
        run(() =>
          startTransition(async () => {
            const res = await deleteExpense(expense.id);
            navigator.vibrate?.(10);
            // Delete straight away, with an Undo, like Mail on iOS.
            toast.success(res.message, {
              duration: 6000,
              action: {
                label: "تراجع",
                onClick: () =>
                  startTransition(async () => {
                    const back = await saveCopy(expense, expense.date);
                    if (back.ok) toast.success("تمت استعادة المصروف");
                    else toast.error(back.message ?? "تعذّرت الاستعادة");
                  }),
              },
            });
          }),
        ),
    },
  ];

  return (
    <motion.div
      className="fixed inset-0 z-[60] touch-none select-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Backdrop: dims and blurs everything except the lifted row. */}
      <div
        className="absolute inset-0 bg-black/25 backdrop-blur-md dark:bg-black/45"
        onPointerDown={closeExpenseMenu}
        aria-hidden
      />

      {/* The lifted row (a visual copy; the real one stays in the list). */}
      <motion.div
        aria-hidden
        className="absolute flex items-center gap-3 overflow-hidden rounded-[16px] bg-card ps-4 shadow-[0_20px_50px_-12px_rgb(0_0_0/0.35)]"
        style={{ left: rect.left, width: rect.width, height: rect.height }}
        initial={{ top: rect.top, scale: 1 }}
        animate={{ top: rowTop, scale: LIFT }}
        exit={{ top: rect.top, scale: 1, opacity: 0 }}
        transition={SPRING}
      >
        <ExpenseRowContent expense={expense} currency={currency} meta={meta} />
      </motion.div>

      <motion.div
        role="menu"
        aria-label="خيارات المصروف"
        className="glass absolute overflow-hidden rounded-[14px]"
        style={{
          top: menuTop,
          left: menuLeft,
          width: MENU_WIDTH,
          transformOrigin: `${rtl ? "right" : "left"} ${below ? "top" : "bottom"}`,
        }}
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={SPRING}
      >
        {items.map((item, i) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              ref={i === 0 ? firstItem : undefined}
              type="button"
              role="menuitem"
              onClick={item.onSelect}
              className={cn(
                "flex w-full items-center justify-between px-4 text-[16px] outline-none transition-colors",
                "active:bg-foreground/[0.08] focus-visible:bg-foreground/[0.07]",
                item.destructive ? "text-destructive" : "text-foreground",
                i > 0 && "border-t border-separator",
              )}
              style={{ height: ITEM_HEIGHT }}
            >
              {item.label}
              <Icon className="size-[19px]" strokeWidth={2} />
            </button>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
