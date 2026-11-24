"use client";

import { CalendarDaysIcon, CheckIcon, Loader2Icon, PencilLineIcon, RepeatIcon, Trash2Icon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useActionState, useEffect, useEffectEvent, useState, useTransition } from "react";
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
import { DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { CurrencyPicker, RateLine, lastRate, rememberRate } from "@/components/money/currency-fields";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { type Frequency, INCOME_SOURCES, type IncomeSource } from "@masrufi/core/enums";
import { INCOME_SOURCE_META } from "@masrufi/core/constants";
import { addDays, toISODate } from "@masrufi/core/dates";
import { fromMinor } from "@masrufi/core/money";
import type { ActionState } from "@masrufi/contracts/validations";
import { deleteIncome, saveIncome } from "@/server/actions";
import type { IncomeRow } from "@/server/queries";

import { closeExpenseForm } from "./expense-form-store";
import { EntryKindSwitch, SPRING, SheetRow } from "./sheet-parts";

type DateMode = "today" | "yesterday" | "other";

export function IncomeForm({
  currency,
  income,
  showKindSwitch,
}: {
  currency: string;
  income: IncomeRow | null;
  showKindSwitch: boolean;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveIncome, { ok: false });
  const today = toISODate(new Date());
  const yesterday = addDays(today, -1);

  const [amount, setAmount] = useState(income ? String(fromMinor(income.originalAmount ?? income.amount)) : "");
  const [cur, setCur] = useState(income?.originalCurrency ?? currency);
  const [rate, setRate] = useState(
    income?.originalAmount ? String(Number((income.amount / income.originalAmount).toPrecision(6))) : "",
  );
  const [source, setSource] = useState<IncomeSource>(income?.source ?? "salary");
  const [date, setDate] = useState(income?.date ?? today);
  const [repeat, setRepeat] = useState<"none" | Frequency>("none");
  const [dateMode, setDateMode] = useState<DateMode>(
    date === today ? "today" : date === yesterday ? "yesterday" : "other",
  );

  const onResult = useEffectEvent((result: ActionState) => {
    if (result.ok) {
      navigator.vibrate?.(10);
      toast.success(result.message);
      if (cur !== currency) rememberRate(cur, currency, rate);
      closeExpenseForm();
    } else if (result.message) {
      toast.error(result.message);
    }
  });
  useEffect(() => onResult(state), [state]);

  function pickDate(mode: DateMode) {
    setDateMode(mode);
    if (mode === "today") setDate(today);
    if (mode === "yesterday") setDate(yesterday);
  }

  const amountSize = amount.length <= 5 ? 60 : amount.length <= 8 ? 48 : 38;

  return (
    <form action={action} className="flex min-h-0 flex-1 flex-col">
      {income && <input type="hidden" name="id" value={income.id} />}
      <input type="hidden" name="date" value={date} />
      {!income && <input type="hidden" name="repeat" value={repeat} />}
      <input type="hidden" name="source" value={source} />

      <div className="relative flex h-11 shrink-0 items-center justify-between px-4">
        <button type="button" onClick={closeExpenseForm} className="text-[17px] text-primary active:opacity-50">
          إلغاء
        </button>
        <DrawerTitle className="pointer-events-none absolute inset-x-0 text-center text-[17px] font-semibold">
          {income ? "تعديل الدخل" : "دخل جديد"}
        </DrawerTitle>
        <DrawerDescription className="sr-only">أدخل المبلغ ومصدر الدخل ثم احفظ</DrawerDescription>
        {income ? <DeleteIncomeButton id={income.id} /> : <span className="w-8" />}
      </div>
      {showKindSwitch && <EntryKindSwitch value="income" />}

      <div className="flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 pb-4">
        <div className="flex flex-col items-center pt-3">
          <label htmlFor="income-amount" className="sr-only">
            المبلغ
          </label>
          <input
            id="income-amount"
            name="amount"
            inputMode="decimal"
            autoComplete="off"
            required
            dir="ltr"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            aria-invalid={!!state.fieldErrors?.amount}
            style={{ fontSize: amountSize }}
            className="h-[72px] w-full bg-transparent text-center font-display font-semibold leading-none text-positive caret-primary tabular outline-none transition-[font-size] duration-200 placeholder:text-foreground/20"
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
              error={state.fieldErrors?.rate?.[0]}
            />
          )}
          {state.fieldErrors?.amount && (
            <p className="mt-2 text-[13px] font-medium text-destructive">{state.fieldErrors.amount[0]}</p>
          )}
        </div>

        <fieldset>
          <legend className="mb-2 px-1 text-[13px] font-medium text-muted-foreground">المصدر</legend>
          <div className="surface grid grid-cols-3 gap-x-2 gap-y-4 p-4">
            {INCOME_SOURCES.map((s) => {
              const meta = INCOME_SOURCE_META[s];
              const selected = s === source;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSource(s)}
                  aria-pressed={selected}
                  className="flex flex-col items-center gap-1.5 outline-none"
                >
                  <motion.span
                    whileTap={{ scale: 0.92 }}
                    transition={SPRING}
                    className={
                      selected
                        ? "flex size-14 items-center justify-center rounded-[14px] bg-card text-[26px] shadow-[inset_0_0_0_2px_var(--ink)]"
                        : "flex size-14 items-center justify-center rounded-[14px] bg-foreground/[0.045] text-[26px] shadow-[inset_0_0_0_1px_var(--hairline)]"
                    }
                  >
                    {meta.icon}
                  </motion.span>
                  <span className={selected ? "text-[12px] font-semibold" : "text-[12px] text-muted-foreground"}>
                    {meta.label}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

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
                className="overflow-hidden"
              >
                <div className="flex items-center justify-between gap-3 py-2 pe-4 ps-[3.25rem]">
                  <label htmlFor="income-date" className="text-[16px]">
                    اختر اليوم
                  </label>
                  <input
                    id="income-date"
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="h-9 rounded-[8px] bg-foreground/[0.06] px-2 text-[15px] font-medium text-primary outline-none dark:bg-white/10"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {!income && (
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
            <input
              name="note"
              maxLength={120}
              defaultValue={income?.note ?? ""}
              placeholder="ملاحظة (مثال: راتب نوفمبر)"
              aria-label="ملاحظة"
              className="h-9 w-full bg-transparent text-[16px] outline-none placeholder:text-muted-foreground"
            />
          </SheetRow>
        </div>
      </div>

      <div className="shrink-0 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
        <motion.button
          type="submit"
          disabled={pending}
          whileTap={{ scale: 0.97 }}
          transition={SPRING}
          className="tint-button flex h-[52px] w-full items-center justify-center gap-2 text-[17px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-70"
        >
          {pending ? <Loader2Icon className="size-5 animate-spin" /> : <CheckIcon className="size-5" strokeWidth={2.6} />}
          {income ? "حفظ التعديلات" : "إضافة الدخل"}
        </motion.button>
      </div>
    </form>
  );
}

function DeleteIncomeButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <button
            type="button"
            aria-label="حذف الدخل"
            disabled={pending}
            className="flex size-8 items-center justify-center rounded-full text-destructive active:opacity-50"
          />
        }
      >
        {pending ? <Loader2Icon className="size-5 animate-spin" /> : <Trash2Icon className="size-5" />}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>حذف هذا الدخل؟</AlertDialogTitle>
          <AlertDialogDescription>سيتم حذفه نهائياً ولا يمكن التراجع عن ذلك.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>إلغاء</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={() =>
              startTransition(async () => {
                const res = await deleteIncome(id);
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
