"use client";

import { DeleteIcon } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useEffectEvent, useState } from "react";

import { PIN_LENGTH } from "@/lib/app-lock";
import { cn } from "@/lib/utils";

const ARABIC_DIGITS: Record<string, string> = {
  "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4", "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9",
  "۰": "0", "۱": "1", "۲": "2", "۳": "3", "۴": "4", "۵": "5", "۶": "6", "۷": "7", "۸": "8", "۹": "9",
};
const toDigit = (key: string) => (/^\d$/.test(key) ? key : (ARABIC_DIGITS[key] ?? null));

const keyClass =
  "flex size-[74px] items-center justify-center rounded-full border border-hairline font-display text-[28px] font-medium tabular " +
  "transition-colors duration-100 active:bg-foreground/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40";

/**
 * 4-digit PIN entry: dots + phone-style keypad (also accepts the physical
 * keyboard, Arabic-Indic digits included). `onComplete` resolves to whether
 * the PIN was accepted; a rejected PIN shakes the dots and clears.
 */
export function PinPad({
  title,
  message,
  error,
  disabled,
  onComplete,
  extraKey,
}: {
  title: React.ReactNode;
  message?: React.ReactNode;
  error?: React.ReactNode;
  disabled?: boolean;
  onComplete: (pin: string) => boolean | Promise<boolean>;
  /** Bottom-left key, e.g. the Face ID button. */
  extraKey?: React.ReactNode;
}) {
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [shake, setShake] = useState(0);
  const blocked = disabled || busy;

  async function submit(full: string) {
    setBusy(true);
    const ok = await onComplete(full);
    setBusy(false);
    setPin("");
    if (!ok) setShake((s) => s + 1);
  }

  function press(digit: string) {
    if (blocked || pin.length >= PIN_LENGTH) return;
    const next = pin + digit;
    setPin(next);
    if (next.length === PIN_LENGTH) void submit(next);
  }

  const backspace = () => !blocked && setPin((p) => p.slice(0, -1));

  const onKey = useEffectEvent((e: KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const d = toDigit(e.key);
    if (d) {
      e.preventDefault();
      press(d);
    } else if (e.key === "Backspace") {
      e.preventDefault();
      backspace();
    }
  });
  useEffect(() => {
    const handler = (e: KeyboardEvent) => onKey(e);
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="flex w-full max-w-xs flex-col items-center">
      <h1 className="text-center font-display text-[26px] font-semibold leading-tight">{title}</h1>
      <p
        aria-live="polite"
        className={cn("mt-2 min-h-[22px] text-center text-[15px]", error ? "text-negative" : "text-muted-foreground")}
      >
        {error || message}
      </p>

      <motion.div
        key={shake}
        dir="ltr"
        role="img"
        aria-label={`أُدخل ${pin.length} من ${PIN_LENGTH} أرقام`}
        animate={shake ? { x: [0, -12, 12, -8, 8, -3, 0] } : undefined}
        transition={{ duration: 0.4 }}
        className="mt-7 flex gap-5"
      >
        {Array.from({ length: PIN_LENGTH }, (_, i) => (
          <span
            key={i}
            className={cn(
              "size-3.5 rounded-full border-[1.5px] border-foreground/70 transition-colors duration-150",
              i < pin.length && "bg-foreground",
            )}
          />
        ))}
      </motion.div>

      <div dir="ltr" className="mt-10 grid grid-cols-3 gap-x-6 gap-y-4">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
          <button key={d} type="button" onClick={() => press(d)} disabled={blocked} className={keyClass}>
            {d}
          </button>
        ))}
        <span className="flex size-[74px] items-center justify-center">{extraKey}</span>
        <button type="button" onClick={() => press("0")} disabled={blocked} className={keyClass}>
          0
        </button>
        <button
          type="button"
          onClick={backspace}
          disabled={blocked || !pin.length}
          aria-label="حذف رقم"
          className="flex size-[74px] items-center justify-center rounded-full text-foreground/70 active:bg-foreground/[0.08] disabled:opacity-30"
        >
          <DeleteIcon className="size-7" strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}

/** Full-screen sheet that covers everything else (used by lock + setup). */
export function LockSurface({ children, footer }: { children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-y-auto bg-background px-6 pt-safe pb-safe"
    >
      <div className="flex flex-1 flex-col items-center justify-center py-8">{children}</div>
      {footer && <div className="pb-6">{footer}</div>}
    </div>
  );
}
