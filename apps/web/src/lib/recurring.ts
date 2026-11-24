import "server-only";

import { and, eq, lte } from "drizzle-orm";

import { db } from "@/db";
import { expense, income, recurringExpense } from "@masrufi/db/schema";
import { dueOccurrences } from "@masrufi/core/recurrence";

/**
 * Create the expenses (or income, for income rules such as a monthly
 * salary) of every recurring rule that is due up to `today`
 * (catching up on missed periods) and move each rule's `nextDate` forward.
 *
 * Idempotent: the unique (recurring_id, date) index turns a concurrent
 * double run into a no-op. Cheap when nothing is due (one indexed SELECT),
 * so it runs on page loads as well as from the daily cron.
 */
export async function materializeRecurring(userId: string, today: string): Promise<number> {
  const rules = await db
    .select()
    .from(recurringExpense)
    .where(
      and(
        eq(recurringExpense.userId, userId),
        eq(recurringExpense.active, true),
        lte(recurringExpense.nextDate, today),
      ),
    );

  let created = 0;
  for (const rule of rules) {
    const { dates, next } = dueOccurrences(rule, today);
    if (dates.length && rule.kind === "income") {
      const res = await db
        .insert(income)
        .values(
          dates.map((date) => ({
            userId,
            amount: rule.amount,
            source: rule.source ?? "salary",
            note: rule.note,
            date,
            recurringId: rule.id,
          })),
        )
        .onConflictDoNothing();
      created += res.rowsAffected;
    } else if (dates.length) {
      const res = await db
        .insert(expense)
        .values(
          dates.map((date) => ({
            userId,
            categoryId: rule.categoryId,
            amount: rule.amount,
            note: rule.note,
            paymentMethod: rule.paymentMethod,
            date,
            recurringId: rule.id,
          })),
        )
        .onConflictDoNothing();
      created += res.rowsAffected;
    }
    await db
      .update(recurringExpense)
      .set({ nextDate: next })
      .where(eq(recurringExpense.id, rule.id));
  }
  return created;
}
