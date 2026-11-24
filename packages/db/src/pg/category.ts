import { sql } from "drizzle-orm";
import { integer, pgTable, text, uniqueIndex } from "drizzle-orm/pg-core";

import { id, money, syncTimestamps } from "./columns";
import { ownerId } from "./owner";

export const category = pgTable(
  "category",
  {
    id: id(),
    userId: ownerId(),
    name: text("name").notNull(),
    icon: text("icon").notNull().default("📦"),
    color: text("color").notNull().default("#64748b"),
    sortOrder: integer("sort_order").notNull().default(0),
    /** Optional monthly budget, minor units. */
    budget: money("budget"),
    ...syncTimestamps,
  },
  (t) => [
    // A deleted category must not block reusing its name.
    uniqueIndex("category_user_name_uq")
      .on(t.userId, t.name)
      .where(sql`${t.deletedAt} is null`),
  ],
);
