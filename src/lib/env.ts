import "server-only";

import { z } from "zod";

/**
 * Validate server env once at boot so misconfiguration fails fast with a
 * readable message instead of a cryptic runtime error.
 */
const schema = z.object({
  DATABASE_URL: z.string().min(1).default("file:local.db"),
  DATABASE_AUTH_TOKEN: z.string().optional(),
  BETTER_AUTH_SECRET: z
    .string()
    .min(32, "BETTER_AUTH_SECRET must be at least 32 characters"),
  BETTER_AUTH_URL: z.url().optional(),
  // Web Push (optional: notifications are disabled when missing).
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  VAPID_SUBJECT: z.string().default("mailto:admin@example.com"),
  /** Vercel sends `Authorization: Bearer $CRON_SECRET` to cron routes. */
  CRON_SECRET: z.string().min(16).optional(),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:", z.treeifyError(parsed.error));
  throw new Error("Invalid environment variables");
}

export const env = parsed.data;
