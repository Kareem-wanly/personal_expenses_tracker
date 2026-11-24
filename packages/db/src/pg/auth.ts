import { boolean, index, integer, pgTable, text } from "drizzle-orm/pg-core";

import { instant, money, timestamps } from "./columns";
import { ownerId } from "./owner";

/* Tables owned by Better Auth. Property names must match its field names. */

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  currency: text("currency").notNull().default("USD"),
  /** Minor units; null = no budget. */
  monthlyBudget: money("monthly_budget"),
  /** IANA zone: decides which day is "today" for this user. */
  timezone: text("timezone").notNull().default("UTC"),
  notifyBudget: boolean("notify_budget").notNull().default(true),
  notifyDailyReminder: boolean("notify_daily_reminder").notNull().default(true),
  notifyMonthlySummary: boolean("notify_monthly_summary").notNull().default(true),
  notifyRecurring: boolean("notify_recurring").notNull().default(true),
  notifyDebts: boolean("notify_debts").notNull().default(true),
  ...timestamps,
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: instant("expires_at").notNull(),
    token: text("token").notNull().unique(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: ownerId(),
    ...timestamps,
  },
  (t) => [index("session_user_idx").on(t.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: ownerId(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: instant("access_token_expires_at"),
    refreshTokenExpiresAt: instant("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    ...timestamps,
  },
  (t) => [index("account_user_idx").on(t.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: instant("expires_at").notNull(),
    ...timestamps,
  },
  (t) => [index("verification_identifier_idx").on(t.identifier)],
);

export const passkey = pgTable(
  "passkey",
  {
    id: text("id").primaryKey(),
    name: text("name"),
    publicKey: text("public_key").notNull(),
    userId: ownerId(),
    credentialID: text("credential_id").notNull(),
    counter: integer("counter").notNull(),
    deviceType: text("device_type").notNull(),
    backedUp: boolean("backed_up").notNull(),
    transports: text("transports"),
    createdAt: instant("created_at"),
    aaguid: text("aaguid"),
  },
  (t) => [
    index("passkey_user_idx").on(t.userId),
    index("passkey_credential_idx").on(t.credentialID),
  ],
);
