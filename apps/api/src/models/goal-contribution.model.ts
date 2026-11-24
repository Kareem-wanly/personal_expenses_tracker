import { and, desc, eq, isNull, sum } from "drizzle-orm";

import { goalContribution } from "@masrufi/db/pg/schema";

import type { Db } from "../database/client";

export type Contribution = typeof goalContribution.$inferSelect;
type NewContribution = typeof goalContribution.$inferInsert;

const active = (userId: string) =>
  and(eq(goalContribution.userId, userId), isNull(goalContribution.deletedAt));

export class GoalContributionModel {
  constructor(private readonly db: Db) {}

  list(userId: string): Promise<Contribution[]> {
    return this.db
      .select()
      .from(goalContribution)
      .where(active(userId))
      .orderBy(desc(goalContribution.date), desc(goalContribution.createdAt));
  }

  async find(userId: string, id: string): Promise<Contribution | undefined> {
    const [row] = await this.db
      .select()
      .from(goalContribution)
      .where(and(active(userId), eq(goalContribution.id, id)));
    return row;
  }

  async totalSaved(userId: string, goalId: string): Promise<number> {
    const [row] = await this.db
      .select({ saved: sum(goalContribution.amount).mapWith(Number) })
      .from(goalContribution)
      .where(and(active(userId), eq(goalContribution.goalId, goalId)));
    return row.saved ?? 0;
  }

  /** Undefined when the id is already taken. */
  async insert(values: NewContribution): Promise<Contribution | undefined> {
    const [row] = await this.db
      .insert(goalContribution)
      .values(values)
      .onConflictDoNothing({ target: goalContribution.id })
      .returning();
    return row;
  }

  async delete(userId: string, goalId: string, id: string): Promise<boolean> {
    const rows = await this.db
      .update(goalContribution)
      .set({ deletedAt: new Date() })
      .where(and(active(userId), eq(goalContribution.goalId, goalId), eq(goalContribution.id, id)))
      .returning({ id: goalContribution.id });
    return rows.length > 0;
  }

  async deleteAll(userId: string, goalId: string): Promise<void> {
    await this.db
      .update(goalContribution)
      .set({ deletedAt: new Date() })
      .where(and(active(userId), eq(goalContribution.goalId, goalId)));
  }
}
