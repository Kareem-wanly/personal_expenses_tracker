import "server-only";

import { and, eq, lte } from "drizzle-orm";

import { db } from "@/db";
import { expense, recurringExpense } from "@/db/schema";
import { dueOccurrences } from "@/lib/recurrence";

/**
 * Create the expenses of every recurring rule that is due up to `today`
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
    if (dates.length) {
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
