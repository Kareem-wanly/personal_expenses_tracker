"use client";

import {
  CalendarDaysIcon,
  CheckIcon,
  CreditCardIcon,
  Loader2Icon,
  type LucideIcon,
  PencilLineIcon,
  Trash2Icon,
} from "lucide-react";
import { AnimatePresence, motion, useAnimate } from "motion/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useActionState, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants";
import { addDays, toISODate } from "@/lib/dates";
import { fromMinor } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { ActionState } from "@/lib/validations";
import type { PaymentMethod } from "@/db/schema";
import { deleteExpense, saveExpense } from "@/server/actions";
import type { CategoryOption } from "@/server/queries";

import {
  closeExpenseForm,
  openExpenseForm,
  useExpenseFormState,
} from "./expense-form-store";

type Props = { categories: CategoryOption[]; currency: string };

const SPRING = { type: "spring", stiffness: 520, damping: 30 } as const;

export function ExpenseFormDrawer({ categories, currency }: Props) {
  const { open, expense, nonce } = useExpenseFormState();
  const searchParams = useSearchParams();
  const router = useRouter();

  // PWA shortcut: /?add=1 opens the form directly.
  useEffect(() => {
    if (searchParams.get("add") === "1") {
      openExpenseForm();
      router.replace("/", { scroll: false });
    }
  }, [searchParams, router]);

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => (next ? undefined : closeExpenseForm())}
      showSwipeHandle
    >
      <DrawerContent
        // Dark sheets sit on an elevated grey, with cards one step lighter.
        className="mx-auto max-w-2xl border-t-0 bg-background data-[swipe-direction=down]:rounded-t-[28px] dark:bg-[#1c1c1e] dark:[--card:#2c2c2e]"
        // New expense: jump straight to the amount so the keypad opens.
        initialFocus={expense ? undefined : () => document.getElementById("amount")}
      >
        {/* Remount on every open so the form starts fresh. */}
        <ExpenseForm key={nonce} categories={categories} currency={currency} expense={expense} />
      </DrawerContent>
    </Drawer>
  );
}

type DateMode = "today" | "yesterday" | "other";

function ExpenseForm({
  categories,
  currency,
  expense,
}: Props & { expense: ReturnType<typeof useExpenseFormState>["expense"] }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(saveExpense, {
    ok: false,
  });
  const today = toISODate(new Date());
  const yesterday = addDays(today, -1);

  const [amount, setAmount] = useState(expense ? String(fromMinor(expense.amount)) : "");
  const [categoryId, setCategoryId] = useState(
    (expense ? expense.categoryId : categories[0]?.id) ?? "",
  );
  const [date, setDate] = useState(expense?.date ?? today);
  const [dateMode, setDateMode] = useState<DateMode>(
    date === today ? "today" : date === yesterday ? "yesterday" : "other",
  );
  const [method, setMethod] = useState<PaymentMethod>(expense?.paymentMethod ?? "cash");
  const [amountScope, animateAmount] = useAnimate<HTMLDivElement>();

  useEffect(() => {
    if (state.ok) {
      navigator.vibrate?.(10);
      toast.success(state.message);
      closeExpenseForm();
    } else if (state.message) {
      toast.error(state.message);
      if (state.fieldErrors?.amount && amountScope.current) {
        animateAmount(amountScope.current, { x: [0, -12, 10, -6, 4, 0] }, { duration: 0.42 });
      }
    }
  }, [state, amountScope, animateAmount]);

  const errors = state.fieldErrors ?? {};
  // Shrink the figure as it grows, like the iOS calculator.
  const amountSize = amount.length <= 5 ? 60 : amount.length <= 8 ? 48 : 38;

  function pickDate(mode: DateMode) {
    setDateMode(mode);
    if (mode === "today") setDate(today);
    if (mode === "yesterday") setDate(yesterday);
  }

  return (
    <form action={formAction} className="flex min-h-0 flex-1 flex-col">
      {expense && <input type="hidden" name="id" value={expense.id} />}
      <input type="hidden" name="date" value={date} />

      {/* Sheet navigation bar */}
      <div className="relative flex h-11 shrink-0 items-center justify-between px-4">
        <button
          type="button"
          onClick={closeExpenseForm}
          className="text-[17px] text-primary active:opacity-50"
        >
          إلغاء
        </button>
        <DrawerTitle className="pointer-events-none absolute inset-x-0 text-center text-[17px] font-semibold">
          {expense ? "تعديل المصروف" : "مصروف جديد"}
        </DrawerTitle>
        <DrawerDescription className="sr-only">أدخل المبلغ واختر التصنيف ثم احفظ</DrawerDescription>
        {expense ? <DeleteExpenseButton id={expense.id} /> : <span className="w-8" />}
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 pb-4">
        {/* Amount */}
        <div ref={amountScope} className="flex flex-col items-center pt-3">
          <label htmlFor="amount" className="sr-only">
            المبلغ
          </label>
          <input
            id="amount"
            name="amount"
            inputMode="decimal"
            autoComplete="off"
            required
            dir="ltr"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            aria-invalid={!!errors.amount}
            style={{ fontSize: amountSize }}
            className="h-[72px] w-full bg-transparent text-center font-bold leading-none tracking-tight caret-primary tabular outline-none transition-[font-size] duration-200 placeholder:text-foreground/20"
          />
          <span className="mt-1 rounded-full bg-foreground/[0.06] px-3 py-1 text-[13px] font-semibold text-muted-foreground dark:bg-white/10">
            {currency}
          </span>
          <AnimatePresence>
            {errors.amount && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-2 text-[13px] font-medium text-destructive"
              >
                {errors.amount[0]}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Category: app-icon grid */}
        <fieldset>
          <legend className="mb-2 px-1 text-[13px] font-medium text-muted-foreground">التصنيف</legend>
          <div className="surface grid grid-cols-4 gap-x-2 gap-y-4 p-4 sm:grid-cols-6">
            {categories.map((c) => {
              const selected = c.id === categoryId;
              return (
                <label
                  key={c.id}
                  className="group flex cursor-pointer flex-col items-center gap-1.5 outline-none"
                >
                  <input
                    type="radio"
                    name="categoryId"
                    value={c.id}
                    checked={selected}
                    onChange={() => setCategoryId(c.id)}
                    className="peer sr-only"
                  />
                  <motion.span
                    animate={{ scale: selected ? 1.06 : 1 }}
                    whileTap={{ scale: 0.88 }}
                    transition={SPRING}
                    className="relative flex size-14 items-center justify-center rounded-[16px] text-[26px] transition-[background-color,box-shadow] duration-200 group-has-focus-visible:ring-2 group-has-focus-visible:ring-ring"
                    style={{
                      backgroundColor: selected ? c.color : `${c.color}1f`,
                      boxShadow: selected ? `0 10px 20px -8px ${c.color}` : "none",
                    }}
                  >
                    <span aria-hidden>{c.icon}</span>
                    <AnimatePresence>
                      {selected && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          transition={SPRING}
                          className="absolute -end-1 -top-1 flex size-5 items-center justify-center rounded-full bg-card text-primary shadow ring-2 ring-card"
                        >
                          <CheckIcon className="size-3" strokeWidth={3.5} />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.span>
                  <span
                    className={cn(
                      "line-clamp-1 text-[11.5px] transition-colors",
                      selected ? "font-semibold text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {c.name}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        {/* Details: inset-grouped rows */}
        <div className="surface inset-list overflow-hidden">
          <Row icon={CalendarDaysIcon} tint="#ff3b30" label="التاريخ">
            <SegmentedControl
              label="التاريخ"
              value={dateMode}
              onChange={pickDate}
              className="w-48"
              options={[
                { value: "today", label: "اليوم" },
                { value: "yesterday", label: "أمس" },
                { value: "other", label: "آخر" },
              ]}
            />
          </Row>
          <AnimatePresence initial={false}>
            {dateMode === "other" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-3 ps-4">
                  <span className="size-7 shrink-0" />
                  <div className="list-row-body flex flex-1 items-center justify-between gap-3 py-2 pe-4">
                    <label htmlFor="date-picker" className="text-[16px]">
                      اختر اليوم
                    </label>
                    <input
                      id="date-picker"
                      type="date"
                      required
                      value={date}
                      max={addDays(today, 365)}
                      onChange={(e) => setDate(e.target.value)}
                      className="h-9 rounded-[8px] bg-foreground/[0.06] px-2 text-[15px] font-medium text-primary outline-none dark:bg-white/10"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <Row icon={CreditCardIcon} tint="#34c759" label="الدفع">
            <SegmentedControl
              name="paymentMethod"
              label="طريقة الدفع"
              value={method}
              onChange={setMethod}
              className="w-48"
              options={Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => ({
                value: value as PaymentMethod,
                label,
              }))}
            />
          </Row>
          <Row icon={PencilLineIcon} tint="#8e8e93">
            <label htmlFor="note" className="sr-only">
              ملاحظة
            </label>
            <input
              id="note"
              name="note"
              maxLength={120}
              defaultValue={expense?.note ?? ""}
              placeholder="ملاحظة (اختياري)"
              className="h-9 w-full bg-transparent text-[16px] outline-none placeholder:text-muted-foreground"
            />
          </Row>
        </div>
        {errors.note && <p className="px-1 text-[13px] text-destructive">{errors.note[0]}</p>}
      </div>

      <div className="shrink-0 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
        <motion.button
          type="submit"
          disabled={pending}
          whileTap={{ scale: 0.97 }}
          transition={SPRING}
          className="tint-button flex h-[52px] w-full items-center justify-center gap-2 rounded-full text-[17px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-70"
        >
          {pending ? (
            <Loader2Icon className="size-5 animate-spin" />
          ) : (
            <CheckIcon className="size-5" strokeWidth={2.6} />
          )}
          {expense ? "حفظ التعديلات" : "إضافة"}
        </motion.button>
      </div>
    </form>
  );
}

/** Settings-style row: coloured glyph tile, label, trailing control. */
function Row({
  icon: Icon,
  tint,
  label,
  children,
}: {
  icon: LucideIcon;
  tint: string;
  label?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 ps-4">
      <span
        className="flex size-7 shrink-0 items-center justify-center rounded-[8px] text-white"
        style={{ backgroundColor: tint }}
      >
        <Icon className="size-4" strokeWidth={2.3} />
      </span>
      <div className="list-row-body flex min-h-12 flex-1 items-center justify-between gap-3 py-1.5 pe-4">
        {label && <span className="text-[16px]">{label}</span>}
        {children}
      </div>
    </div>
  );
}

function DeleteExpenseButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <button
            type="button"
            aria-label="حذف المصروف"
            disabled={pending}
            className="flex size-8 items-center justify-center rounded-full text-destructive active:opacity-50"
          />
        }
      >
        {pending ? <Loader2Icon className="size-5 animate-spin" /> : <Trash2Icon className="size-5" />}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>حذف المصروف؟</AlertDialogTitle>
          <AlertDialogDescription>
            سيتم حذف هذا المصروف نهائياً ولا يمكن التراجع عن ذلك.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>إلغاء</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={() =>
              startTransition(async () => {
                const res = await deleteExpense(id);
                navigator.vibrate?.(10);
                toast.success(res.message);
                closeExpenseForm();
              })
            }
          >
            حذف
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
