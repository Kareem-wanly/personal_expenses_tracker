import { and, asc, eq, isNull } from "drizzle-orm";

import { savingGoal } from "@masrufi/db/pg/schema";

import type { Db } from "../database/client";

export type Goal = typeof savingGoal.$inferSelect;
type NewGoal = typeof savingGoal.$inferInsert;

const active = (userId: string) => and(eq(savingGoal.userId, userId), isNull(savingGoal.deletedAt));
const owned = (userId: string, id: string) => and(active(userId), eq(savingGoal.id, id));

export class GoalModel {
  constructor(private readonly db: Db) {}

  list(userId: string): Promise<Goal[]> {
    return this.db.select().from(savingGoal).where(active(userId)).orderBy(asc(savingGoal.createdAt));
  }

  async find(userId: string, id: string): Promise<Goal | undefined> {
    const [row] = await this.db.select().from(savingGoal).where(owned(userId, id));
    return row;
  }

  /** Inside a transaction: makes other deposits and withdrawals wait their turn. */
  async lock(userId: string, id: string): Promise<Goal | undefined> {
    const [row] = await this.db.select().from(savingGoal).where(owned(userId, id)).for("update");
    return row;
  }

  /** Undefined when the id is already taken. */
  async insert(values: NewGoal): Promise<Goal | undefined> {
    const [row] = await this.db
      .insert(savingGoal)
      .values(values)
      .onConflictDoNothing({ target: savingGoal.id })
      .returning();
    return row;
  }

  async update(userId: string, id: string, values: Partial<NewGoal>): Promise<Goal | undefined> {
    const [row] = await this.db.update(savingGoal).set(values).where(owned(userId, id)).returning();
    return row;
  }

  async delete(userId: string, id: string): Promise<boolean> {
    return !!(await this.update(userId, id, { deletedAt: new Date() }));
  }
}
