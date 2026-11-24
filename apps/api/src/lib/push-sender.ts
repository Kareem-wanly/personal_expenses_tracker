import { sendNotification, setVapidDetails } from "web-push";

import type { PushPayload } from "@masrufi/core/notifications";

import type { Env } from "../config/env";
import type { Device } from "../models/device.model";

/** `refused`: the push service said no, with this HTTP status (0 = unreachable). */
export type Delivery =
  | { result: "sent" }
  | { result: "expired" }
  | { result: "refused"; status: number };

export interface PushSender {
  send(device: Device, payload: PushPayload): Promise<Delivery>;
}

const ONE_DAY = 60 * 60 * 24;

export class WebPushSender implements PushSender {
  private readonly vapidDetails;

  constructor(subject: string, publicKey: string, privateKey: string) {
    this.vapidDetails = { subject, publicKey, privateKey };
    setVapidDetails(subject, publicKey, privateKey); // throws on malformed keys
  }

  async send(device: Device, payload: PushPayload): Promise<Delivery> {
    const { endpoint, p256dh, auth } = device;
    const subscription = { endpoint, keys: { p256dh: p256dh ?? "", auth: auth ?? "" } };
    const { vapidDetails } = this;
    const options = { TTL: ONE_DAY, urgency: "normal" as const, timeout: 10_000, vapidDetails };
    try {
      await sendNotification(subscription, JSON.stringify(payload), options);
      return { result: "sent" };
    } catch (error) {
      const status = (error as { statusCode?: number }).statusCode ?? 0;
      return status === 404 || status === 410 ? { result: "expired" } : { result: "refused", status };
    }
  }
}

/** Bad keys must not stop the API: it runs without notifications and says why. */
export function createPushSender(env: Env): PushSender | null {
  const { VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY } = env;
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return null;
  try {
    return new WebPushSender(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  } catch (error) {
    console.error("[push] notifications are off, invalid VAPID keys:", (error as Error).message);
    return null;
  }
}
