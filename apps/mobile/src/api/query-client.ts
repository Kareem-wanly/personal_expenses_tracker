import { QueryClient } from "@tanstack/react-query";

import { ApiError } from "./client";

/** Only a lost connection or a server error is worth trying again. */
function shouldRetry(failures: number, error: Error): boolean {
  const temporary = !(error instanceof ApiError) || error.status === 0 || error.status >= 500;
  return temporary && failures < 2;
}

export const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: shouldRetry, staleTime: 30_000 } },
});
