import type { Models } from "../models";
import type { Period } from "../models/expense-stats.model";

/** Spending per category, with a label for what has none. */
export async function categoryTotals(models: Models, userId: string, period: Period) {
  const rows = await models.expenseStats.byCategory(userId, period);
  return rows.map((row) => ({
    ...row,
    name: row.name ?? "غير مصنّف",
    icon: row.icon ?? "❔",
    color: row.color ?? "#94a3b8",
  }));
}
