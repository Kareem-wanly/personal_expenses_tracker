import type { BetterAuthOptions } from "better-auth";

import type { Env } from "../config/env";

/** Each provider is offered only when its keys are set. */
export function socialProviders(env: Env): BetterAuthOptions["socialProviders"] {
  return {
    ...(env.GOOGLE_CLIENT_ID &&
      env.GOOGLE_CLIENT_SECRET && {
        google: {
          clientId: env.GOOGLE_CLIENT_ID,
          clientSecret: env.GOOGLE_CLIENT_SECRET,
          prompt: "select_account" as const,
        },
      }),
    ...(env.APPLE_CLIENT_ID &&
      env.APPLE_CLIENT_SECRET && {
        apple: {
          clientId: env.APPLE_CLIENT_ID,
          clientSecret: env.APPLE_CLIENT_SECRET,
          appBundleIdentifier: env.APPLE_BUNDLE_ID,
        },
      }),
  };
}
