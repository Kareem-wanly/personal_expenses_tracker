import type { Rate } from "@masrufi/contracts/api/responses";

import { api } from "@/api/client";
import { queryClient } from "@/api/query-client";

/** Today's rate as text for the form; empty when unknown (the user types it). */
export function useSuggestedRate(userCurrency: string) {
  return async (currency: string): Promise<string> => {
    if (currency === userCurrency) return "";
    const answer = await queryClient
      .fetchQuery({
        queryKey: ["rate", currency, userCurrency],
        queryFn: () => api.get<Rate>(`/rates?from=${currency}&to=${userCurrency}`),
        staleTime: 60 * 60 * 1000,
      })
      .catch(() => null);
    return answer?.rate ? String(answer.rate) : "";
  };
}
