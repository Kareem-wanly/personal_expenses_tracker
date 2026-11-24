import "server-only";

import { eq, inArray } from "drizzle-orm";
import { sendNotification, setVapidDetails } from "web-push";

import { db } from "@/db";
import { pushSubscription } from "@masrufi/db/schema";
import { env } from "@/lib/env";

export type PushPayload = {
  title: string;
  body: string;
  /** Page to open when the notification is tapped. */
  url?: string;
  /** Same tag replaces an older notification instead of stacking. */
  tag?: string;
};

const decodedLength = (b64url: string) => Buffer.from(b64url, "base64url").length;

/**
 * Configure VAPID once. Misconfigured keys must never take the whole app
 * down (they'd fail the build): log which variable is wrong — never its
 * value — and run with notifications disabled instead.
 */
function configureVapid(): boolean {
  const pub = env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return false;

  const problems: string[] = [];
  if (decodedLength(pub) !== 65) {
    problems.push(
      `NEXT_PUBLIC_VAPID_PUBLIC_KEY decodes to ${decodedLength(pub)} bytes (expected 65)`,
    );
  }
  if (decodedLength(priv) !== 32) {
    problems.push(`VAPID_PRIVATE_KEY decodes to ${decodedLength(priv)} bytes (expected 32)`);
  }
  if (!/^(mailto:|https:\/\/)/.test(env.VAPID_SUBJECT)) {
    problems.push("VAPID_SUBJECT must start with mailto: or https://");
  }

  try {
    if (problems.length) throw new Error(problems.join("; "));
    setVapidDetails(env.VAPID_SUBJECT, pub, priv);
    return true;
  } catch (err) {
    console.error(
      `[push] Notifications disabled — invalid VAPID config: ${(err as Error).message}. ` +
        "Paste only the value (no quotes, no NAME=) and redeploy.",
    );
    return false;
  }
}

export const pushEnabled = configureVapid();

export type PushReport = {
  /** Devices registered for the user. */
  devices: number;
  /** Devices whose push service accepted the message. */
  sent: number;
  /** Subscriptions the push service no longer knows (removed). */
  expired: number;
  /** HTTP status of every other failure, e.g. 403 = VAPID key mismatch. */
  failed: number[];
};

/**
 * Send a notification to every device of a user (or only `endpoint`), and
 * report what happened. Expired subscriptions (404/410) are deleted.
 */
export async function pushToUser(userId: string, payload: PushPayload, endpoint?: string): Promise<PushReport> {
  if (!pushEnabled) return { devices: 0, sent: 0, expired: 0, failed: [] };

  const subs = (
    await db.select().from(pushSubscription).where(eq(pushSubscription.userId, userId))
  ).filter((s) => !endpoint || s.endpoint === endpoint);

  const expired: string[] = [];
  const failed: number[] = [];
  const results = await Promise.allSettled(
    subs.map((s) =>
      sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify(payload),
          { TTL: 60 * 60 * 24, urgency: "normal" },
        )
        .catch((err: { statusCode?: number; body?: string }) => {
          if (err.statusCode === 404 || err.statusCode === 410) expired.push(s.id);
          else failed.push(err.statusCode ?? 0);
          throw err;
        }),
    ),
  );

  if (expired.length) {
    await db.delete(pushSubscription).where(inArray(pushSubscription.id, expired));
  }
  for (const r of results) {
    if (r.status === "rejected") {
      const e = r.reason as { statusCode?: number; body?: string };
      console.error(`[push] send failed: ${e.statusCode ?? "?"} ${String(e.body ?? r.reason).slice(0, 200)}`);
    }
  }
  return {
    devices: subs.length,
    sent: results.filter((r) => r.status === "fulfilled").length,
    expired: expired.length,
    failed,
  };
}

/** Send to every device of a user; returns how many accepted it. */
export async function sendPushToUser(userId: string, payload: PushPayload) {
  return (await pushToUser(userId, payload)).sent;
}
