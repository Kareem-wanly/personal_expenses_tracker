import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { category, expense, income, passkey, pushSubscription, recurringExpense } from "@/db/schema";

/**
 * Delete every row the app owns for a user. Run before Better Auth removes
 * the user itself. Explicit (rather than relying on ON DELETE CASCADE)
 * because SQLite only cascades when foreign-key enforcement is on.
 * Order matters: expenses and incomes reference recurring rules (without
 * ON DELETE SET NULL — drizzle-kit drops it on ALTER TABLE ADD COLUMN), so
 * they go before the rules; expenses also reference categories.
 */
export async function purgeUserData(userId: string) {
  await db.batch([
    db.delete(expense).where(eq(expense.userId, userId)),
    db.delete(income).where(eq(income.userId, userId)),
    db.delete(recurringExpense).where(eq(recurringExpense.userId, userId)),
    db.delete(category).where(eq(category.userId, userId)),
    db.delete(pushSubscription).where(eq(pushSubscription.userId, userId)),
    db.delete(passkey).where(eq(passkey.userId, userId)),
  ]);
}
