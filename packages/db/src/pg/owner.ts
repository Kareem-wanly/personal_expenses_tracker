import { type AnyPgColumn, text } from "drizzle-orm/pg-core";

import { user } from "./auth";

/** Every row belongs to one user and disappears with the account. */
export const ownerId = () =>
  text("user_id")
    .notNull()
    .references((): AnyPgColumn => user.id, { onDelete: "cascade" });
