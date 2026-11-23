"use client";

import { CheckIcon, Loader2Icon, Trash2Icon } from "lucide-react";
import { motion } from "motion/react";
import { useActionState, useEffect, useEffectEvent, useState, useTransition } from "react";
import { toast } from "sonner";

import { CategoryIcon } from "@/components/category-icon";
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
import { Group, Row, RowButton } from "@/components/ui/grouped-list";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Switch } from "@/components/ui/switch";
import { type Frequency, INCOME_SOURCES, type PaymentMethod } from "@/db/schema";
import { INCOME_SOURCE_META, PAYMENT_METHOD_LABELS } from "@/lib/constants";
import { formatShortDate, toISODate } from "@/lib/dates";
import { formatMoney, fromMinor } from "@/lib/money";
import { FREQUENCY_LABELS } from "@/lib/recurrence";
import type { ActionState } from "@/lib/validations";
import { deleteRecurring, saveRecurring, setRecurringActive } from "@/server/actions";
import type { CategoryOption, RecurringRow } from "@/server/queries";

const SPRING = { type: "spring", stiffness: 520, damping: 30 } as const;

export function RecurringManager({
  rules,
  categories,
  currency,
}: {
  rules: RecurringRow[];
  categories: CategoryOption[];
  currency: string;
}) {
  const [editing, setEditing] = useState<RecurringRow | null>(null);
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);

  function openForm(rule: RecurringRow) {
    setEditing(rule);
    setFormKey((k) => k + 1);
    setOpen(true);
  }

  const monthlyTotal = rules
    .filter((r) => r.active && r.kind === "expense")
    .reduce((sum, r) => {
      const perMonth =
        r.frequency === "weekly" ? (r.amount * 52) / 12 : r.frequency === "yearly" ? r.amount / 12 : r.amount;
      return sum + perMonth;
    }, 0);

  return (
    <>
      <Group
        header="المتكرر (مصاريف ودخل)"
        footer={
          rules.length
            ? `تُضاف تلقائياً في موعدها. المصاريف الثابتة تعادل ${formatMoney(Math.round(monthlyTotal), currency)} شهرياً.`
            : "عند إضافة مصروف أو دخل اختر «التكرار» ليُضاف تلقائياً في موعده — مثل الإيجار والاشتراكات والراتب."
        }
      >
        {rules.length === 0 ? (
          <Row title={<span className="text-muted-foreground">لا يوجد شيء متكرر بعد</span>} />
        ) : (
          rules.map((r) => (
            <RowButton
              key={r.id}
              onClick={() => openForm(r)}
              className={r.active ? undefined : "opacity-55"}
              leading={
                r.kind === "income" ? (
                  <CategoryIcon
                    icon={INCOME_SOURCE_META[r.source ?? "salary"].icon}
                    color="var(--positive)"
                    className="size-[30px] rounded-[8px] text-[16px]"
                  />
                ) : (
                  <CategoryIcon
                    icon={r.categoryIcon}
                    color={r.categoryColor}
                    className="size-[30px] rounded-[8px] text-[16px]"
                  />
                )
              }
              title={
                r.note ||
                (r.kind === "income" ? INCOME_SOURCE_META[r.source ?? "salary"].label : r.categoryName) ||
                "مصروف متكرر"
              }
              subtitle={
                r.active
                  ? `${FREQUENCY_LABELS[r.frequency]} · القادم ${formatShortDate(r.nextDate)}`
                  : `${FREQUENCY_LABELS[r.frequency]} · متوقف مؤقتاً`
              }
              trailing={
                <span className={`text-[15px] font-semibold tabular ${r.kind === "income" ? "text-positive" : ""}`} dir="ltr">
                  {r.kind === "income" ? "+" : ""}
                  {formatMoney(r.amount, currency)}
                </span>
              }
              chevron
            />
          ))
        )}
      </Group>

      <Drawer open={open} onOpenChange={setOpen} showSwipeHandle>
        <DrawerContent className="mx-auto max-w-2xl border-t-0 bg-background data-[swipe-direction=down]:rounded-t-[22px]">
          {editing && (
            <RecurringForm
              key={formKey}
              rule={editing}
              categories={categories}
              currency={currency}
              onDone={() => setOpen(false)}
            />
          )}
        </DrawerContent>
      </Drawer>
    </>
  );
}

function RecurringForm({
  rule,
  categories,
  currency,
  onDone,
}: {
  rule: RecurringRow;
  categories: CategoryOption[];
  currency: string;
  onDone: () => void;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveRecurring, {
    ok: false,
  });
  const [frequency, setFrequency] = useState<Frequency>(rule.frequency);
  const [method, setMethod] = useState<PaymentMethod>(rule.paymentMethod);
  const [active, setActive] = useState(rule.active);
  const [toggling, startToggle] = useTransition();
  const today = toISODate(new Date());

  const onResult = useEffectEvent((result: ActionState) => {
    if (result.ok) {
      navigator.vibrate?.(10);
      toast.success(result.message);
      onDone();
    } else if (result.message) {
      toast.error(result.message);
    }
  });
  useEffect(() => onResult(state), [state]);

  function toggleActive(next: boolean) {
    setActive(next);
    startToggle(async () => {
      const res = await setRecurringActive(rule.id, next);
      if (res.ok) toast.success(res.message);
      else {
        setActive(!next);
        toast.error(res.message);
      }
    });
  }

  const field =
    "h-9 rounded-[8px] bg-foreground/[0.06] px-2 text-[15px] font-medium outline-none dark:bg-white/10";

  return (
    <form action={action} className="flex min-h-0 flex-1 flex-col">
      <input type="hidden" name="id" value={rule.id} />
      <input type="hidden" name="frequency" value={frequency} />

      <div className="relative flex h-11 shrink-0 items-center justify-between px-4">
        <button type="button" onClick={onDone} className="text-[17px] text-primary active:opacity-50">
          إلغاء
        </button>
        <DrawerTitle className="pointer-events-none absolute inset-x-0 text-center text-[17px] font-semibold">
          {rule.kind === "income" ? "دخل متكرر" : "مصروف متكرر"}
        </DrawerTitle>
        <DrawerDescription className="sr-only">عدّل المبلغ والموعد وطريقة التكرار</DrawerDescription>
        <DeleteRecurring id={rule.id} onDeleted={onDone} />
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 pb-4">
        <div className="flex flex-col items-center pt-3">
          <label htmlFor="rec-amount" className="sr-only">
            المبلغ
          </label>
          <input
            id="rec-amount"
            name="amount"
            inputMode="decimal"
            dir="ltr"
            required
            defaultValue={String(fromMinor(rule.amount))}
            className="h-16 w-full bg-transparent text-center text-[48px] font-bold tabular outline-none"
          />
          <span className="mt-1 rounded-full bg-foreground/[0.06] px-3 py-1 text-[13px] font-semibold text-muted-foreground dark:bg-white/10">
            {currency}
          </span>
          {state.fieldErrors?.amount && (
            <p className="mt-2 text-[13px] text-destructive">{state.fieldErrors.amount[0]}</p>
          )}
        </div>

        <Group>
          <Row
            title="يعمل"
            subtitle={active ? "يُضاف تلقائياً في موعده" : "متوقف — لن يُضاف حتى تستأنفه"}
            trailing={
              <Switch checked={active} disabled={toggling} onCheckedChange={toggleActive} aria-label="تشغيل التكرار" />
            }
          />
          <Row
            title="التكرار"
            trailing={
              <SegmentedControl
                label="التكرار"
                value={frequency}
                onChange={setFrequency}
                className="w-48"
                options={[
                  { value: "weekly", label: "أسبوعي" },
                  { value: "monthly", label: "شهري" },
                  { value: "yearly", label: "سنوي" },
                ]}
              />
            }
          />
          <Row
            title={<label htmlFor="rec-next">الموعد القادم</label>}
            trailing={
              <input
                id="rec-next"
                name="nextDate"
                type="date"
                required
                min={today}
                defaultValue={rule.nextDate < today ? today : rule.nextDate}
                className={`${field} text-primary`}
              />
            }
          />
          {rule.kind === "income" ? (
            <Row
              title={<label htmlFor="rec-source">المصدر</label>}
              trailing={
                <select
                  id="rec-source"
                  name="source"
                  defaultValue={rule.source ?? "salary"}
                  className={`${field} max-w-44`}
                >
                  {INCOME_SOURCES.map((src) => (
                    <option key={src} value={src}>
                      {INCOME_SOURCE_META[src].icon} {INCOME_SOURCE_META[src].label}
                    </option>
                  ))}
                </select>
              }
            />
          ) : (
            <>
          <Row
            title={<label htmlFor="rec-category">التصنيف</label>}
            trailing={
              <select
                id="rec-category"
                name="categoryId"
                defaultValue={rule.categoryId ?? ""}
                className={`${field} max-w-44`}
              >
                <option value="">غير مصنّف</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>
            }
          />
            <Row
            title="الدفع"
            trailing={
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
            }
          />
            </>
          )}
          <Row
            title={
              <input
                name="note"
                maxLength={120}
                defaultValue={rule.note ?? ""}
                placeholder="ملاحظة (مثال: إيجار، نتفليكس)"
                aria-label="ملاحظة"
                className="h-9 w-full bg-transparent text-[16px] outline-none placeholder:text-muted-foreground"
              />
            }
          />
        </Group>
        {state.fieldErrors?.nextDate && (
          <p className="px-1 text-[13px] text-destructive">{state.fieldErrors.nextDate[0]}</p>
        )}
        <p className="px-1 text-[13px] text-muted-foreground">
          التعديل يطبّق على المرات القادمة فقط؛ المصاريف السابقة تبقى كما هي.
        </p>
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
          حفظ
        </motion.button>
      </div>
    </form>
  );
}

function DeleteRecurring({ id, onDeleted }: { id: string; onDeleted: () => void }) {
  const [pending, startTransition] = useTransition();
  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <button
            type="button"
            aria-label="حذف المصروف المتكرر"
            disabled={pending}
            className="flex size-8 items-center justify-center rounded-full text-destructive active:opacity-50"
          />
        }
      >
        {pending ? <Loader2Icon className="size-5 animate-spin" /> : <Trash2Icon className="size-5" />}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>حذف المصروف المتكرر؟</AlertDialogTitle>
          <AlertDialogDescription>
            لن يُضاف بعد الآن. المصاريف التي أُضيفت سابقاً تبقى في سجلك.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>إلغاء</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={() =>
              startTransition(async () => {
                const res = await deleteRecurring(id);
                toast.success(res.message);
                onDeleted();
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
