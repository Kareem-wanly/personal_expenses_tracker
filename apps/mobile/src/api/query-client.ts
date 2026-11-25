import { QueryClient } from "@tanstack/react-query";

import { isConnectionError } from "./api-error";
import { setupOutbox } from "./outbox";
import { KEEP_FOR } from "./persist";

/** Only a lost connection or a server error is worth trying again. */
function shouldRetry(failures: number, error: Error): boolean {
  const temporary = isConnectionError(error) || !("status" in error) || Number(error.status) >= 500;
  return temporary && failures < 2;
}

export const queryClient = new QueryClient({
  // Kept as long as it is saved on the phone, so the app opens with data even offline.
  defaultOptions: {
    queries: { retry: shouldRetry, staleTime: 30_000, gcTime: KEEP_FOR },
    // A screen's own step always runs: it hands the write to the outbox, which waits for the connection.
    mutations: { networkMode: "always" },
  },
});

setupOutbox(queryClient);
