import { useQueries } from "@tanstack/react-query";

import type { Rate } from "@masrufi/contracts/api/responses";
import { formatMoney } from "@masrufi/core/money";

import { api } from "@/api/client";

import { type CurrencyTotal, approximate } from "./summary";

const HOUR = 60 * 60 * 1000;

/** "≈ 160 US$ بسعر اليوم", when amounts are in other currencies. */
export function useApproximate(totals: CurrencyTotal[], main: string): string | undefined {
  const rates = useQueries({
    queries: totals.map(({ currency }) => ({
      queryKey: ["rate", currency, main],
      queryFn: () => api.get<Rate>(`/rates?from=${currency}&to=${main}`),
      staleTime: HOUR,
      enabled: totals.some((total) => total.currency !== main),
    })),
  });
  const sum = approximate(totals, main, rates.map((rate) => rate.data?.rate ?? null));
  return sum === null ? undefined : `≈ ${formatMoney(sum, main)} بسعر اليوم`;
}
