/**
 * App lock: after the app has been in the background for a while, cover it
 * until the user enters a 4-digit PIN or verifies with Face ID / fingerprint.
 *
 * Everything lives on this device (localStorage). The goal is to stop
 * someone who picks up an unlocked phone; it doesn't replace the account
 * password (the session stays valid, and anyone with dev tools could remove
 * the overlay). That's why "forgot PIN" just signs you out.
 *
 * Biometric unlock reuses one of the user's passkeys: a local WebAuthn
 * assertion with `userVerification: "required"` proves the person can unlock
 * the device keychain. No new credential is created.
 */

export const LOCK_KEY = "app-lock";
export const ACTIVE_KEY = "app-lock-active";
/** `<html>` attribute set while locked; CSS hides the app under it. */
export const LOCKED_ATTR = "data-locked";

export const PIN_LENGTH = 4;
export const MAX_ATTEMPTS = 5;
export const COOLDOWN_MS = 30_000;
const PBKDF2_ITERATIONS = 100_000;

/** Seconds in the background before the app locks (0 = every time). */
export const LOCK_TIMEOUTS = [0, 60, 300, 900] as const;
export type LockTimeout = (typeof LOCK_TIMEOUTS)[number];

export type LockConfig = {
  v: 1;
  userId: string;
  salt: string;
  hash: string;
  timeout: LockTimeout;
  /** Passkey credential ID (base64url) used for biometric unlock, if any. */
  credentialId: string | null;
};

/* ------------------------------- pure helpers ------------------------------ */

/** Should the app lock, given when it was last seen in the foreground? */
export function shouldLock(now: number, lastActive: number | null, timeoutSec: number) {
  if (lastActive === null || !Number.isFinite(lastActive)) return true;
  return now - lastActive >= timeoutSec * 1000;
}

export const isValidPin = (pin: string) => new RegExp(`^\\d{${PIN_LENGTH}}$`).test(pin);

const toB64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const fromB64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

export function fromB64Url(s: string) {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  return fromB64(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
}

async function derive(pin: string, salt: Uint8Array) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(pin), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations: PBKDF2_ITERATIONS },
    key,
    256,
  );
  return toB64(new Uint8Array(bits));
}

/** Salted PBKDF2 hash, so the PIN is never stored in plain text. */
export async function hashPin(pin: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return { salt: toB64(salt), hash: await derive(pin, salt) };
}

export async function verifyPin(pin: string, cfg: Pick<LockConfig, "salt" | "hash">) {
  const hash = await derive(pin, fromB64(cfg.salt));
  // Constant-time compare (lengths are equal for well-formed configs).
  if (hash.length !== cfg.hash.length) return false;
  let diff = 0;
  for (let i = 0; i < hash.length; i++) diff |= hash.charCodeAt(i) ^ cfg.hash.charCodeAt(i);
  return diff === 0;
}

/* ------------------------------ device storage ----------------------------- */

export function readLock(): LockConfig | null {
  try {
    const cfg = JSON.parse(localStorage.getItem(LOCK_KEY) ?? "null") as LockConfig | null;
    return cfg?.v === 1 && cfg.hash && cfg.salt ? cfg : null;
  } catch {
    return null;
  }
}

export function writeLock(cfg: LockConfig | null) {
  try {
    if (cfg) localStorage.setItem(LOCK_KEY, JSON.stringify(cfg));
    else localStorage.removeItem(LOCK_KEY);
  } catch {}
  emit();
}

export function markActive(now = Date.now()) {
  try {
    localStorage.setItem(ACTIVE_KEY, String(now));
  } catch {}
}

export function lastActive(): number | null {
  try {
    const v = localStorage.getItem(ACTIVE_KEY);
    return v === null ? null : Number(v);
  } catch {
    return null;
  }
}

/* --------------------------- locked state (<html>) ------------------------- */

const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((l) => l());
}
export function subscribeLock(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export const isLocked = () => document.documentElement.hasAttribute(LOCKED_ATTR);

export function setLocked(locked: boolean) {
  document.documentElement.toggleAttribute(LOCKED_ATTR, locked);
  if (!locked) markActive();
  emit();
}

/**
 * Runs before the app is painted on a full page load (inlined in the app
 * layout), so the app never flashes before the lock screen appears.
 */
export const LOCK_SCRIPT = `try{var c=JSON.parse(localStorage.getItem(${JSON.stringify(LOCK_KEY)})||"null");if(c&&c.v===1){var a=Number(localStorage.getItem(${JSON.stringify(ACTIVE_KEY)}));if(!a||Date.now()-a>=c.timeout*1000)document.documentElement.setAttribute(${JSON.stringify(LOCKED_ATTR)},"")}}catch(e){}`;

/* ------------------------------- biometrics -------------------------------- */

export const biometricsSupported = () =>
  typeof window !== "undefined" && typeof window.PublicKeyCredential !== "undefined";

/**
 * Ask the device to verify the user (Face ID / fingerprint / device PIN)
 * with one of their passkeys. Resolves to the credential ID that was used,
 * or null if the user cancelled or it failed.
 */
export async function verifyBiometric(credentialIds: string[]): Promise<string | null> {
  if (!biometricsSupported() || !credentialIds.length) return null;
  try {
    const cred = (await navigator.credentials.get({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        rpId: location.hostname,
        allowCredentials: credentialIds.map((id) => ({ type: "public-key", id: fromB64Url(id) as BufferSource })),
        userVerification: "required",
        timeout: 60_000,
      },
    })) as PublicKeyCredential | null;
    return cred?.id ?? null;
  } catch {
    return null;
  }
}
