import { and, between, count, desc, eq, isNull, lte, sql, sum } from "drizzle-orm";

import { income } from "@masrufi/db/pg/schema";

import type { Db } from "../database/client";
import type { Period } from "./expense-stats.model";

export type Income = typeof income.$inferSelect;
export type NewIncome = typeof income.$inferInsert;

const total = sum(income.amount).mapWith(Number);
const monthOfDate = sql<string>`to_char(${income.date}, 'YYYY-MM')`;

const active = (userId: string) => and(eq(income.userId, userId), isNull(income.deletedAt));
const owned = (userId: string, id: string) => and(active(userId), eq(income.id, id));
const within = (userId: string, { start, end }: Period) =>
  and(active(userId), between(income.date, start, end));

export class IncomeModel {
  constructor(private readonly db: Db) {}

  list(userId: string, period: Period): Promise<Income[]> {
    return this.db
      .select()
      .from(income)
      .where(within(userId, period))
      .orderBy(desc(income.date), desc(income.createdAt));
  }

  async find(userId: string, id: string): Promise<Income | undefined> {
    const [row] = await this.db.select().from(income).where(owned(userId, id));
    return row;
  }

  /** Undefined when the id is already taken. */
  async insert(values: NewIncome): Promise<Income | undefined> {
    const [row] = await this.db
      .insert(income)
      .values(values)
      .onConflictDoNothing({ target: income.id })
      .returning();
    return row;
  }

  /** Occurrences of a rule; those that already exist (even deleted ones) are skipped. */
  async insertOccurrences(values: NewIncome[]): Promise<void> {
    await this.db
      .insert(income)
      .values(values)
      .onConflictDoNothing({ target: [income.recurringId, income.date] });
  }

  async update(userId: string, id: string, values: Partial<NewIncome>): Promise<Income | undefined> {
    const [row] = await this.db.update(income).set(values).where(owned(userId, id)).returning();
    return row;
  }

  async delete(userId: string, id: string): Promise<boolean> {
    return !!(await this.update(userId, id, { deletedAt: new Date() }));
  }

  async unlinkRule(userId: string, recurringId: string): Promise<void> {
    await this.db
      .update(income)
      .set({ recurringId: null })
      .where(and(eq(income.userId, userId), eq(income.recurringId, recurringId)));
  }

  async total(userId: string, period: Period): Promise<number> {
    const [row] = await this.db.select({ total }).from(income).where(within(userId, period));
    return row.total ?? 0;
  }

  /** Everything earned up to a day, and whether any income was ever recorded. */
  async lifetime(userId: string, day: string) {
    const [earned] = await this.db
      .select({ total })
      .from(income)
      .where(and(active(userId), lte(income.date, day)));
    const [all] = await this.db.select({ entries: count() }).from(income).where(active(userId));
    return { total: earned.total ?? 0, hasIncome: all.entries > 0 };
  }

  byMonth(userId: string, period: Period) {
    return this.db
      .select({ month: monthOfDate, total })
      .from(income)
      .where(within(userId, period))
      .groupBy(monthOfDate);
  }
}
