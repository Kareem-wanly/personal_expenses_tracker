"use client";

import { FingerprintIcon, LockKeyholeIcon } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import { LockSurface, PinPad } from "@/components/app-lock/pin-pad";
import {
  COOLDOWN_MS,
  type LockConfig,
  MAX_ATTEMPTS,
  isLocked,
  lastActive,
  markActive,
  readLock,
  setLocked,
  shouldLock,
  subscribeLock,
  verifyBiometric,
  verifyPin,
  writeLock,
} from "@/lib/app-lock";
import { signOut } from "@/lib/auth-client";
import { APP_NAME } from "@masrufi/core/constants";

const FAILS_KEY = "app-lock-fails";
const ACTIVE_TICK_MS = 15_000;

type Fails = { count: number; until: number };

function readFails(): Fails {
  try {
    const f = JSON.parse(localStorage.getItem(FAILS_KEY) ?? "null") as Fails | null;
    return f && typeof f.count === "number" ? f : { count: 0, until: 0 };
  } catch {
    return { count: 0, until: 0 };
  }
}
function writeFails(f: Fails | null) {
  try {
    if (f) localStorage.setItem(FAILS_KEY, JSON.stringify(f));
    else localStorage.removeItem(FAILS_KEY);
  } catch {}
}

/**
 * Covers the app with a PIN / Face ID screen after it has been in the
 * background longer than the chosen timeout. Mounted once in the app layout.
 * On a full page load, LOCK_SCRIPT has already decided (before paint); after
 * that, visibility changes decide.
 */
export function AppLock({ userId }: { userId: string }) {
  const locked = useSyncExternalStore(subscribeLock, isLocked, () => false);
  const [cfg, setCfg] = useState<LockConfig | null>(null);

  useEffect(() => {
    const own = (c: LockConfig | null) => (c && c.userId === userId ? c : null);
    const current = own(readLock());
    // A lock set up by another account on this device doesn't apply.
    if (!current && isLocked()) setLocked(false);
    if (current && !isLocked()) markActive();
    // Keep the config fresh when Settings changes it.
    const sync = () => setCfg(own(readLock()));
    sync();
    const unsubscribe = subscribeLock(sync);

    const onVisibility = () => {
      const c = own(readLock());
      if (!c || isLocked()) return;
      if (document.visibilityState === "hidden") {
        markActive();
        // "Immediately": lock now so the app switcher snapshot shows the lock.
        if (c.timeout === 0) setLocked(true);
      } else if (shouldLock(Date.now(), lastActive(), c.timeout)) {
        setLocked(true);
      }
    };
    const onPageHide = () => !isLocked() && markActive();
    const tick = setInterval(() => {
      if (document.visibilityState === "visible" && !isLocked()) markActive();
    }, ACTIVE_TICK_MS);

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      unsubscribe();
      clearInterval(tick);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [userId]);

  if (!locked || !cfg) return null;
  return createPortal(
    <div id="app-lock">
      <LockScreen cfg={cfg} />
    </div>,
    document.body,
  );
}

function LockScreen({ cfg }: { cfg: LockConfig }) {
  const [fails, setFails] = useState<Fails>(readFails);
  const [now, setNow] = useState(() => Date.now());
  const [bioError, setBioError] = useState(false);
  const autoTried = useRef(false);
  const coolingDown = fails.until > now;

  // Countdown while cooling down after too many wrong PINs.
  useEffect(() => {
    if (!coolingDown) return;
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [coolingDown]);

  function unlock() {
    writeFails(null);
    setLocked(false);
  }

  async function biometric() {
    if (!cfg.credentialId) return;
    setBioError(false);
    const used = await verifyBiometric([cfg.credentialId]);
    if (used) unlock();
    else setBioError(true);
  }

  // Offer Face ID / fingerprint right away, once per lock.
  useEffect(() => {
    if (autoTried.current || !cfg.credentialId || document.visibilityState !== "visible") return;
    autoTried.current = true;
    void verifyBiometric([cfg.credentialId]).then((used) => {
      if (used) unlock();
    });
  }, [cfg.credentialId]);

  async function checkPin(pin: string) {
    if (await verifyPin(pin, cfg)) {
      unlock();
      return true;
    }
    const count = fails.count + 1;
    const next = count >= MAX_ATTEMPTS ? { count: 0, until: Date.now() + COOLDOWN_MS } : { count, until: 0 };
    writeFails(next);
    setFails(next);
    setNow(Date.now());
    return false;
  }

  async function forgot() {
    // The password is the way back in; the lock is set up again afterwards.
    writeLock(null);
    writeFails(null);
    await signOut().catch(() => {});
    location.replace("/login");
  }

  const seconds = Math.ceil((fails.until - now) / 1000);
  const left = MAX_ATTEMPTS - fails.count;

  return (
    <LockSurface
      footer={
        <button type="button" onClick={forgot} className="text-[14px] text-muted-foreground underline-offset-4 active:underline">
          نسيت الرمز؟ ادخل بكلمة المرور
        </button>
      }
    >
      <span className="mb-5 flex size-14 items-center justify-center rounded-full bg-ink text-ink-foreground">
        <LockKeyholeIcon className="size-6" strokeWidth={1.75} />
      </span>
      <PinPad
        title={APP_NAME}
        message={cfg.credentialId ? "أدخل الرمز أو استخدم البصمة" : "أدخل رمز القفل"}
        error={
          coolingDown
            ? `محاولات كثيرة — انتظر ${seconds} ث`
            : fails.count
              ? `رمز غير صحيح — ${left === 1 ? "محاولة أخيرة" : left === 2 ? "بقيت محاولتان" : `بقيت ${left} محاولات`}`
              : bioError
                ? "لم يتم التحقق — أدخل الرمز"
                : undefined
        }
        disabled={coolingDown}
        onComplete={checkPin}
        extraKey={
          cfg.credentialId ? (
            <button
              type="button"
              onClick={biometric}
              aria-label="الفتح بالبصمة أو Face ID"
              className="flex size-[74px] items-center justify-center rounded-full text-primary active:bg-foreground/[0.08]"
            >
              <FingerprintIcon className="size-8" strokeWidth={1.5} />
            </button>
          ) : null
        }
      />
    </LockSurface>
  );
}
