"use client";

import { CalendarClockIcon, Loader2Icon, PencilLineIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useActionState, useState, useTransition } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/empty-state";
import { LedgerMeter, LedgerRows } from "@/components/ledger";
import { PageHeader } from "@/components/layout/page-header";
import { Reveal } from "@/components/motion/reveal";
import { DeleteButton } from "@/components/plans/debts-view";
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
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { formatMonthLabel, formatShortDate, toISODate } from "@masrufi/core/dates";
import { formatMoney, fromMinor } from "@masrufi/core/money";
import { cn } from "@/lib/utils";
import type { ActionState } from "@masrufi/contracts/validations";
import { addContribution, deleteContribution, deleteGoal, saveGoal } from "@/server/plans-actions";
import type { GoalRow } from "@/server/plans";

type Sheet = { kind: "new" } | { kind: "edit"; id: string } | { kind: "view"; id: string } | null;

const GOAL_ICONS = ["🎯", "🚗", "🏠", "✈️", "💍", "🎓", "💻", "📱", "🛋️", "👶", "🕋", "🏥", "💼", "🎁", "🐑", "💰"];

/** One line under a goal: what it takes to get there. */
function goalHint(g: GoalRow) {
  const s = g.state;
  if (s.achieved) return "تحقّق الهدف 🎉";
  if (s.late) return `فات الموعد — بقي ${formatMoney(s.remaining, g.currency)}`;
  if (s.perMonth !== null && g.deadline) {
    return `ادّخر ${formatMoney(s.perMonth, g.currency)} شهرياً حتى ${formatMonthLabel(g.deadline.slice(0, 7))}`;
  }
  return `بقي ${formatMoney(s.remaining, g.currency)}`;
}

export function GoalsView({
  goals,
  currency,
  approxSaved,
}: {
  goals: GoalRow[];
  currency: string;
  /** Savings across currencies in the user's currency (null = not needed / unavailable). */
  approxSaved: number | null;
}) {
  const [sheet, setSheet] = useState<Sheet>(null);
  const current = sheet && sheet.kind !== "new" ? goals.find((g) => g.id === sheet.id) : undefined;
  const saved = new Map<string, number>();
  for (const g of goals) saved.set(g.currency, (saved.get(g.currency) ?? 0) + g.saved);
  const achieved = goals.filter((g) => g.state.achieved).length;

  return (
    <div className="space-y-7">
      <div>
        <BackLink />
        <PageHeader
          className="pt-2"
          title="الأهداف"
          subtitle="ادّخر لما تريده خطوة بخطوة"
          action={
            <button
              type="button"
              onClick={() => setSheet({ kind: "new" })}
              aria-label="هدف جديد"
              className="pressable flex size-10 items-center justify-center rounded-full bg-ink text-ink-foreground"
            >
              <PlusIcon className="size-5" />
            </button>
          }
        />
      </div>

      {goals.length === 0 ? (
        <Reveal index={0}>
          <EmptyState
            title="لا أهداف بعد"
            description="سيارة، سفر، عرس… حدّد المبلغ والموعد، ونحسب لك كم تدّخر كل شهر."
            action={
              <button
                type="button"
                onClick={() => setSheet({ kind: "new" })}
                className="tint-button h-10 px-4 text-[15px] font-semibold"
              >
                أضف أول هدف
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
                    label: "مدّخر لأهدافك",
                    value: [...saved].map(([c, t]) => formatMoney(t, c)).join(" · ") || "—",
                    hint: approxSaved !== null ? `≈ ${formatMoney(approxSaved, currency)} بسعر اليوم` : undefined,
                  },
                  { label: "أهداف تحقّقت", value: `${achieved} من ${goals.length}`, tone: achieved ? "positive" : "muted" },
                ]}
              />
            </div>
          </Reveal>
          <div className="space-y-3">
            {goals.map((g, i) => (
              <Reveal key={g.id} index={Math.min(i + 1, 4)}>
                <button
                  type="button"
                  onClick={() => setSheet({ kind: "view", id: g.id })}
                  className="surface block w-full p-4 text-start transition-colors active:bg-foreground/[0.04]"
                >
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden
                      className="flex size-11 shrink-0 items-center justify-center rounded-[12px] bg-foreground/[0.045] text-[24px] ring-1 ring-inset ring-hairline"
                    >
                      {g.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[17px] font-semibold">{g.name}</p>
                      <p className="text-[13px] text-muted-foreground tabular">
                        {formatMoney(g.saved, g.currency)} من {formatMoney(g.target, g.currency)}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "font-display text-[20px] font-semibold tabular",
                        g.state.achieved && "text-positive",
                      )}
                    >
                      {Math.round(g.state.ratio * 100)}%
                    </span>
                  </div>
                  <div className="mt-3">
                    <GoalMeter goal={g} />
                  </div>
                  <p
                    className={cn(
                      "mt-2 text-[13px]",
                      g.state.achieved ? "text-positive" : g.state.late ? "text-warning" : "text-muted-foreground",
                    )}
                  >
                    {goalHint(g)}
                  </p>
                </button>
              </Reveal>
            ))}
          </div>
        </>
      )}

      <Drawer open={!!sheet} onOpenChange={(next) => !next && setSheet(null)} showSwipeHandle>
        <DrawerContent className={sheetContentClass}>
          {sheet?.kind === "new" && <GoalForm key="new" currency={currency} onDone={() => setSheet(null)} />}
          {sheet?.kind === "edit" && current && (
            <GoalForm
              key={`edit-${current.id}`}
              goal={current}
              currency={currency}
              onDone={() => setSheet({ kind: "view", id: current.id })}
            />
          )}
          {sheet?.kind === "view" && current && (
            <GoalDetail
              key={`view-${current.id}`}
              goal={current}
              onEdit={() => setSheet({ kind: "edit", id: current.id })}
              onClose={() => setSheet(null)}
            />
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
}

/** Ledger meter; the notch shows where you'd be if saving evenly until the deadline. */
function GoalMeter({ goal }: { goal: GoalRow }) {
  // Saving is good: never paint it as "over budget".
  const ratio = goal.state.achieved ? 0.999 : goal.state.ratio;
  return <LedgerMeter ratio={ratio} pace={goal.state.pace ?? undefined} label={`تقدّم هدف ${goal.name}`} />;
}

/* -------------------------------- Details -------------------------------- */

function GoalDetail({ goal, onEdit, onClose }: { goal: GoalRow; onEdit: () => void; onClose: () => void }) {
  const [state, dispatch, pending] = useActionState<ActionState, FormData>(addContribution, { ok: false });
  const [, startTransition] = useTransition();
  const [busy, startBusy] = useTransition();
  const [kind, setKind] = useState<"deposit" | "withdraw">("deposit");
  const [amount, setAmount] = useState("");
  const today = toISODate(new Date());
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

  const s = goal.state;
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SheetNav
        title={goal.name}
        description="تقدّم الهدف والإيداعات"
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
          <span aria-hidden className="text-[40px] leading-none">
            {goal.icon}
          </span>
          <p className={cn("mt-2 font-display text-[44px] font-semibold leading-none tabular", s.achieved && "text-positive")}>
            {formatMoney(goal.saved, goal.currency)}
          </p>
          <p className="mt-1.5 text-[13px] text-muted-foreground">
            من {formatMoney(goal.target, goal.currency)} · {Math.round(s.ratio * 100)}%
          </p>
        </div>
        <GoalMeter goal={goal} />

        <div className="surface px-4 py-4">
          <LedgerRows
            rows={[
              { label: "المتبقّي", value: formatMoney(s.remaining, goal.currency), tone: s.achieved ? "positive" : "default" },
              ...(goal.deadline
                ? [
                    { label: "الموعد", value: formatShortDate(goal.deadline), tone: s.late ? ("warning" as const) : ("default" as const) },
                    ...(s.perMonth !== null
                      ? [{ label: s.late ? "مطلوب الآن" : "المطلوب شهرياً", value: formatMoney(s.perMonth, goal.currency) }]
                      : []),
                  ]
                : []),
            ]}
          />
        </div>

        <form onSubmit={submitWith(dispatch, startTransition)} className="surface space-y-3 p-4">
          <input type="hidden" name="goalId" value={goal.id} />
          <input type="hidden" name="kind" value={kind} />
          <input type="hidden" name="date" value={today} />
          <SegmentedControl
            label="نوع العملية"
            value={kind}
            onChange={setKind}
            options={[
              { value: "deposit", label: "إيداع" },
              { value: "withdraw", label: "سحب" },
            ]}
          />
          <div className="flex items-center gap-2">
            <input
              name="amount"
              inputMode="decimal"
              dir="ltr"
              autoComplete="off"
              required
              placeholder={s.perMonth ? String(fromMinor(s.perMonth)) : "0"}
              aria-label={kind === "deposit" ? "مبلغ الإيداع" : "مبلغ السحب"}
              aria-invalid={!!state.fieldErrors?.amount}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-11 min-w-0 flex-1 rounded-[12px] bg-foreground/[0.05] px-3 text-center text-[17px] font-semibold tabular outline-none ring-1 ring-inset ring-hairline focus:ring-2 focus:ring-ring"
            />
            <span dir="ltr" className="text-[13px] font-semibold text-muted-foreground">
              {goal.currency}
            </span>
            <button
              type="submit"
              disabled={pending || !amount}
              className="tint-button flex h-11 items-center justify-center gap-2 px-4 text-[15px] font-semibold disabled:opacity-60"
            >
              {pending && <Loader2Icon className="size-4 animate-spin" />}
              {kind === "deposit" ? "أضف" : "اسحب"}
            </button>
          </div>
        </form>

        {goal.contributions.length > 0 && (
          <section className="space-y-2">
            <h3 className="px-1 text-[13px] font-medium text-muted-foreground">السجلّ</h3>
            <div className="surface inset-list overflow-hidden">
              {goal.contributions.map((c) => (
                <div key={c.id} className="flex items-center gap-3 ps-4">
                  <div className="list-row-body flex min-h-12 min-w-0 flex-1 items-center gap-3 py-2 pe-2">
                    <div className="min-w-0 flex-1">
                      <p className={cn("text-[15px] font-semibold tabular", c.amount < 0 ? "text-negative" : "text-positive")}>
                        <span dir="ltr">{c.amount < 0 ? "−" : "+"}</span>
                        {formatMoney(Math.abs(c.amount), goal.currency)}
                      </p>
                      <p className="truncate text-[12.5px] text-muted-foreground">
                        {[formatShortDate(c.date), c.note].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => run(() => deleteContribution(c.id))}
                      aria-label="حذف"
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
          label="حذف الهدف"
          title={`حذف «${goal.name}»؟`}
          description="سيُحذف الهدف وسجلّ إيداعاته. لا يمكن التراجع."
          onConfirm={() => run(() => deleteGoal(goal.id), onClose)}
        />
      </div>
    </div>
  );
}

/* ---------------------------------- Form --------------------------------- */

function GoalForm({ goal, currency, onDone }: { goal?: GoalRow; currency: string; onDone: () => void }) {
  const [state, dispatch, pending] = useActionState<ActionState, FormData>(saveGoal, { ok: false });
  const [, startTransition] = useTransition();
  useActionResult(state, onDone);

  const [name, setName] = useState(goal?.name ?? "");
  const [icon, setIcon] = useState(goal?.icon ?? GOAL_ICONS[0]);
  const [target, setTarget] = useState(goal ? String(fromMinor(goal.target)) : "");
  const [cur, setCur] = useState(goal?.currency ?? currency);
  const [deadline, setDeadline] = useState(goal?.deadline ?? "");
  const [initial, setInitial] = useState("");
  const errors = state.fieldErrors ?? {};

  return (
    <form onSubmit={submitWith(dispatch, startTransition)} className="flex min-h-0 flex-1 flex-col">
      {goal && <input type="hidden" name="id" value={goal.id} />}
      <input type="hidden" name="icon" value={icon} />
      <SheetNav
        title={goal ? "تعديل الهدف" : "هدف جديد"}
        description="الاسم والمبلغ والموعد"
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
        <AmountField
          id="goal-target"
          name="target"
          label="المبلغ المطلوب"
          value={target}
          onChange={setTarget}
          currency={cur}
          onCurrency={setCur}
          mainCurrency={currency}
          error={errors.target?.[0]}
        />

        <div className="surface inset-list overflow-hidden">
          <TextRow label="الهدف" htmlFor="goal-name">
            <input
              id="goal-name"
              name="name"
              required
              maxLength={40}
              autoComplete="off"
              placeholder="مثال: سيارة"
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-invalid={!!errors.name}
              className={textInput}
            />
          </TextRow>
          <div className="flex items-center gap-3 ps-4">
            <CalendarClockIcon aria-hidden className="size-[18px] shrink-0 text-foreground/70" strokeWidth={1.75} />
            <div className="list-row-body flex min-h-12 min-w-0 flex-1 items-center justify-between gap-3 py-1.5 pe-4">
              <label htmlFor="goal-deadline" className="text-[16px]">
                الموعد
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  id="goal-deadline"
                  name="deadline"
                  type="date"
                  min={toISODate(new Date())}
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className={cn(dateInput, !deadline && "text-muted-foreground")}
                />
                {deadline && (
                  <button
                    type="button"
                    onClick={() => setDeadline("")}
                    className="text-[13px] text-muted-foreground active:opacity-60"
                  >
                    إزالة
                  </button>
                )}
              </div>
            </div>
          </div>
          {!goal && (
            <TextRow label="مدّخر حالياً" htmlFor="goal-initial">
              <input
                id="goal-initial"
                name="initial"
                inputMode="decimal"
                dir="ltr"
                autoComplete="off"
                placeholder="0"
                value={initial}
                onChange={(e) => setInitial(e.target.value)}
                className={cn(textInput, "text-left tabular")}
              />
            </TextRow>
          )}
        </div>
        {errors.name && <p className="-mt-3 px-4 text-[13px] text-destructive">{errors.name[0]}</p>}

        <fieldset>
          <legend className="mb-2 px-1 text-[13px] font-medium text-muted-foreground">الأيقونة</legend>
          <div className="surface grid grid-cols-8 gap-2 p-3">
            {GOAL_ICONS.map((ic) => (
              <label key={ic} className="flex cursor-pointer items-center justify-center">
                <input
                  type="radio"
                  name="icon-choice"
                  value={ic}
                  checked={icon === ic}
                  onChange={() => setIcon(ic)}
                  className="peer sr-only"
                />
                <span
                  className={cn(
                    "flex size-10 items-center justify-center rounded-[10px] text-[22px] transition-shadow peer-focus-visible:ring-2 peer-focus-visible:ring-ring",
                    icon === ic ? "bg-card shadow-[inset_0_0_0_2px_var(--ink)]" : "bg-foreground/[0.04]",
                  )}
                >
                  {ic}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>
    </form>
  );
}
