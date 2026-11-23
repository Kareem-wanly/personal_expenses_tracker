"use client";

import { useCallback, useEffect, useState } from "react";

import { subscribePush } from "@/server/actions";

/** Same forgiving cleanup as the server; invalid keys count as "not configured". */
function cleanPublicKey(raw: string | undefined) {
  if (!raw) return undefined;
  let s = raw.trim().replace(/^["']|["']$/g, "").trim();
  const prefix = "NEXT_PUBLIC_VAPID_PUBLIC_KEY=";
  if (s.startsWith(prefix)) s = s.slice(prefix.length).trim();
  try {
    const bytes = atob(s.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(s.length / 4) * 4, "="));
    return bytes.length === 65 ? s : undefined;
  } catch {
    return undefined;
  }
}

export const VAPID_PUBLIC_KEY = cleanPublicKey(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY);

export type PushSupport =
  | "loading"
  | "supported"
  | "ios-needs-install"
  | "unsupported"
  | "no-sw";

/** VAPID keys are base64url; the Push API wants raw bytes. */
function urlBase64ToUint8Array(base64: string) {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4))
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
}

/** Device-level push state: support, permission and current subscription. */
export function usePushState() {
  const [support, setSupport] = useState<PushSupport>("loading");
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const hasApis =
        "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
      if (!hasApis) {
        const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
        if (!cancelled) setSupport(ios ? "ios-needs-install" : "unsupported");
        return;
      }
      // The service worker only exists in production builds.
      const reg = await navigator.serviceWorker.getRegistration();
      if (!reg) {
        if (!cancelled) setSupport("no-sw");
        return;
      }
      const sub = await reg.pushManager.getSubscription();
      if (cancelled) return;
      setSubscription(sub);
      setPermission(Notification.permission);
      setSupport("supported");
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { support, permission, subscription, setPermission, setSubscription };
}

export type EnableResult =
  | { ok: true; message: string; subscription: PushSubscription }
  | { ok: false; message: string; permission?: NotificationPermission };

/**
 * Ask for permission (must run from a user gesture), subscribe this device
 * and register it on the server.
 */
export async function enablePush(): Promise<EnableResult> {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return { ok: false, message: "لم يتم منح إذن الإشعارات", permission };
    }
    const reg = await navigator.serviceWorker.ready;
    const sub =
      (await reg.pushManager.getSubscription()) ??
      (await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY!),
      }));
    const res = await subscribePush(
      sub.toJSON(),
      Intl.DateTimeFormat().resolvedOptions().timeZone,
    );
    if (!res.ok) {
      await sub.unsubscribe();
      return { ok: false, message: res.message ?? "تعذّر تفعيل الإشعارات" };
    }
    return { ok: true, message: res.message ?? "تم تفعيل الإشعارات", subscription: sub };
  } catch (err) {
    console.error(err);
    return { ok: false, message: "تعذّر تفعيل الإشعارات على هذا المتصفح" };
  }
}

const sameBytes = (a: Uint8Array, b: Uint8Array) => a.length === b.length && a.every((v, i) => v === b[i]);

/**
 * Make sure this device's subscription matches the current VAPID key and is
 * registered to the signed-in account on the server. Re-subscribes when the
 * key changed (or when `force`), since the push service rejects messages
 * signed with a different key. Silent: returns the subscription or null.
 */
export async function syncPush(opts: { force?: boolean } = {}): Promise<PushSubscription | null> {
  if (!VAPID_PUBLIC_KEY || !("serviceWorker" in navigator) || Notification.permission !== "granted") return null;
  try {
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) return null;
    const want = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
    const key = sub.options.applicationServerKey;
    if (opts.force || !key || !sameBytes(new Uint8Array(key), want)) {
      await sub.unsubscribe().catch(() => {});
      sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: want });
    }
    const res = await subscribePush(sub.toJSON(), Intl.DateTimeFormat().resolvedOptions().timeZone);
    return res.ok ? sub : null;
  } catch (err) {
    console.error("[push] sync failed", err);
    return null;
  }
}

/** Small helper for "remind me later" with an expiry. */
export function useSnooze(key: string, days: number) {
  const [snoozedNow, setSnoozedNow] = useState(false);

  const isSnoozed = useCallback(() => {
    try {
      const at = Number(localStorage.getItem(key));
      return !!at && Date.now() - at < days * 24 * 60 * 60 * 1000;
    } catch {
      return false;
    }
  }, [key, days]);

  const snooze = useCallback(() => {
    setSnoozedNow(true);
    try {
      localStorage.setItem(key, String(Date.now()));
    } catch {}
  }, [key]);

  return { snoozed: snoozedNow || isSnoozed(), snooze };
}
