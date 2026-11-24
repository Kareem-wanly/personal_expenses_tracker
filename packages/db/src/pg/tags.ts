import { sql } from "drizzle-orm";
import { index, pgTable, primaryKey, text, uniqueIndex } from "drizzle-orm/pg-core";

import { id, syncTimestamps } from "./columns";
import { expense } from "./ledger";
import { ownerId } from "./owner";

/* Reserved for the tags feature (ROADMAP.md, item 7). */

/** A free label ("سفر تركيا"); an expense can carry several. */
export const tag = pgTable(
  "tag",
  {
    id: id(),
    userId: ownerId(),
    name: text("name").notNull(),
    ...syncTimestamps,
  },
  (t) => [
    uniqueIndex("tag_user_name_uq")
      .on(t.userId, t.name)
      .where(sql`${t.deletedAt} is null`),
  ],
);

export const expenseTag = pgTable(
  "expense_tag",
  {
    expenseId: text("expense_id")
      .notNull()
      .references(() => expense.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => tag.id, { onDelete: "cascade" }),
  },
  (t) => [
    primaryKey({ columns: [t.expenseId, t.tagId] }),
    index("expense_tag_tag_idx").on(t.tagId),
  ],
);
