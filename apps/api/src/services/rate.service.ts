import { CURRENCIES } from "@masrufi/core/constants";

/** Rates of one currency against the others. */
export type RateSource = (base: string) => Promise<Record<string, number>>;

const HOUR = 60 * 60 * 1000;
const SUPPORTED = new Set<string>(CURRENCIES.map((c) => c.code));

/** Free, daily, no key. Attribution is required where the rate is shown. */
const exchangeRateApi: RateSource = async (base) => {
  const url = `https://open.er-api.com/v6/latest/${base}`;
  const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (!response.ok) throw new Error(`rates: HTTP ${response.status}`);
  const body = (await response.json()) as { result?: string; rates?: Record<string, number> };
  if (body.result !== "success" || !body.rates) throw new Error("rates: unexpected answer");
  return body.rates;
};

export class RateService {
  private readonly cache = new Map<string, { at: number; rates: Record<string, number> }>();

  constructor(private readonly source: RateSource = exchangeRateApi) {}

  /** How many `to` one `from` is worth; null when unknown. */
  async get(from: string, to: string): Promise<number | null> {
    if (!SUPPORTED.has(from) || !SUPPORTED.has(to)) return null;
    if (from === to) return 1;
    try {
      const rate = (await this.ratesOf(from))[to];
      return rate ? Number(rate.toPrecision(6)) : null;
    } catch (error) {
      console.error("[rates]", error);
      return null;
    }
  }

  private async ratesOf(base: string) {
    const cached = this.cache.get(base);
    if (cached && Date.now() - cached.at < HOUR) return cached.rates;
    const rates = await this.source(base);
    this.cache.set(base, { at: Date.now(), rates });
    return rates;
  }
}
