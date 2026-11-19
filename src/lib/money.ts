/**
 * Money helpers. Amounts are stored as integers in minor units (x100) to
 * avoid floating-point rounding errors (0.1 + 0.2 !== 0.3).
 */
export const MINOR_UNIT = 100;

export function toMinor(amount: number): number {
  return Math.round(amount * MINOR_UNIT);
}

export function fromMinor(minor: number): number {
  return minor / MINOR_UNIT;
}

const formatters = new Map<string, Intl.NumberFormat>();

function getFormatter(currency: string, compact: boolean) {
  const key = `${currency}:${compact}`;
  let f = formatters.get(key);
  if (!f) {
    f = new Intl.NumberFormat("ar-u-nu-latn", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
      ...(compact && { notation: "compact", maximumFractionDigits: 1 }),
    });
    formatters.set(key, f);
  }
  return f;
}

export function formatMoney(
  minor: number,
  currency: string,
  opts: { compact?: boolean } = {},
): string {
  // Wrap in Unicode LTR isolates (LRI…PDI) so the amount never gets
  // reordered when embedded in Arabic (RTL) sentences, tooltips or SVG.
  return `⁦${getFormatter(currency, !!opts.compact).format(fromMinor(minor))}⁩`;
}

const numberFmt = new Intl.NumberFormat("ar-u-nu-latn", {
  maximumFractionDigits: 1,
});

export function formatNumber(n: number): string {
  return numberFmt.format(n);
}

export function formatPercent(ratio: number): string {
  return `${numberFmt.format(Math.round(ratio * 1000) / 10)}%`;
}
