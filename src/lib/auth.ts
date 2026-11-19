import "server-only";

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";

import { db, schema } from "@/db";
import { DEFAULT_CATEGORIES } from "@/lib/constants";
import { env } from "@/lib/env";

export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    autoSignIn: true,
  },
  session: {
    // Personal finance app used daily on a phone: keep users signed in.
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // refresh once a day
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },
  user: {
    additionalFields: {
      currency: { type: "string", defaultValue: "USD", input: false },
      monthlyBudget: { type: "number", required: false, input: false },
    },
  },
  databaseHooks: {
    user: {
      create: {
        // Give every new account a sensible starter set of categories.
        after: async (created) => {
          await db.insert(schema.category).values(
            DEFAULT_CATEGORIES.map((c, i) => ({
              userId: created.id,
              name: c.name,
              icon: c.icon,
              color: c.color,
              sortOrder: i,
            })),
          );
        },
      },
    },
  },
  rateLimit: { enabled: true, window: 60, max: 30 },
  // Must stay last so cookies set inside Server Actions are forwarded.
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
