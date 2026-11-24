import { fromMinor, normalizeAmountInput, toMinor } from "@masrufi/core/money";

/** What was typed ("١٢٫٥") in minor units, or null when it isn't an amount. */
export function parseAmount(typed: string): number | null {
  const value = Number(normalizeAmountInput(typed));
  const minor = Number.isFinite(value) ? toMinor(value) : 0;
  return minor > 0 ? minor : null;
}

export function parseRate(typed: string): number | undefined {
  const value = Number(normalizeAmountInput(typed));
  return Number.isFinite(value) && value > 0 ? value : undefined;
}

type Entry = { amount: number; originalAmount: number | null; originalCurrency: string | null };

export type MoneyValue = { amount: string; currency: string; rate: string };

/** What to show in the form: entries in another currency show what was typed. */
export function moneyOf(entry: Entry | undefined, userCurrency: string): MoneyValue {
  if (!entry) return { amount: "", currency: userCurrency, rate: "" };
  const { amount, originalAmount, originalCurrency } = entry;
  if (originalAmount === null || originalCurrency === null) {
    return { amount: String(fromMinor(amount)), currency: userCurrency, rate: "" };
  }
  const rate = Number((amount / originalAmount).toPrecision(6));
  return { amount: String(fromMinor(originalAmount)), currency: originalCurrency, rate: String(rate) };
}

/** The money part of a request; null when the amount is missing. */
export function moneyRequest({ amount, currency, rate }: MoneyValue, userCurrency: string) {
  const minor = parseAmount(amount);
  if (minor === null) return null;
  if (currency === userCurrency) return { amount: minor };
  return { amount: minor, currency, rate: parseRate(rate) };
}
