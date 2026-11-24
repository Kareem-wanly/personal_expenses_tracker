import { expo } from "@better-auth/expo";
import { passkey } from "@better-auth/passkey";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { APP_NAME, DEFAULT_CATEGORIES } from "@masrufi/core/constants";
import * as schema from "@masrufi/db/pg/schema";

import type { Env } from "../config/env";
import type { Db } from "../database/client";
import { CLIENT_IP_HEADER } from "../lib/client-ip";
import type { Mailer } from "../lib/mailer";
import { socialProviders } from "./providers";

const DAY = 60 * 60 * 24;

export function createAuth(db: Db, env: Env, mailer: Mailer) {
  return betterAuth({
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.API_URL,
    trustedOrigins: env.TRUSTED_ORIGINS,
    database: drizzleAdapter(db, { provider: "pg", schema }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      // Whoever asked for the reset takes the account back: end every other session.
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: ({ user, url }) =>
        mailer.send({
          to: user.email,
          subject: `${APP_NAME}: استرجاع كلمة المرور`,
          text: `لتعيين كلمة مرور جديدة افتح الرابط:\n${url}\n\nإن لم تطلب ذلك فتجاهل الرسالة.`,
        }),
    },
    // Social accounts are never linked by email alone: unverified emails would
    // let someone register first and capture the account. Users link in Settings.
    account: { accountLinking: { disableImplicitLinking: true } },
    socialProviders: socialProviders(env),
    session: { expiresIn: 30 * DAY, updateAge: DAY },
    user: {
      // Foreign keys cascade, so deleting the user deletes all of their data.
      deleteUser: { enabled: true },
    },
    databaseHooks: {
      user: {
        create: {
          after: async (user) => {
            await db
              .insert(schema.category)
              .values(DEFAULT_CATEGORIES.map((c, i) => ({ ...c, userId: user.id, sortOrder: i })));
          },
        },
      },
    },
    rateLimit: {
      enabled: env.NODE_ENV !== "test",
      window: 60,
      max: 30,
      // Only reads the session, and many phones can share one address.
      customRules: { "/get-session": false },
    },
    advanced: { ipAddress: { ipAddressHeaders: [CLIENT_IP_HEADER] } },
    plugins: [passkey({ rpName: APP_NAME }), expo()],
  });
}

export type Auth = ReturnType<typeof createAuth>;
