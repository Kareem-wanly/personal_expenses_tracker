/** Rules of the app lock, shared by the site and the app. Storage and hashing belong to each. */

export const PIN_LENGTH = 4;
export const MAX_ATTEMPTS = 5;
export const COOLDOWN_MS = 30_000;

/** Seconds in the background before the app locks (0 = every time). */
export const LOCK_TIMEOUTS = [0, 60, 300, 900] as const;
export type LockTimeout = (typeof LOCK_TIMEOUTS)[number];

/** Should the app lock, given when it was last seen in the foreground? */
export function shouldLock(now: number, lastActive: number | null, timeoutSec: number) {
  if (lastActive === null || !Number.isFinite(lastActive)) return true;
  return now - lastActive >= timeoutSec * 1000;
}

export const isValidPin = (pin: string) => new RegExp(`^\\d{${PIN_LENGTH}}$`).test(pin);

export type Attempts = { count: number; until: number };

/** After too many wrong PINs, wait. */
export function failedAttempt({ count }: Attempts, now: number): Attempts {
  return count + 1 >= MAX_ATTEMPTS ? { count: 0, until: now + COOLDOWN_MS } : { count: count + 1, until: 0 };
}
