import { and, eq, inArray } from "drizzle-orm";

import { pushDevice } from "@masrufi/db/pg/schema";

import type { Db } from "../database/client";

export type Device = typeof pushDevice.$inferSelect;
type NewDevice = typeof pushDevice.$inferInsert;

export class DeviceModel {
  constructor(private readonly db: Db) {}

  list(userId: string): Promise<Device[]> {
    return this.db.select().from(pushDevice).where(eq(pushDevice.userId, userId));
  }

  /** A device belongs to whoever registered it last (another account may use the same phone). */
  async register(values: NewDevice): Promise<void> {
    const { userId, p256dh, auth, userAgent } = values;
    await this.db
      .insert(pushDevice)
      .values(values)
      .onConflictDoUpdate({ target: pushDevice.endpoint, set: { userId, p256dh, auth, userAgent } });
  }

  async remove(userId: string, endpoint: string): Promise<void> {
    await this.db
      .delete(pushDevice)
      .where(and(eq(pushDevice.userId, userId), eq(pushDevice.endpoint, endpoint)));
  }

  async removeExpired(userId: string, ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    await this.db
      .delete(pushDevice)
      .where(and(eq(pushDevice.userId, userId), inArray(pushDevice.id, ids)));
  }
}
