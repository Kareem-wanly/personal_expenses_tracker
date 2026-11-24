import type { LockTimeout } from "@masrufi/core/app-lock";
import { shouldLock } from "@masrufi/core/app-lock";

import { storage } from "@/lib/storage";
import { createStore } from "@/lib/store";

/** The PIN itself is never stored, and everything stays on this phone. */
export type LockConfig = {
  userId: string;
  salt: string;
  hash: string;
  timeout: LockTimeout;
  biometric: boolean;
};

const CONFIG_KEY = "app-lock";
const ACTIVE_KEY = "app-lock-active";

function readConfig(): LockConfig | null {
  try {
    return JSON.parse(storage.get(CONFIG_KEY) ?? "null") as LockConfig | null;
  } catch {
    return null;
  }
}

function lastActive(): number | null {
  const value = storage.get(ACTIVE_KEY);
  return value === null ? null : Number(value);
}

const isDue = (config: LockConfig | null) =>
  config !== null && shouldLock(Date.now(), lastActive(), config.timeout);

const saved = readConfig();

export const lockStore = createStore({ config: saved, locked: isDue(saved) });

export function saveLock(config: LockConfig) {
  storage.set(CONFIG_KEY, JSON.stringify(config));
  lockStore.set({ config, locked: false });
}

export function removeLock() {
  storage.set(CONFIG_KEY, null);
  lockStore.set({ config: null, locked: false });
}

/** Leaving the app: remember when. */
export const markActive = () => storage.set(ACTIVE_KEY, String(Date.now()));

/** Coming back: lock if it was away long enough. */
export function lockIfDue() {
  const { config, locked } = lockStore.get();
  if (!locked && isDue(config)) lockStore.set({ config, locked: true });
}

export function unlock() {
  markActive();
  lockStore.set({ ...lockStore.get(), locked: false });
}
