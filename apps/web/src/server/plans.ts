import "server-only";

import { asc, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { type DebtDirection } from "@masrufi/core/enums";
import { debt, debtPayment, goalContribution, savingGoal } from "@masrufi/db/schema";
import { requireUser } from "@/lib/dal";
import { type DebtState, type GoalState, debtState, goalState, totalsByCurrency } from "@masrufi/core/plans";
import { exchangeRate } from "@/lib/rates";

/* Each query resolves the user itself (DAL pattern). Data per user is small
   (dozens of rows), so lists load everything and group in memory. */

export type PaymentRow = { id: string; amount: number; date: string; note: string | null };

export type DebtRow = {
  id: string;
  direction: DebtDirection;
  person: string;
  amount: number;
  currency: string;
  note: string | null;
  date: string;
  dueDate: string | null;
  paid: number;
  payments: PaymentRow[];
  state: DebtState;
};

export async function getDebts(today: string): Promise<DebtRow[]> {
  const user = await requireUser();
  const [debts, payments] = await Promise.all([
    db.select().from(debt).where(eq(debt.userId, user.id)).orderBy(asc(debt.dueDate), desc(debt.date)),
    db
      .select({
        id: debtPayment.id,
        debtId: debtPayment.debtId,
        amount: debtPayment.amount,
        date: debtPayment.date,
        note: debtPayment.note,
      })
      .from(debtPayment)
      .where(eq(debtPayment.userId, user.id))
      .orderBy(desc(debtPayment.date), desc(debtPayment.createdAt)),
  ]);

  const byDebt = Map.groupBy(payments, (p) => p.debtId);
  return debts
    .map((d) => {
      const list = (byDebt.get(d.id) ?? []).map((p) => ({ id: p.id, amount: p.amount, date: p.date, note: p.note }));
      const paid = list.reduce((s, p) => s + p.amount, 0);
      return {
        id: d.id,
        direction: d.direction,
        person: d.person,
        amount: d.amount,
        currency: d.currency,
        note: d.note,
        date: d.date,
        dueDate: d.dueDate,
        paid,
        payments: list,
        state: debtState({ amount: d.amount, paid, dueDate: d.dueDate, settledAt: d.settledAt }, today),
      };
    })
    .sort((a, b) => {
      // Open first; overdue / soonest due first; no due date last.
      if (a.state.settled !== b.state.settled) return a.state.settled ? 1 : -1;
      const da = a.state.dueIn ?? Infinity;
      const dbb = b.state.dueIn ?? Infinity;
      return da - dbb || b.date.localeCompare(a.date);
    });
}

export type ContributionRow = PaymentRow;

export type GoalRow = {
  id: string;
  name: string;
  icon: string;
  target: number;
  currency: string;
  deadline: string | null;
  saved: number;
  contributions: ContributionRow[];
  state: GoalState;
  achievedAt: Date | null;
};

export async function getGoals(today: string): Promise<GoalRow[]> {
  const user = await requireUser();
  const [goals, contributions] = await Promise.all([
    db.select().from(savingGoal).where(eq(savingGoal.userId, user.id)).orderBy(asc(savingGoal.createdAt)),
    db
      .select({
        id: goalContribution.id,
        goalId: goalContribution.goalId,
        amount: goalContribution.amount,
        date: goalContribution.date,
        note: goalContribution.note,
      })
      .from(goalContribution)
      .where(eq(goalContribution.userId, user.id))
      .orderBy(desc(goalContribution.date), desc(goalContribution.createdAt)),
  ]);

  const byGoal = Map.groupBy(contributions, (c) => c.goalId);
  return goals
    .map((g) => {
      const list = (byGoal.get(g.id) ?? []).map((c) => ({ id: c.id, amount: c.amount, date: c.date, note: c.note }));
      const saved = list.reduce((s, c) => s + c.amount, 0);
      const start = g.createdAt.toISOString().slice(0, 10);
      return {
        id: g.id,
        name: g.name,
        icon: g.icon,
        target: g.target,
        currency: g.currency,
        deadline: g.deadline,
        saved,
        contributions: list,
        achievedAt: g.achievedAt,
        state: goalState({ target: g.target, saved, deadline: g.deadline, start }, today),
      };
    })
    .sort((a, b) => Number(a.state.achieved) - Number(b.state.achieved));
}

/**
 * One approximate figure in the user's currency for amounts held in several
 * currencies (e.g. "100 $ · 50 €" ≈ 160 $). Null when there's nothing to
 * convert, or a rate is unavailable (never show a half-converted sum).
 */
export async function approxTotal(totals: { currency: string; total: number }[], main: string) {
  if (!totals.length || totals.every((t) => t.currency === main)) return null;
  const rates = await Promise.all(totals.map((t) => exchangeRate(t.currency, main)));
  if (rates.some((r) => r === null)) return null;
  return Math.round(totals.reduce((sum, t, i) => sum + t.total * rates[i]!, 0));
}

/** Compact numbers for the home screen tiles. */
export async function getPlansSummary(today: string) {
  const [debts, goals] = await Promise.all([getDebts(today), getGoals(today)]);
  const open = debts.filter((d) => !d.state.settled);
  const remaining = (d: DebtRow) => ({ currency: d.currency, amount: d.state.remaining });
  const active = goals.filter((g) => !g.state.achieved);
  return {
    debts: {
      count: open.length,
      overdue: open.filter((d) => d.state.overdue).length,
      owedToMe: totalsByCurrency(open.filter((d) => d.direction === "lent"), remaining),
      iOwe: totalsByCurrency(open.filter((d) => d.direction === "borrowed"), remaining),
    },
    goals: {
      count: goals.length,
      active: active.length,
      achieved: goals.length - active.length,
      saved: totalsByCurrency(goals, (g) => ({ currency: g.currency, amount: g.saved })),
      /** The active goal closest to done, to show on the tile. */
      next: active.toSorted((a, b) => b.state.ratio - a.state.ratio)[0] ?? null,
    },
  };
}

export type PlansSummary = Awaited<ReturnType<typeof getPlansSummary>>;
