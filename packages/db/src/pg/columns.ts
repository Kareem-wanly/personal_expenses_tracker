import { bigint, date, text, timestamp } from "drizzle-orm/pg-core";

export const instant = (name: string) => timestamp(name, { withTimezone: true, mode: "date" });

/** A calendar day, `YYYY-MM-DD`, in the user's own zone. */
export const day = (name: string) => date(name, { mode: "string" });

/** Money in minor units (cents). Never a float. */
export const money = (name: string) => bigint(name, { mode: "number" });

/** Ids may be created on the device, so offline entries keep the same id on the server. */
export const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

export const timestamps = {
  createdAt: instant("created_at").notNull().defaultNow(),
  updatedAt: instant("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

/** Synced rows are never removed: `deletedAt` tells every device the row is gone. */
export const syncTimestamps = { ...timestamps, deletedAt: instant("deleted_at") };

/** What was typed, when the entry was made in another currency. */
export const originalMoney = {
  originalAmount: money("original_amount"),
  originalCurrency: text("original_currency"),
};
