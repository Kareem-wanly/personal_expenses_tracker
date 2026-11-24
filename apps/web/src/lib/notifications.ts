import "server-only";

import { and, between, desc, eq, sql, sum } from "drizzle-orm";

import { db } from "@/db";
import { category, expense } from "@masrufi/db/schema";
import { monthOf, monthRange, shiftMonth } from "@masrufi/core/dates";
import { type PushPayload, monthSummary } from "@masrufi/core/notifications";

export * from "@masrufi/core/notifications";

export async function monthTotal(userId: string, month: string) {
  const { start, end } = monthRange(month);
  const [row] = await db
    .select({ total: sum(expense.amount).mapWith(Number) })
    .from(expense)
    .where(and(eq(expense.userId, userId), between(expense.date, start, end)));
  return row?.total ?? 0;
}

export async function categoryMonthTotal(userId: string, categoryId: string, month: string) {
  const { start, end } = monthRange(month);
  const [row] = await db
    .select({ total: sum(expense.amount).mapWith(Number) })
    .from(expense)
    .where(
      and(
        eq(expense.userId, userId),
        eq(expense.categoryId, categoryId),
        between(expense.date, start, end),
      ),
    );
  return row?.total ?? 0;
}

export async function hasExpenseOn(userId: string, date: string) {
  const row = await db.query.expense.findFirst({
    where: and(eq(expense.userId, userId), eq(expense.date, date)),
    columns: { id: true },
  });
  return !!row;
}

/** Summary of the month that just ended (sent on the 1st). */
export async function monthlySummary(
  userId: string,
  currency: string,
  today: string,
): Promise<PushPayload | null> {
  const month = shiftMonth(monthOf(today), -1);
  const [total, prevTotal] = await Promise.all([
    monthTotal(userId, month),
    monthTotal(userId, shiftMonth(month, -1)),
  ]);
  if (total === 0) return null;

  const { start, end } = monthRange(month);
  const [top] = await db
    .select({ name: category.name, icon: category.icon })
    .from(expense)
    .leftJoin(category, eq(expense.categoryId, category.id))
    .where(and(eq(expense.userId, userId), between(expense.date, start, end)))
    .groupBy(expense.categoryId)
    .orderBy(desc(sql`sum(${expense.amount})`))
    .limit(1);

  return monthSummary({ month, total, prevTotal, top, currency });
}
