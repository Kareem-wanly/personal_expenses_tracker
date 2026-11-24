import { and, avg, between, count, desc, eq, isNotNull, isNull, lte, max, sql, sum } from "drizzle-orm";

import { category, expense } from "@masrufi/db/pg/schema";

import type { Db } from "../database/client";
import { type ExpenseRow, expenseRow } from "./expense.model";

export type Period = { start: string; end: string };

const total = sum(expense.amount).mapWith(Number);
const trimmedNote = sql<string>`trim(${expense.note})`;
const monthOfDate = sql<string>`to_char(${expense.date}, 'YYYY-MM')`;

const within = (userId: string, { start, end }: Period) =>
  and(eq(expense.userId, userId), isNull(expense.deletedAt), between(expense.date, start, end));

/** Totals and rankings used by the dashboard, reports and insights. */
export class ExpenseStatsModel {
  constructor(private readonly db: Db) {}

  async total(userId: string, period: Period): Promise<number> {
    const [row] = await this.db.select({ total }).from(expense).where(within(userId, period));
    return row.total ?? 0;
  }

  async totalUntil(userId: string, day: string): Promise<number> {
    const [row] = await this.db
      .select({ total })
      .from(expense)
      .where(and(eq(expense.userId, userId), isNull(expense.deletedAt), lte(expense.date, day)));
    return row.total ?? 0;
  }

  byCategory(userId: string, period: Period) {
    return this.db
      .select({
        categoryId: expense.categoryId,
        name: category.name,
        icon: category.icon,
        color: category.color,
        budget: category.budget,
        total,
        count: count(),
      })
      .from(expense)
      .leftJoin(category, eq(expense.categoryId, category.id))
      .where(within(userId, period))
      .groupBy(expense.categoryId, category.id)
      .orderBy(desc(total));
  }

  byDay(userId: string, period: Period) {
    return this.db
      .select({ date: expense.date, total })
      .from(expense)
      .where(within(userId, period))
      .groupBy(expense.date);
  }

  byMonth(userId: string, period: Period) {
    return this.db
      .select({ month: monthOfDate, total })
      .from(expense)
      .where(within(userId, period))
      .groupBy(monthOfDate);
  }

  byPaymentMethod(userId: string, period: Period) {
    return this.db
      .select({ method: expense.paymentMethod, total })
      .from(expense)
      .where(within(userId, period))
      .groupBy(expense.paymentMethod);
  }

  largest(userId: string, period: Period, limit: number): Promise<ExpenseRow[]> {
    return this.db
      .select(expenseRow)
      .from(expense)
      .leftJoin(category, eq(expense.categoryId, category.id))
      .where(within(userId, period))
      .orderBy(desc(expense.amount))
      .limit(limit);
  }

  /** Notes repeated most often ("قهوة" × 12). */
  repeatedNotes(userId: string, period: Period, limit: number) {
    return this.db
      .select({ label: trimmedNote, count: count(), total })
      .from(expense)
      .where(and(within(userId, period), isNotNull(expense.note), sql`${trimmedNote} <> ''`))
      .groupBy(trimmedNote)
      .orderBy(desc(count()))
      .limit(limit);
  }

  async summary(userId: string, period: Period) {
    const [row] = await this.db
      .select({
        average: avg(expense.amount).mapWith(Number),
        largest: max(expense.amount),
        spendingDays: sql<number>`count(distinct ${expense.date})::int`,
      })
      .from(expense)
      .where(within(userId, period));
    return row;
  }
}
