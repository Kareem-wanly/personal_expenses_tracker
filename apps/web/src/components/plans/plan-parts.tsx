"use client";

import { ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useEffectEvent } from "react";
import { toast } from "sonner";

import { CurrencyPicker } from "@/components/money/currency-fields";
import { DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { TAB_BACK } from "@/lib/tabs";
import { cn } from "@/lib/utils";
import type { ActionState } from "@masrufi/contracts/validations";

/** "‹ الرئيسية" above the large title of a screen opened from Home. */
export function BackLink() {
  return (
    <Link
      href="/"
      transitionTypes={[TAB_BACK]}
      className="-ms-1 inline-flex items-center gap-0.5 pt-4 text-[16px] text-primary active:opacity-60"
    >
      <ChevronRightIcon className="size-5" />
      الرئيسية
    </Link>
  );
}

/** Sheet navigation bar: start action · centred title · end action. */
export function SheetNav({
  title,
  description,
  start,
  end,
}: {
  title: string;
  description: string;
  start?: React.ReactNode;
  end?: React.ReactNode;
}) {
  return (
    <div className="relative flex h-11 shrink-0 items-center justify-between px-4">
      <div className="relative z-10">{start ?? <span className="w-8" />}</div>
      <DrawerTitle className="pointer-events-none absolute inset-x-0 text-center text-[17px] font-semibold">
        {title}
      </DrawerTitle>
      <DrawerDescription className="sr-only">{description}</DrawerDescription>
      <div className="relative z-10">{end ?? <span className="w-8" />}</div>
    </div>
  );
}

export const navButton = "text-[17px] text-primary active:opacity-50 disabled:opacity-40";

/** Toast the result of a form action; `onOk` runs after a success. */
export function useActionResult(state: ActionState, onOk: () => void) {
  const handle = useEffectEvent((s: ActionState) => {
    if (s.ok) {
      navigator.vibrate?.(10);
      toast.success(s.message);
      onOk();
    } else if (s.message) {
      toast.error(s.message);
    }
  });
  useEffect(() => handle(state), [state]);
}

/**
 * Submit through a transition instead of `<form action>`: React resets a
 * form after an action, which would blank controlled fields on errors.
 */
export function submitWith(dispatch: (fd: FormData) => void, startTransition: (fn: () => void) => void) {
  return (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => dispatch(fd));
  };
}

/** Big centred amount with its currency chip, like the expense sheet. */
export function AmountField({
  id,
  name,
  value,
  onChange,
  currency,
  onCurrency,
  mainCurrency,
  error,
  tone,
  label = "المبلغ",
}: {
  id: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  currency: string;
  /** Omit to show the currency without letting it change. */
  onCurrency?: (c: string) => void;
  mainCurrency?: string;
  error?: string;
  tone?: "positive" | "negative";
  label?: string;
}) {
  const size = value.length <= 5 ? 56 : value.length <= 8 ? 46 : 36;
  return (
    <div className="flex flex-col items-center pt-2">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <input
        id={id}
        name={name}
        inputMode="decimal"
        autoComplete="off"
        required
        dir="ltr"
        placeholder="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
        style={{ fontSize: size }}
        className={cn(
          "h-[68px] w-full bg-transparent text-center font-display font-semibold leading-none caret-primary tabular outline-none transition-[font-size] duration-200 placeholder:text-foreground/20",
          tone === "positive" && "text-positive",
          tone === "negative" && "text-negative",
        )}
      />
      {onCurrency ? (
        <CurrencyPicker name="currency" value={currency} onChange={onCurrency} main={mainCurrency} className="mt-1" />
      ) : (
        <span dir="ltr" className="mt-1 text-[13px] font-semibold tracking-wide text-muted-foreground">
          {currency}
        </span>
      )}
      {error && <p className="mt-2 text-[13px] font-medium text-destructive">{error}</p>}
    </div>
  );
}

/** Text field row inside an inset-grouped card. */
export function TextRow({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 ps-4">
      <div className="list-row-body flex min-h-12 min-w-0 flex-1 items-center gap-3 pe-4">
        <label htmlFor={htmlFor} className="w-24 shrink-0 text-[16px]">
          {label}
        </label>
        {children}
      </div>
    </div>
  );
}

export const textInput =
  "h-12 min-w-0 flex-1 bg-transparent text-[16px] outline-none placeholder:text-muted-foreground/70";
export const dateInput =
  "h-9 rounded-[10px] bg-foreground/[0.06] px-2 text-[15px] outline-none focus-visible:ring-2 focus-visible:ring-ring dark:bg-white/[0.1]";

export const sheetContentClass =
  "mx-auto max-w-2xl border-t-0 bg-background data-[swipe-direction=down]:rounded-t-[22px]";
