import { and, asc, desc, eq, isNull, lte } from "drizzle-orm";

import { category, recurringRule } from "@masrufi/db/pg/schema";

import type { Db } from "../database/client";

export type RecurringRule = typeof recurringRule.$inferSelect;
type NewRule = typeof recurringRule.$inferInsert;

const active = (userId: string) =>
  and(eq(recurringRule.userId, userId), isNull(recurringRule.deletedAt));
const owned = (userId: string, id: string) => and(active(userId), eq(recurringRule.id, id));

export class RecurringModel {
  constructor(private readonly db: Db) {}

  list(userId: string) {
    return this.db
      .select({
        rule: recurringRule,
        category: { name: category.name, icon: category.icon, color: category.color },
      })
      .from(recurringRule)
      .leftJoin(category, eq(recurringRule.categoryId, category.id))
      .where(active(userId))
      .orderBy(desc(recurringRule.active), asc(recurringRule.nextDate));
  }

  /** Active rules with an occurrence still to be created. */
  due(userId: string, today: string): Promise<RecurringRule[]> {
    return this.db
      .select()
      .from(recurringRule)
      .where(and(active(userId), eq(recurringRule.active, true), lte(recurringRule.nextDate, today)));
  }

  activeExpenseRules(userId: string): Promise<RecurringRule[]> {
    return this.db
      .select()
      .from(recurringRule)
      .where(and(active(userId), eq(recurringRule.active, true), eq(recurringRule.kind, "expense")));
  }

  async find(userId: string, id: string): Promise<RecurringRule | undefined> {
    const [row] = await this.db.select().from(recurringRule).where(owned(userId, id));
    return row;
  }

  /** Inside a transaction: two requests never create the same occurrences at once. */
  async lock(userId: string, id: string): Promise<RecurringRule | undefined> {
    const [row] = await this.db.select().from(recurringRule).where(owned(userId, id)).for("update");
    return row;
  }

  async insert(values: NewRule): Promise<RecurringRule> {
    const [row] = await this.db.insert(recurringRule).values(values).returning();
    return row;
  }

  async update(userId: string, id: string, values: Partial<NewRule>): Promise<RecurringRule | undefined> {
    const [row] = await this.db.update(recurringRule).set(values).where(owned(userId, id)).returning();
    return row;
  }

  async delete(userId: string, id: string): Promise<boolean> {
    return !!(await this.update(userId, id, { deletedAt: new Date(), active: false }));
  }

  async clearCategory(userId: string, categoryId: string): Promise<void> {
    await this.db
      .update(recurringRule)
      .set({ categoryId: null })
      .where(and(eq(recurringRule.userId, userId), eq(recurringRule.categoryId, categoryId)));
  }
}
