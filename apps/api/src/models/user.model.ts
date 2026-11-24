import { and, eq, inArray, isNull, lte } from "drizzle-orm";

import { pushDevice, recurringRule, user } from "@masrufi/db/pg/schema";

import type { Db } from "../database/client";

export type User = typeof user.$inferSelect;

export class UserModel {
  constructor(private readonly db: Db) {}

  async find(id: string): Promise<User | undefined> {
    const [row] = await this.db.select().from(user).where(eq(user.id, id));
    return row;
  }

  /** Users who can receive a notification. */
  withDevices(): Promise<User[]> {
    const owners = this.db.select({ id: pushDevice.userId }).from(pushDevice);
    return this.db.select().from(user).where(inArray(user.id, owners));
  }

  /** Users with recurring entries waiting to be created. */
  withDueRules(day: string): Promise<User[]> {
    const due = and(
      eq(recurringRule.active, true),
      isNull(recurringRule.deletedAt),
      lte(recurringRule.nextDate, day),
    );
    const owners = this.db.select({ id: recurringRule.userId }).from(recurringRule).where(due);
    return this.db.select().from(user).where(inArray(user.id, owners));
  }

  async update(id: string, values: Partial<User>): Promise<User> {
    const [row] = await this.db.update(user).set(values).where(eq(user.id, id)).returning();
    return row;
  }
}
