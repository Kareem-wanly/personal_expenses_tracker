import { and, asc, count, eq, inArray, isNull, max } from "drizzle-orm";

import { category, expense } from "@masrufi/db/pg/schema";

import type { Db } from "../database/client";

export type Category = typeof category.$inferSelect;
type NewCategory = typeof category.$inferInsert;

const owned = (userId: string, id: string) =>
  and(eq(category.id, id), eq(category.userId, userId), isNull(category.deletedAt));

export class CategoryModel {
  constructor(private readonly db: Db) {}

  /** Every category with how many expenses use it. */
  list(userId: string) {
    return this.db
      .select({ category, expenseCount: count(expense.id) })
      .from(category)
      .leftJoin(expense, and(eq(expense.categoryId, category.id), isNull(expense.deletedAt)))
      .where(and(eq(category.userId, userId), isNull(category.deletedAt)))
      .groupBy(category.id)
      .orderBy(asc(category.sortOrder), asc(category.createdAt));
  }

  async find(userId: string, id: string): Promise<Category | undefined> {
    const [row] = await this.db.select().from(category).where(owned(userId, id));
    return row;
  }

  async countOwned(userId: string, ids: string[]): Promise<number> {
    const [row] = await this.db
      .select({ total: count() })
      .from(category)
      .where(and(eq(category.userId, userId), inArray(category.id, ids), isNull(category.deletedAt)));
    return row.total;
  }

  async nextSortOrder(userId: string): Promise<number> {
    const [row] = await this.db
      .select({ last: max(category.sortOrder) })
      .from(category)
      .where(eq(category.userId, userId));
    return (row.last ?? 0) + 1;
  }

  /** Undefined when the id is already taken. */
  async insert(values: NewCategory): Promise<Category | undefined> {
    const [row] = await this.db
      .insert(category)
      .values(values)
      .onConflictDoNothing({ target: category.id })
      .returning();
    return row;
  }

  async update(userId: string, id: string, values: Partial<NewCategory>): Promise<Category | undefined> {
    const [row] = await this.db.update(category).set(values).where(owned(userId, id)).returning();
    return row;
  }

  async delete(userId: string, id: string): Promise<boolean> {
    return !!(await this.update(userId, id, { deletedAt: new Date() }));
  }
}
