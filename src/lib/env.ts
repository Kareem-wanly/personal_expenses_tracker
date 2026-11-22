import "server-only";

import { z } from "zod";

/**
 * Validate server env once at boot so misconfiguration fails fast with a
 * readable message instead of a cryptic runtime error.
 */
/**
 * Forgiving cleanup for values pasted into a hosting dashboard: trims
 * whitespace/newlines, surrounding quotes, and an accidental `NAME=` prefix.
 */
const pasted = (name: string) =>
  z.preprocess((v) => {
    if (typeof v !== "string") return v;
    let s = v.trim().replace(/^["']|["']$/g, "").trim();
    if (s.startsWith(`${name}=`)) s = s.slice(name.length + 1).trim();
    return s === "" ? undefined : s;
  }, z.string().optional());

const schema = z.object({
  DATABASE_URL: z.string().min(1).default("file:local.db"),
  DATABASE_AUTH_TOKEN: z.string().optional(),
  BETTER_AUTH_SECRET: z
    .string()
    .min(32, "BETTER_AUTH_SECRET must be at least 32 characters"),
  BETTER_AUTH_URL: z.url().optional(),
  // Web Push (optional: notifications are disabled when missing).
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: pasted("NEXT_PUBLIC_VAPID_PUBLIC_KEY"),
  VAPID_PRIVATE_KEY: pasted("VAPID_PRIVATE_KEY"),
  VAPID_SUBJECT: pasted("VAPID_SUBJECT").transform(
    (v) => v ?? "mailto:admin@example.com",
  ),
  /** Vercel sends `Authorization: Bearer $CRON_SECRET` to cron routes. */
  CRON_SECRET: pasted("CRON_SECRET"),
  // "Continue with Google" (optional: the button is hidden when missing).
  GOOGLE_CLIENT_ID: pasted("GOOGLE_CLIENT_ID"),
  GOOGLE_CLIENT_SECRET: pasted("GOOGLE_CLIENT_SECRET"),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:", z.treeifyError(parsed.error));
  throw new Error("Invalid environment variables");
}

export const env = parsed.data;

/** Google sign-in is offered only when both OAuth keys are configured. */
export const googleEnabled = !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
