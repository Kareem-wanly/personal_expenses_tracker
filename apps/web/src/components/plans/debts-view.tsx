"use client";

import { CalendarClockIcon, CalendarDaysIcon, CheckIcon, Loader2Icon, PencilLineIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useActionState, useState, useTransition } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/empty-state";
import { LedgerMeter, LedgerRows } from "@/components/ledger";
import { PageHeader } from "@/components/layout/page-header";
import { Reveal } from "@/components/motion/reveal";
import {
  AmountField,
  BackLink,
  SheetNav,
  TextRow,
  dateInput,
  navButton,
  sheetContentClass,
  submitWith,
  textInput,
  useActionResult,
} from "@/components/plans/plan-parts";
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
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { SegmentedControl } from "@/components/ui/segmented-control";
import type { DebtDirection } from "@masrufi/core/enums";
import { formatShortDate, toISODate } from "@masrufi/core/dates";
import { formatMoney, fromMinor } from "@masrufi/core/money";
import { dueLabel } from "@masrufi/core/plans";
import { cn } from "@/lib/utils";
import type { ActionState } from "@masrufi/contracts/validations";
import { addDebtPayment, deleteDebt, deleteDebtPayment, saveDebt, settleDebt } from "@/server/plans-actions";
import type { DebtRow } from "@/server/plans";

type Sheet = { kind: "new" } | { kind: "edit"; id: string } | { kind: "view"; id: string } | null;

const DIRECTION_LABEL: Record<DebtDirection, string> = { lent: "لي عند", borrowed: "عليّ لـ" };

/** "١٠٠ $ · ٥٠٬٠٠٠ ل.س" — one figure per currency. */
function moneyList(totals: { currency: string; total: number }[]) {
  return totals.length ? totals.map((t) => formatMoney(t.total, t.currency)).join(" · ") : "—";
}

function totals(debts: DebtRow[]) {
  const map = new Map<string, number>();
  for (const d of debts) map.set(d.currency, (map.get(d.currency) ?? 0) + d.state.remaining);
  return [...map].map(([currency, total]) => ({ currency, total }));
}

export function DebtsView({
  debts,
  currency,
  approx,
}: {
  debts: DebtRow[];
  currency: string;
  /** Mixed currencies, converted to the user's at today's rate (null = not needed / unavailable). */
  approx: { owedToMe: number | null; iOwe: number | null };
}) {
  const [sheet, setSheet] = useState<Sheet>(null);
  const open = debts.filter((d) => !d.state.settled);
  const lent = open.filter((d) => d.direction === "lent");
  const borrowed = open.filter((d) => d.direction === "borrowed");
  const settled = debts.filter((d) => d.state.settled);
  const overdue = open.filter((d) => d.state.overdue).length;
  const current = sheet && sheet.kind !== "new" ? debts.find((d) => d.id === sheet.id) : undefined;

  return (
    <div className="space-y-7">
      <div>
        <BackLink />
        <PageHeader
          className="pt-2"
          title="الديون"
          subtitle="ما لك عند الناس وما عليك لهم"
          action={
            <button
              type="button"
              onClick={() => setSheet({ kind: "new" })}
              aria-label="دين جديد"
              className="pressable flex size-10 items-center justify-center rounded-full bg-ink text-ink-foreground"
            >
              <PlusIcon className="size-5" />
            </button>
          }
        />
      </div>

      {debts.length === 0 ? (
        <Reveal index={0}>
          <EmptyState
            title="لا ديون مسجّلة"
            description="سجّل ما أقرضته لغيرك أو اقترضته منهم، وسنذكّرك قبل موعد السداد."
            action={
              <button
                type="button"
                onClick={() => setSheet({ kind: "new" })}
                className="tint-button h-10 px-4 text-[15px] font-semibold"
              >
                أضف أول دين
              </button>
            }
          />
        </Reveal>
      ) : (
        <>
          <Reveal index={0}>
            <div className="surface px-4 py-4">
              <LedgerRows
                rows={[
                  {
                    label: "لك عند الآخرين",
                    value: moneyList(totals(lent)),
                    tone: lent.length ? "positive" : "muted",
                    hint: approx.owedToMe !== null ? `≈ ${formatMoney(approx.owedToMe, currency)} بسعر اليوم` : undefined,
                  },
                  {
                    label: "عليك للآخرين",
                    value: moneyList(totals(borrowed)),
                    tone: borrowed.length ? "negative" : "muted",
                    hint: approx.iOwe !== null ? `≈ ${formatMoney(approx.iOwe, currency)} بسعر اليوم` : undefined,
                  },
                  ...(overdue
                    ? [{ label: "متأخرة عن موعدها", value: String(overdue), tone: "warning" as const }]
                    : []),
                ]}
              />
            </div>
          </Reveal>

          {lent.length > 0 && (
            <Reveal as="section" index={1} className="space-y-2">
              <h2 className="px-1 text-[13px] font-medium text-muted-foreground">لك</h2>
              <DebtList debts={lent} onOpen={(id) => setSheet({ kind: "view", id })} />
            </Reveal>
          )}
          {borrowed.length > 0 && (
            <Reveal as="section" index={2} className="space-y-2">
              <h2 className="px-1 text-[13px] font-medium text-muted-foreground">عليك</h2>
              <DebtList debts={borrowed} onOpen={(id) => setSheet({ kind: "view", id })} />
            </Reveal>
          )}
          {settled.length > 0 && (
            <Reveal index={3}>
              <details className="group">
                <summary className="cursor-pointer list-none px-1 text-[13px] font-medium text-muted-foreground [&::-webkit-details-marker]:hidden">
                  مسدّدة ({settled.length}) <span className="group-open:hidden">· عرض</span>
                </summary>
                <div className="mt-2">
                  <DebtList debts={settled} onOpen={(id) => setSheet({ kind: "view", id })} />
                </div>
              </details>
            </Reveal>
          )}
        </>
      )}

      <Drawer open={!!sheet} onOpenChange={(next) => !next && setSheet(null)} showSwipeHandle>
        <DrawerContent className={sheetContentClass}>
          {sheet?.kind === "new" && <DebtForm key="new" currency={currency} onDone={() => setSheet(null)} />}
          {sheet?.kind === "edit" && current && (
            <DebtForm
              key={`edit-${current.id}`}
              debt={current}
              currency={currency}
              onDone={() => setSheet({ kind: "view", id: current.id })}
            />
          )}
          {sheet?.kind === "view" && current && (
            <DebtDetail
              key={`view-${current.id}`}
              debt={current}
              onEdit={() => setSheet({ kind: "edit", id: current.id })}
              onClose={() => setSheet(null)}
            />
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
}

function DebtList({ debts, onOpen }: { debts: DebtRow[]; onOpen: (id: string) => void }) {
  return (
    <div className="surface inset-list overflow-hidden">
      {debts.map((d) => (
        <button
          key={d.id}
          type="button"
          onClick={() => onOpen(d.id)}
          className="flex w-full items-center gap-3 ps-4 text-start transition-colors duration-150 active:bg-foreground/[0.06] focus-visible:bg-foreground/[0.04] focus-visible:outline-none"
        >
          <span
            aria-hidden
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-foreground/[0.06] font-display text-[17px] font-semibold ring-1 ring-inset ring-hairline"
          >
            {d.person.trim().slice(0, 1)}
          </span>
          <div className="list-row-body flex min-w-0 flex-1 items-center gap-3 py-3 pe-4">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[16px] font-medium">{d.person}</p>
              <p className="mt-0.5 truncate text-[13px] text-muted-foreground">
                {d.state.settled ? (
                  "مسدّد"
                ) : (
                  <>
                    {d.state.dueIn !== null && (
                      <span className={cn(d.state.overdue && "font-medium text-warning")}>
                        {dueLabel(d.state.dueIn)}
                      </span>
                    )}
                    {d.state.dueIn !== null && (d.note || d.paid > 0) && " · "}
                    {d.paid > 0 ? `سُدّد ${Math.round(d.state.ratio * 100)}%` : d.note}
                  </>
                )}
              </p>
            </div>
            <span
              className={cn(
                "shrink-0 text-[16px] font-semibold tabular",
                d.state.settled ? "text-muted-foreground line-through" : d.direction === "lent" ? "text-positive" : "text-negative",
              )}
            >
              {formatMoney(d.state.settled ? d.amount : d.state.remaining, d.currency)}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}

/* -------------------------------- Details -------------------------------- */

function DebtDetail({ debt, onEdit, onClose }: { debt: DebtRow; onEdit: () => void; onClose: () => void }) {
  const [state, dispatch, paying] = useActionState<ActionState, FormData>(addDebtPayment, { ok: false });
  const [, startTransition] = useTransition();
  const [busy, startBusy] = useTransition();
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => toISODate(new Date()));
  useActionResult(state, () => setAmount(""));

  function run(fn: () => Promise<ActionState>, after?: () => void) {
    startBusy(async () => {
      const res = await fn();
      if (res.ok) {
        toast.success(res.message);
        after?.();
      } else toast.error(res.message);
    });
  }

  const s = debt.state;
  const tone = debt.direction === "lent" ? "text-positive" : "text-negative";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SheetNav
        title={debt.person}
        description="تفاصيل الدين ودفعات السداد"
        start={
          <button type="button" onClick={onClose} className={navButton}>
            تم
          </button>
        }
        end={
          <button type="button" onClick={onEdit} className={navButton} aria-label="تعديل">
            <PencilLineIcon className="size-5" />
          </button>
        }
      />
      <div className="flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 pb-6">
        <div className="pt-2 text-center">
          <p className="text-[14px] text-muted-foreground">
            {debt.direction === "lent" ? `لك عند ${debt.person}` : `عليك لـ ${debt.person}`}
          </p>
          <p className={cn("mt-1 font-display text-[44px] font-semibold leading-none tabular", s.settled ? "text-muted-foreground" : tone)}>
            {formatMoney(s.settled ? debt.amount : s.remaining, debt.currency)}
          </p>
          <p className="mt-1.5 text-[13px] text-muted-foreground">
            {s.settled ? "مسدّد بالكامل ✓" : debt.paid > 0 ? `متبقٍّ من أصل ${formatMoney(debt.amount, debt.currency)}` : "لم يُسدَّد شيء بعد"}
          </p>
        </div>

        {debt.paid > 0 && !s.settled && <LedgerMeter ratio={s.ratio} label="نسبة السداد" />}

        <div className="surface px-4 py-4">
          <LedgerRows
            rows={[
              { label: "المبلغ", value: formatMoney(debt.amount, debt.currency) },
              { label: "المسدّد", value: formatMoney(debt.paid, debt.currency) },
              { label: "التاريخ", value: formatShortDate(debt.date) },
              ...(debt.dueDate
                ? [
                    {
                      label: "موعد السداد",
                      value: formatShortDate(debt.dueDate),
                      hint: s.settled || s.dueIn === null ? undefined : dueLabel(s.dueIn),
                      tone: s.overdue ? ("warning" as const) : ("default" as const),
                    },
                  ]
                : []),
            ]}
          />
          {debt.note && <p className="mt-3 text-[14px] text-muted-foreground">{debt.note}</p>}
        </div>

        {!s.settled && (
          <form onSubmit={submitWith(dispatch, startTransition)} className="surface space-y-3 p-4">
            <input type="hidden" name="debtId" value={debt.id} />
            <input type="hidden" name="date" value={date} />
            <p className="text-[15px] font-semibold">تسجيل دفعة</p>
            <div className="flex items-center gap-2">
              <input
                name="amount"
                inputMode="decimal"
                dir="ltr"
                autoComplete="off"
                required
                placeholder={String(fromMinor(s.remaining))}
                aria-label="مبلغ الدفعة"
                aria-invalid={!!state.fieldErrors?.amount}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-11 min-w-0 flex-1 rounded-[12px] bg-foreground/[0.05] px-3 text-center text-[17px] font-semibold tabular outline-none ring-1 ring-inset ring-hairline focus:ring-2 focus:ring-ring"
              />
              <span dir="ltr" className="text-[13px] font-semibold text-muted-foreground">
                {debt.currency}
              </span>
              <input
                type="date"
                aria-label="تاريخ الدفعة"
                value={date}
                max={toISODate(new Date())}
                onChange={(e) => e.target.value && setDate(e.target.value)}
                className={dateInput}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={paying || !amount}
                className="tint-button flex h-10 flex-1 items-center justify-center gap-2 text-[15px] font-semibold disabled:opacity-60"
              >
                {paying && <Loader2Icon className="size-4 animate-spin" />}
                تسجيل الدفعة
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => run(() => settleDebt(debt.id))}
                className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-[12px] text-[15px] font-semibold text-positive ring-1 ring-inset ring-hairline active:bg-foreground/[0.06] disabled:opacity-60"
              >
                <CheckIcon className="size-4" strokeWidth={2.5} />
                سُدّد بالكامل
              </button>
            </div>
          </form>
        )}

        {debt.payments.length > 0 && (
          <section className="space-y-2">
            <h3 className="px-1 text-[13px] font-medium text-muted-foreground">الدفعات</h3>
            <div className="surface inset-list overflow-hidden">
              {debt.payments.map((p) => (
                <div key={p.id} className="flex items-center gap-3 ps-4">
                  <div className="list-row-body flex min-h-12 min-w-0 flex-1 items-center gap-3 py-2 pe-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-semibold tabular">{formatMoney(p.amount, debt.currency)}</p>
                      <p className="truncate text-[12.5px] text-muted-foreground">
                        {[formatShortDate(p.date), p.note].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => run(() => deleteDebtPayment(p.id))}
                      aria-label="حذف الدفعة"
                      className="flex size-9 items-center justify-center rounded-full text-destructive active:bg-foreground/[0.06] disabled:opacity-50"
                    >
                      <Trash2Icon className="size-[17px]" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <DeleteButton
          label="حذف الدين"
          title={`حذف دين ${debt.person}؟`}
          description="سيُحذف الدين وكل دفعاته. لا يمكن التراجع."
          onConfirm={() => run(() => deleteDebt(debt.id), onClose)}
        />
      </div>
    </div>
  );
}

export function DeleteButton({
  label,
  title,
  description,
  onConfirm,
}: {
  label: string;
  title: string;
  description: string;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <button
            type="button"
            className="flex h-11 w-full items-center justify-center gap-2 text-[16px] text-destructive active:opacity-60"
          >
            <Trash2Icon className="size-[18px]" />
            {label}
          </button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>إلغاء</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onConfirm}>
            حذف
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/* ---------------------------------- Form --------------------------------- */

function DebtForm({ debt, currency, onDone }: { debt?: DebtRow; currency: string; onDone: () => void }) {
  const [state, dispatch, pending] = useActionState<ActionState, FormData>(saveDebt, { ok: false });
  const [, startTransition] = useTransition();
  useActionResult(state, onDone);

  const [direction, setDirection] = useState<DebtDirection>(debt?.direction ?? "lent");
  const [person, setPerson] = useState(debt?.person ?? "");
  const [amount, setAmount] = useState(debt ? String(fromMinor(debt.amount)) : "");
  const [cur, setCur] = useState(debt?.currency ?? currency);
  const [date, setDate] = useState(debt?.date ?? toISODate(new Date()));
  const [dueDate, setDueDate] = useState(debt?.dueDate ?? "");
  const [note, setNote] = useState(debt?.note ?? "");
  const errors = state.fieldErrors ?? {};

  return (
    <form onSubmit={submitWith(dispatch, startTransition)} className="flex min-h-0 flex-1 flex-col">
      {debt && <input type="hidden" name="id" value={debt.id} />}
      <input type="hidden" name="direction" value={direction} />
      <SheetNav
        title={debt ? "تعديل الدين" : "دين جديد"}
        description="من، وكم، ومتى يُسدَّد"
        start={
          <button type="button" onClick={onDone} className={navButton}>
            إلغاء
          </button>
        }
        end={
          <button type="submit" disabled={pending} className={cn(navButton, "font-semibold")}>
            {pending ? <Loader2Icon className="size-5 animate-spin" /> : "حفظ"}
          </button>
        }
      />
      <div className="flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 pb-6">
        <SegmentedControl
          label="نوع الدين"
          value={direction}
          onChange={setDirection}
          className="mx-auto mt-1 w-full max-w-xs"
          options={[
            { value: "lent", label: "لي عند شخص" },
            { value: "borrowed", label: "عليّ لشخص" },
          ]}
        />

        <AmountField
          id="debt-amount"
          name="amount"
          value={amount}
          onChange={setAmount}
          currency={cur}
          onCurrency={setCur}
          mainCurrency={currency}
          tone={direction === "lent" ? "positive" : "negative"}
          error={errors.amount?.[0]}
        />

        <div className="surface inset-list overflow-hidden">
          <TextRow label={DIRECTION_LABEL[direction]} htmlFor="debt-person">
            <input
              id="debt-person"
              name="person"
              required
              maxLength={60}
              autoComplete="off"
              placeholder="الاسم"
              value={person}
              onChange={(e) => setPerson(e.target.value)}
              aria-invalid={!!errors.person}
              className={textInput}
            />
          </TextRow>
          <TextRow label="ملاحظة" htmlFor="debt-note">
            <input
              id="debt-note"
              name="note"
              maxLength={120}
              autoComplete="off"
              placeholder="اختياري"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className={textInput}
            />
          </TextRow>
        </div>
        {errors.person && <p className="-mt-3 px-4 text-[13px] text-destructive">{errors.person[0]}</p>}

        <div className="surface inset-list overflow-hidden">
          <div className="flex items-center gap-3 ps-4">
            <CalendarDaysIcon aria-hidden className="size-[18px] shrink-0 text-foreground/70" strokeWidth={1.75} />
            <div className="list-row-body flex min-h-12 min-w-0 flex-1 items-center justify-between gap-3 py-1.5 pe-4">
              <label htmlFor="debt-date" className="text-[16px]">
                التاريخ
              </label>
              <input
                id="debt-date"
                name="date"
                type="date"
                required
                value={date}
                onChange={(e) => e.target.value && setDate(e.target.value)}
                className={dateInput}
              />
            </div>
          </div>
          <div className="flex items-center gap-3 ps-4">
            <CalendarClockIcon aria-hidden className="size-[18px] shrink-0 text-foreground/70" strokeWidth={1.75} />
            <div className="list-row-body flex min-h-12 min-w-0 flex-1 items-center justify-between gap-3 py-1.5 pe-4">
              <label htmlFor="debt-due" className="text-[16px]">
                موعد السداد
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  id="debt-due"
                  name="dueDate"
                  type="date"
                  min={date}
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className={cn(dateInput, !dueDate && "text-muted-foreground")}
                />
                {dueDate && (
                  <button
                    type="button"
                    onClick={() => setDueDate("")}
                    className="text-[13px] text-muted-foreground active:opacity-60"
                  >
                    إزالة
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        <p className="-mt-3 px-4 text-[12.5px] text-muted-foreground">
          الديون منفصلة عن المصاريف والدخل، فلا تغيّر رصيدك الشهري. سنذكّرك قبل موعد السداد إن فعّلت الإشعارات.
        </p>
      </div>
    </form>
  );
}
