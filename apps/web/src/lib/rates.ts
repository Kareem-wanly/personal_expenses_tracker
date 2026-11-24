import "server-only";

import { cacheLife } from "next/cache";

import { CURRENCIES } from "@masrufi/core/constants";

/**
 * Exchange rates from ExchangeRate-API's open endpoint (free, no key,
 * updated daily; attribution required — shown next to the rate in the UI).
 * Only the server calls it, and it sends nothing about the user.
 */
export const RATES_SOURCE = { name: "ExchangeRate-API", url: "https://www.exchangerate-api.com" };

const CODES = new Set<string>(CURRENCIES.map((c) => c.code));

async function fetchRates(base: string): Promise<Record<string, number>> {
  "use cache";
  cacheLife("hours");
  const res = await fetch(`https://open.er-api.com/v6/latest/${base}`, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error(`rates: HTTP ${res.status}`);
  const body = (await res.json()) as { result?: string; rates?: Record<string, number> };
  if (body.result !== "success" || !body.rates) throw new Error("rates: bad response");
  const rates: Record<string, number> = {};
  for (const code of CODES) if (typeof body.rates[code] === "number") rates[code] = body.rates[code];
  return rates;
}

/** How many `to` one `from` is worth, or null if unknown / offline. */
export async function exchangeRate(from: string, to: string): Promise<number | null> {
  if (!CODES.has(from) || !CODES.has(to)) return null;
  if (from === to) return 1;
  try {
    const rate = (await fetchRates(from))[to];
    return rate ? Number(rate.toPrecision(6)) : null;
  } catch (err) {
    console.error("[rates]", err);
    return null;
  }
}
