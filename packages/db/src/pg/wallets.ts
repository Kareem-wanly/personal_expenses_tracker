import { index, integer, pgTable, text } from "drizzle-orm/pg-core";

import { day, id, money, syncTimestamps } from "./columns";
import { ownerId } from "./owner";

/* Reserved for the wallets feature (ROADMAP.md, items 1 and 4). */

/** A place money is kept, in one currency: cash, bank, Sham Cash… */
export const wallet = pgTable(
  "wallet",
  {
    id: id(),
    userId: ownerId(),
    name: text("name").notNull(),
    icon: text("icon").notNull().default("👛"),
    currency: text("currency").notNull(),
    openingBalance: money("opening_balance").notNull().default(0),
    sortOrder: integer("sort_order").notNull().default(0),
    ...syncTimestamps,
  },
  (t) => [index("wallet_user_idx").on(t.userId)],
);

const walletRef = (name: string) =>
  text(name)
    .notNull()
    .references(() => wallet.id, { onDelete: "cascade" });

/** Moving money between wallets: neither an expense nor an income. */
export const walletTransfer = pgTable(
  "wallet_transfer",
  {
    id: id(),
    userId: ownerId(),
    fromWalletId: walletRef("from_wallet_id"),
    toWalletId: walletRef("to_wallet_id"),
    amountOut: money("amount_out").notNull(),
    /** Differs from `amountOut` when the wallets have different currencies. */
    amountIn: money("amount_in").notNull(),
    date: day("date").notNull(),
    note: text("note"),
    ...syncTimestamps,
  },
  (t) => [index("wallet_transfer_user_idx").on(t.userId, t.date)],
);
