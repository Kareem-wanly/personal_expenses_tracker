import "server-only";

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { passkey } from "@better-auth/passkey";

import { db, schema } from "@/db";
import { purgeUserData } from "@/lib/account-data";
import { APP_NAME, DEFAULT_CATEGORIES } from "@/lib/constants";
import { env, googleEnabled } from "@/lib/env";

/** Vercel exposes the deployment domains (without protocol) at runtime. */
const vercelOrigins = [
  process.env.VERCEL_PROJECT_PRODUCTION_URL,
  process.env.VERCEL_BRANCH_URL,
  process.env.VERCEL_URL,
]
  .filter(Boolean)
  .map((host) => `https://${host}`);

export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  // Explicit URL wins; on Vercel fall back to the production domain.
  baseURL: env.BETTER_AUTH_URL ?? vercelOrigins[0],
  // Allow preview deployments (their own *.vercel.app URL) to sign in too.
  trustedOrigins: vercelOrigins,
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
      passkey: schema.passkey,
    },
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    autoSignIn: true,
  },
  // Redirect URI to register in Google Cloud: <baseURL>/api/auth/callback/google
  socialProviders: googleEnabled
    ? {
        google: {
          clientId: env.GOOGLE_CLIENT_ID!,
          clientSecret: env.GOOGLE_CLIENT_SECRET!,
          prompt: "select_account",
        },
      }
    : {},
  // An existing email+password account is NOT linked to Google on sign-in
  // (its email was never verified, so that would allow pre-registration
  // takeover). Users link Google from Settings while signed in instead.
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
    // Self-service account deletion (required by Google Play / App Store).
    // The endpoint re-checks the password; we remove the app's own data
    // first, then Better Auth deletes sessions, accounts and the user.
    deleteUser: {
      enabled: true,
      beforeDelete: async (user) => {
        await purgeUserData(user.id);
      },
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
  plugins: [
    // Face ID / fingerprint sign-in. rpID and origin default to baseURL's
    // host, so passkeys belong to the production domain (and localhost).
    passkey({ rpName: APP_NAME }),
    // Must stay last so cookies set inside Server Actions are forwarded.
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
