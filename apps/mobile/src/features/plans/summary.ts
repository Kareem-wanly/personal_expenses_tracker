import type { DebtDetails, GoalDetails } from "@masrufi/contracts/api/responses";
import { formatMoney } from "@masrufi/core/money";
import { totalsByCurrency } from "@masrufi/core/plans";

export type CurrencyTotal = { currency: string; total: number };

/** "100 US$ · 50 €" */
export const moneyList = (totals: CurrencyTotal[]) =>
  totals.map(({ currency, total }) => formatMoney(total, currency)).join(" · ");

const remaining = (debt: DebtDetails) => ({ currency: debt.currency, amount: debt.state.remaining });

export function summarizeDebts(debts: DebtDetails[]) {
  const open = debts.filter((debt) => !debt.state.settled);
  const lent = open.filter((debt) => debt.direction === "lent");
  const borrowed = open.filter((debt) => debt.direction === "borrowed");
  return {
    lent,
    borrowed,
    settled: debts.filter((debt) => debt.state.settled),
    overdue: open.filter((debt) => debt.state.overdue).length,
    owedToMe: totalsByCurrency(lent, remaining),
    iOwe: totalsByCurrency(borrowed, remaining),
  };
}

export function summarizeGoals(goals: GoalDetails[]) {
  const active = goals.filter((goal) => !goal.state.achieved);
  const [closest] = [...active].sort((a, b) => b.state.ratio - a.state.ratio);
  return {
    achieved: goals.length - active.length,
    saved: totalsByCurrency(goals, (goal) => ({ currency: goal.currency, amount: goal.saved })),
    closest,
  };
}

/** One figure for several currencies; null when not needed or a rate is missing (never half a sum). */
export function approximate(totals: CurrencyTotal[], main: string, rates: (number | null)[]): number | null {
  if (totals.every(({ currency }) => currency === main)) return null;
  if (rates.length !== totals.length || rates.some((rate) => rate === null)) return null;
  return Math.round(totals.reduce((sum, { total }, index) => sum + total * rates[index]!, 0));
}
