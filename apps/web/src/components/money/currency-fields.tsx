"use client";

import { ChevronDownIcon, Loader2Icon, RefreshCwIcon } from "lucide-react";
import { useEffect, useEffectEvent, useState, useTransition } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CURRENCIES } from "@masrufi/core/constants";
import { formatMoney, normalizeAmountInput, toMinor } from "@masrufi/core/money";
import { cn } from "@/lib/utils";
import { getExchangeRate } from "@/server/actions";

const LABELS = new Map<string, string>(CURRENCIES.map((c) => [c.code, c.label]));

/**
 * Currency chip that opens a list (not a native <select>, which React's
 * form reset would snap back). Pass `name` to submit the value.
 */
export function CurrencyPicker({
  value,
  onChange,
  name,
  main,
  className,
}: {
  value: string;
  onChange: (code: string) => void;
  name?: string;
  /** The user's own currency, listed first. */
  main?: string;
  className?: string;
}) {
  const codes = CURRENCIES.map((c) => c.code as string);
  const ordered = main ? [main, ...codes.filter((c) => c !== main)] : codes;
  return (
    <>
      {name && <input type="hidden" name={name} value={value} />}
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={`العملة: ${LABELS.get(value) ?? value}`}
          className={cn(
            "inline-flex h-8 items-center gap-1 rounded-full px-3 text-[13px] font-semibold tracking-wide text-muted-foreground ring-1 ring-inset ring-hairline active:bg-foreground/[0.06] data-popup-open:text-foreground",
            className,
          )}
        >
          <span dir="ltr">{value}</span>
          <ChevronDownIcon className="size-3.5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="max-h-72 w-56">
          <DropdownMenuRadioGroup value={value} onValueChange={(v) => onChange(String(v))}>
            {ordered.map((code) => (
              <DropdownMenuRadioItem key={code} value={code} className="py-2 text-[15px]">
                <span dir="ltr" className="w-10 font-semibold tabular">
                  {code}
                </span>
                <span className="text-muted-foreground">{LABELS.get(code)}</span>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

const lastRateKey = (from: string, to: string) => `fx:${from}:${to}`;

/** The rate the user last typed for this pair, to prefill when they pick it again. */
export function lastRate(from: string, to: string) {
  try {
    return localStorage.getItem(lastRateKey(from, to));
  } catch {
    return null;
  }
}

export function rememberRate(from: string, to: string, rate: string) {
  try {
    if (Number(normalizeAmountInput(rate)) > 0) localStorage.setItem(lastRateKey(from, to), rate);
  } catch {}
}

/**
 * "1 EUR = [rate] SYP" line for money typed in another currency, with the
 * converted amount. Callers prefill the last rate the user typed for this
 * pair (markets differ from official rates); otherwise today's published
 * rate is fetched. Remount it (key) when the currency changes.
 */
export function RateLine({
  from,
  to,
  amount,
  rate,
  setRate,
  error,
}: {
  from: string;
  to: string;
  amount: string;
  rate: string;
  setRate: (rate: string) => void;
  error?: string;
}) {
  const [source, setSource] = useState<"last" | "today" | "manual" | "none" | null>(() =>
    rate ? (rate === lastRate(from, to) ? "last" : "manual") : null,
  );
  const [pending, startTransition] = useTransition();

  function fetchToday() {
    startTransition(async () => {
      const r = await getExchangeRate(from, to);
      if (r) {
        setRate(String(r));
        setSource("today");
      } else {
        setSource("none");
      }
    });
  }

  // No rate yet (and none remembered by the picker): ask for today's.
  const fetchIfEmpty = useEffectEvent(() => {
    if (!rate) fetchToday();
  });
  useEffect(() => fetchIfEmpty(), []);

  const n = Number(normalizeAmountInput(amount));
  const r = Number(normalizeAmountInput(rate));
  const converted = n > 0 && r > 0 ? toMinor(n * r) : null;

  return (
    <div className="mt-3 flex w-full max-w-sm flex-col items-center gap-1.5">
      <div className="surface flex h-11 w-full items-center gap-2 px-3 text-[15px]">
        <span dir="ltr" className="shrink-0 font-semibold tabular">
          1 {from} =
        </span>
        <input
          name="rate"
          inputMode="decimal"
          dir="ltr"
          autoComplete="off"
          aria-label={`سعر الصرف: كم ${to} يساوي 1 ${from}`}
          aria-invalid={!!error}
          placeholder={pending ? "…" : "السعر"}
          value={rate}
          onChange={(e) => {
            setRate(e.target.value);
            setSource("manual");
          }}
          className="h-full min-w-0 flex-1 bg-transparent text-center font-semibold tabular outline-none placeholder:text-muted-foreground/60"
        />
        <span dir="ltr" className="shrink-0 font-semibold text-muted-foreground">
          {to}
        </span>
        <button
          type="button"
          onClick={fetchToday}
          disabled={pending}
          aria-label="سعر اليوم"
          className="flex size-8 shrink-0 items-center justify-center rounded-full text-primary active:bg-foreground/[0.06] disabled:opacity-50"
        >
          {pending ? <Loader2Icon className="size-4 animate-spin" /> : <RefreshCwIcon className="size-4" />}
        </button>
      </div>
      <p className={cn("text-center text-[12.5px]", error ? "text-destructive" : "text-muted-foreground")}>
        {error ??
          [
            converted !== null ? `≈ ${formatMoney(converted, to)}` : null,
            source === "last"
              ? "آخر سعر استخدمته"
              : source === "today"
                ? "سعر اليوم الرسمي"
                : source === "none"
                  ? "تعذّر جلب السعر — أدخله يدوياً"
                  : null,
          ]
            .filter(Boolean)
            .join(" · ")}
      </p>
      {source === "today" && (
        <a
          href="https://www.exchangerate-api.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] text-muted-foreground/80 underline-offset-2 hover:underline"
        >
          Rates By Exchange Rate API
        </a>
      )}
    </div>
  );
}
