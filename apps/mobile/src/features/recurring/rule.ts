import type { RecurringRow } from "@masrufi/contracts/api/responses";
import { INCOME_SOURCE_META } from "@masrufi/core/constants";

export function describeRule(rule: RecurringRow): string {
  if (rule.note) return rule.note;
  if (rule.kind === "income") return INCOME_SOURCE_META[rule.source ?? "salary"].label;
  return rule.category?.name ?? "مصروف متكرر";
}

type Cost = Pick<RecurringRow, "kind" | "active" | "amount" | "frequency">;

/** What active expense rules cost in an average month. */
export function monthlyExpenses(rules: Cost[]): number {
  const total = rules
    .filter(({ kind, active }) => kind === "expense" && active)
    .reduce((sum, { amount, frequency }) => {
      if (frequency === "weekly") return sum + (amount * 52) / 12;
      return sum + (frequency === "yearly" ? amount / 12 : amount);
    }, 0);
  return Math.round(total);
}
