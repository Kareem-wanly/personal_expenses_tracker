import { eq } from "drizzle-orm";

import { user } from "@masrufi/db/pg/schema";

import type { Db } from "../database/client";

export type User = typeof user.$inferSelect;

export class UserModel {
  constructor(private readonly db: Db) {}

  async find(id: string): Promise<User | undefined> {
    const [row] = await this.db.select().from(user).where(eq(user.id, id));
    return row;
  }

  async update(id: string, values: Partial<User>): Promise<User> {
    const [row] = await this.db.update(user).set(values).where(eq(user.id, id)).returning();
    return row;
  }
}
