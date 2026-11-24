import { and, between, desc, eq, ilike, isNull } from "drizzle-orm";

import { category, expense } from "@masrufi/db/pg/schema";

import type { Db } from "../database/client";
import { escapeLike } from "./helpers";

export type Expense = typeof expense.$inferSelect;
export type NewExpense = typeof expense.$inferInsert;

/** An expense with the label of its category, as lists show it. */
export const expenseRow = {
  expense,
  category: { name: category.name, icon: category.icon, color: category.color },
};

export type ExpenseRow = {
  expense: Expense;
  category: { name: string; icon: string; color: string } | null;
};

type Filters = { start: string; end: string; q?: string; categoryId?: string };

const owned = (userId: string, id: string) =>
  and(eq(expense.id, id), eq(expense.userId, userId), isNull(expense.deletedAt));

export class ExpenseModel {
  constructor(private readonly db: Db) {}

  list(userId: string, filters: Filters): Promise<ExpenseRow[]> {
    const { start, end, q, categoryId } = filters;
    return this.db
      .select(expenseRow)
      .from(expense)
      .leftJoin(category, eq(expense.categoryId, category.id))
      .where(
        and(
          eq(expense.userId, userId),
          isNull(expense.deletedAt),
          between(expense.date, start, end),
          q ? ilike(expense.note, `%${escapeLike(q)}%`) : undefined,
          categoryId === "none" ? isNull(expense.categoryId) : undefined,
          categoryId && categoryId !== "none" ? eq(expense.categoryId, categoryId) : undefined,
        ),
      )
      .orderBy(desc(expense.date), desc(expense.createdAt));
  }

  latest(userId: string, limit: number): Promise<ExpenseRow[]> {
    return this.db
      .select(expenseRow)
      .from(expense)
      .leftJoin(category, eq(expense.categoryId, category.id))
      .where(and(eq(expense.userId, userId), isNull(expense.deletedAt)))
      .orderBy(desc(expense.date), desc(expense.createdAt))
      .limit(limit);
  }

  async find(userId: string, id: string): Promise<Expense | undefined> {
    const [row] = await this.db.select().from(expense).where(owned(userId, id));
    return row;
  }

  /** Undefined when the id is already taken. */
  async insert(values: NewExpense): Promise<Expense | undefined> {
    const [row] = await this.db
      .insert(expense)
      .values(values)
      .onConflictDoNothing({ target: expense.id })
      .returning();
    return row;
  }

  /** Occurrences of a rule; those that already exist (even deleted ones) are skipped. */
  async insertOccurrences(values: NewExpense[]): Promise<void> {
    await this.db
      .insert(expense)
      .values(values)
      .onConflictDoNothing({ target: [expense.recurringId, expense.date] });
  }

  async update(userId: string, id: string, values: Partial<NewExpense>): Promise<Expense | undefined> {
    const [row] = await this.db.update(expense).set(values).where(owned(userId, id)).returning();
    return row;
  }

  async delete(userId: string, id: string): Promise<boolean> {
    return !!(await this.update(userId, id, { deletedAt: new Date() }));
  }

  async clearCategory(userId: string, categoryId: string): Promise<void> {
    await this.db
      .update(expense)
      .set({ categoryId: null })
      .where(and(eq(expense.userId, userId), eq(expense.categoryId, categoryId)));
  }

  async unlinkRule(userId: string, recurringId: string): Promise<void> {
    await this.db
      .update(expense)
      .set({ recurringId: null })
      .where(and(eq(expense.userId, userId), eq(expense.recurringId, recurringId)));
  }
}
