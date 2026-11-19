"use client";

import { useSyncExternalStore } from "react";

/**
 * Global store for the PWA install prompt.
 *
 * `beforeinstallprompt` fires once per page load — often before React has
 * rendered the component that wants it — so we capture it at module load
 * and share it with every consumer (first-visit banner, settings button).
 */
export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type State = { deferred: BeforeInstallPromptEvent | null; installed: boolean };

let state: State = { deferred: null, installed: false };
const listeners = new Set<() => void>();
const emit = (next: Partial<State>) => {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
};

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault(); // we show our own UI instead of the mini-infobar
    emit({ deferred: e as BeforeInstallPromptEvent });
  });
  window.addEventListener("appinstalled", () => {
    emit({ deferred: null, installed: true });
  });
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const getSnapshot = () => state;
const serverSnapshot: State = { deferred: null, installed: false };

/** Opens the native install dialog. Resolves to true if the user accepted. */
export async function promptInstall(): Promise<boolean> {
  const e = state.deferred;
  if (!e) return false;
  await e.prompt();
  const { outcome } = await e.userChoice;
  // A deferred prompt can only be used once.
  emit({ deferred: null, installed: outcome === "accepted" || state.installed });
  return outcome === "accepted";
}

const noop = () => () => {};

export function useInstallPrompt() {
  const s = useSyncExternalStore(subscribe, getSnapshot, () => serverSnapshot);
  const mounted = useSyncExternalStore(noop, () => true, () => false);

  const standalone =
    mounted &&
    (window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true);
  const ios = mounted && /iphone|ipad|ipod/i.test(navigator.userAgent);

  return {
    mounted,
    /** Already running as an installed app (or just installed). */
    installed: standalone || s.installed,
    /** Native install dialog is available (Android / desktop Chromium). */
    canPrompt: !!s.deferred,
    /** iOS has no install API: users must use Share → Add to Home Screen. */
    ios,
  };
}
