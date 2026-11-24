"use client";

import {
  CalendarDaysIcon,
  CheckIcon,
  CreditCardIcon,
  Loader2Icon,
  PencilLineIcon,
  RepeatIcon,
  TypeIcon,
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
import { CurrencyPicker, RateLine, lastRate, rememberRate } from "@/components/money/currency-fields";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { PAYMENT_METHOD_LABELS } from "@masrufi/core/constants";
import { addDays, toISODate } from "@masrufi/core/dates";
import { formatMoney, fromMinor, toMinor } from "@masrufi/core/money";
import { countExpenses } from "@masrufi/core/plural";
import { type DraftExpense, parseCommand } from "@masrufi/core/quick-add/parse";
import { cn } from "@/lib/utils";
import type { ActionState } from "@masrufi/contracts/validations";
import type { Frequency, PaymentMethod } from "@masrufi/core/enums";
import { addExpensesBatch, deleteExpense, saveExpense } from "@/server/actions";
import type { CategoryOption } from "@/server/queries";

import {
  closeExpenseForm,
  openExpenseForm,
  useExpenseFormState,
} from "./expense-form-store";
import { IncomeForm } from "./income-form";
import { EntryKindSwitch, SPRING, SheetRow } from "./sheet-parts";

type Props = { categories: CategoryOption[]; currency: string };


export function ExpenseFormDrawer({ categories, currency }: Props) {
  const { open, kind, expense, income, nonce } = useExpenseFormState();
  const isNew = !expense && !income;
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
        className="mx-auto max-w-2xl border-t-0 bg-background data-[swipe-direction=down]:rounded-t-[22px]"
        // New entry: jump straight to the amount so the keypad opens.
        initialFocus={
          isNew
            ? () => document.getElementById(kind === "income" ? "income-amount" : "amount")
            : undefined
        }
      >
        {/* Remount on every open (and kind switch) so the form starts fresh. */}
        {kind === "income" ? (
          <IncomeForm key={`i-${nonce}`} currency={currency} income={income} showKindSwitch={isNew} />
        ) : (
          <ExpenseForm
            key={`e-${nonce}`}
            categories={categories}
            currency={currency}
            expense={expense}
            showKindSwitch={isNew}
          />
        )}
      </DrawerContent>
    </Drawer>
  );
}

type DateMode = "today" | "yesterday" | "other";

function ExpenseForm({
  categories,
  currency,
  expense,
  showKindSwitch,
}: Props & {
  expense: ReturnType<typeof useExpenseFormState>["expense"];
  showKindSwitch: boolean;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(saveExpense, {
    ok: false,
  });
  const today = toISODate(new Date());
  const yesterday = addDays(today, -1);

  const [amount, setAmount] = useState(
    expense ? String(fromMinor(expense.originalAmount ?? expense.amount)) : "",
  );
  // Typed in another currency? Then `amount` is in `cur`, converted at `rate`.
  const [cur, setCur] = useState(expense?.originalCurrency ?? currency);
  const [rate, setRate] = useState(
    expense?.originalAmount ? String(Number((expense.amount / expense.originalAmount).toPrecision(6))) : "",
  );
  const [categoryId, setCategoryId] = useState(
    (expense ? expense.categoryId : categories[0]?.id) ?? "",
  );
  const [date, setDate] = useState(expense?.date ?? today);
  const [dateMode, setDateMode] = useState<DateMode>(
    date === today ? "today" : date === yesterday ? "yesterday" : "other",
  );
  const [method, setMethod] = useState<PaymentMethod>(expense?.paymentMethod ?? "cash");
  const [note, setNote] = useState(expense?.note ?? "");
  const [repeat, setRepeat] = useState<"none" | Frequency>("none");
  const [quick, setQuick] = useState("");
  const [batch, setBatch] = useState<DraftExpense[]>([]);
  const [batchPending, startBatch] = useTransition();
  const [amountScope, animateAmount] = useAnimate<HTMLDivElement>();

  useEffect(() => {
    if (state.ok) {
      navigator.vibrate?.(10);
      toast.success(state.message);
      if (cur !== currency) rememberRate(cur, currency, rate);
      closeExpenseForm();
    } else if (state.message) {
      toast.error(state.message);
      if (state.fieldErrors?.amount && amountScope.current) {
        animateAmount(amountScope.current, { x: [0, -12, 10, -6, 4, 0] }, { duration: 0.42 });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on a new result
  }, [state, amountScope, animateAmount]);

  const errors = state.fieldErrors ?? {};
  // Shrink the figure as it grows, like the iOS calculator.
  const amountSize = amount.length <= 5 ? 60 : amount.length <= 8 ? 48 : 38;

  function pickDate(mode: DateMode) {
    setDateMode(mode);
    if (mode === "today") setDate(today);
    if (mode === "yesterday") setDate(yesterday);
  }

  /**
   * Quick entry: "قهوة 5 بطاقة مبارح" fills the form as you type (parsed on
   * the device, no network). Several items ("قهوة 5 وسندويشة 7") are offered
   * as a one-tap batch add instead.
   */
  function onQuickChange(text: string) {
    setQuick(text);
    const cmd = parseCommand(text, { today, categories });
    const items = cmd.kind === "add" ? cmd.items.filter((i) => i.amount !== null) : [];
    setBatch(items.length > 1 ? items : []);
    const first = cmd.kind === "add" ? cmd.items[0] : undefined;
    if (!first || items.length > 1) return;
    if (first.amount !== null) setAmount(String(first.amount));
    if (first.categoryId) setCategoryId(first.categoryId);
    setDate(first.date);
    setDateMode(first.date === today ? "today" : first.date === yesterday ? "yesterday" : "other");
    setMethod(first.paymentMethod);
    setNote(first.note ?? "");
  }

  function addBatch() {
    startBatch(async () => {
      const res = await addExpensesBatch(batch);
      if (res.ok) {
        navigator.vibrate?.(10);
        toast.success(res.message);
        closeExpenseForm();
      } else {
        toast.error(res.message);
      }
    });
  }

  const categoryById = new Map(categories.map((c) => [c.id, c]));

  return (
    <form action={formAction} className="flex min-h-0 flex-1 flex-col">
      {expense && <input type="hidden" name="id" value={expense.id} />}
      <input type="hidden" name="date" value={date} />
      {!expense && <input type="hidden" name="repeat" value={repeat} />}

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
      {showKindSwitch && <EntryKindSwitch value="expense" />}

      <div className="flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 pb-4">
        {/* Quick entry (new expenses only) */}
        {!expense && (
          <div className="space-y-2 pt-1">
            <label className="surface flex h-11 items-center gap-2 px-3 has-focus-visible:ring-2 has-focus-visible:ring-ring">
              <TypeIcon className="size-[18px] shrink-0 text-muted-foreground" strokeWidth={1.75} />
              <span className="sr-only">إدخال سريع</span>
              <input
                value={quick}
                onChange={(e) => onQuickChange(e.target.value)}
                placeholder="اكتب بسرعة: قهوة 5 بطاقة مبارح"
                autoComplete="off"
                enterKeyHint="done"
                className="h-full min-w-0 flex-1 bg-transparent text-[16px] outline-none placeholder:text-muted-foreground"
              />
            </label>
            <AnimatePresence initial={false}>
              {batch.length > 1 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="surface space-y-2 p-3">
                    <p className="text-[13px] font-medium text-muted-foreground">
                      تعرّفت على {countExpenses(batch.length)}:
                    </p>
                    <ul className="space-y-1.5">
                      {batch.map((b, i) => {
                        const c = b.categoryId ? categoryById.get(b.categoryId) : undefined;
                        return (
                          <li key={i} className="flex items-center gap-2 text-[15px]">
                            <span aria-hidden>{c?.icon ?? "❔"}</span>
                            <span className="min-w-0 flex-1 truncate">
                              {b.note || c?.name || "غير مصنّف"}
                            </span>
                            <span className="font-semibold tabular">
                              {formatMoney(toMinor(b.amount!), currency)}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                    <button
                      type="button"
                      onClick={addBatch}
                      disabled={batchPending}
                      className="tint-button flex h-10 w-full items-center justify-center gap-2 text-[15px] font-semibold disabled:opacity-70"
                    >
                      {batchPending ? (
                        <Loader2Icon className="size-4 animate-spin" />
                      ) : (
                        <CheckIcon className="size-4" strokeWidth={2.6} />
                      )}
                      أضف الكل ({batch.length})
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

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
            className="h-[72px] w-full bg-transparent text-center font-display font-semibold leading-none caret-primary tabular outline-none transition-[font-size] duration-200 placeholder:text-foreground/20"
          />
          <CurrencyPicker
            name="currency"
            value={cur}
            main={currency}
            onChange={(c) => {
              setCur(c);
              setRate(c === currency ? "" : (lastRate(c, currency) ?? ""));
            }}
            className="mt-1"
          />
          {cur !== currency && (
            <RateLine
              key={cur}
              from={cur}
              to={currency}
              amount={amount}
              rate={rate}
              setRate={setRate}
              error={errors.rate?.[0]}
            />
          )}
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
                    whileTap={{ scale: 0.92 }}
                    transition={SPRING}
                    className={cn(
                      "relative flex size-14 items-center justify-center rounded-[14px] text-[26px] transition-[box-shadow,background-color] duration-200 group-has-focus-visible:ring-2 group-has-focus-visible:ring-ring",
                      selected
                        ? "bg-card shadow-[inset_0_0_0_2px_var(--ink)]"
                        : "bg-foreground/[0.045] shadow-[inset_0_0_0_1px_var(--hairline)]",
                    )}
                  >
                    <span aria-hidden>{c.icon}</span>
                    <AnimatePresence>
                      {selected && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          transition={SPRING}
                          className="absolute -end-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-ink text-ink-foreground ring-2 ring-card"
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
          <SheetRow icon={CalendarDaysIcon} label="التاريخ">
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
          </SheetRow>
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
                  <div className="list-row-body flex min-w-0 flex-1 items-center justify-between gap-3 py-2 pe-4">
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
          <SheetRow icon={CreditCardIcon} label="الدفع">
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
          </SheetRow>
          {!expense && (
            <SheetRow icon={RepeatIcon} label="التكرار">
              <SegmentedControl
                label="التكرار"
                value={repeat}
                onChange={setRepeat}
                className="w-56"
                options={[
                  { value: "none", label: "لا" },
                  { value: "weekly", label: "أسبوعي" },
                  { value: "monthly", label: "شهري" },
                  { value: "yearly", label: "سنوي" },
                ]}
              />
            </SheetRow>
          )}
          <SheetRow icon={PencilLineIcon}>
            <label htmlFor="note" className="sr-only">
              ملاحظة
            </label>
            <input
              id="note"
              name="note"
              maxLength={120}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="ملاحظة (اختياري)"
              className="h-9 w-full bg-transparent text-[16px] outline-none placeholder:text-muted-foreground"
            />
          </SheetRow>
        </div>
        {errors.note && <p className="px-1 text-[13px] text-destructive">{errors.note[0]}</p>}
        {repeat !== "none" && (
          <p className="px-1 text-[13px] text-muted-foreground">
            🔁 سيُضاف هذا المصروف تلقائياً كل{" "}
            {repeat === "weekly" ? "أسبوع" : repeat === "monthly" ? "شهر" : "سنة"}، ويمكنك إيقافه أو
            تعديله من الإعدادات.
          </p>
        )}
        {expense?.recurringId && (
          <p className="px-1 text-[13px] text-muted-foreground">
            🔁 هذا المصروف من مصروف متكرر. تعديله هنا يغيّر هذه المرة فقط؛ لتغيير التكرار افتح
            الإعدادات ← المصاريف المتكررة.
          </p>
        )}
      </div>

      <div className="shrink-0 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
        <motion.button
          type="submit"
          disabled={pending}
          whileTap={{ scale: 0.97 }}
          transition={SPRING}
          className="tint-button flex h-[52px] w-full items-center justify-center gap-2 text-[17px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-70"
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
