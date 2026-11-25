import { useMutation } from "@tanstack/react-query";
import { useEffect } from "react";

import type { Profile } from "@masrufi/contracts/api/responses";

import { write } from "@/api/write";
import { useProfile } from "@/api/queries";
import { queryClient } from "@/api/query-client";

/** The server decides "today" by the user's zone, so it follows the phone. */
export function useSyncTimezone() {
  const stored = useProfile().data?.timezone;
  const current = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const { mutate } = useMutation({
    mutationFn: (timezone: string) => write.patch<Profile>("/me", { timezone }),
    onSuccess: () => queryClient.invalidateQueries(),
  });

  useEffect(() => {
    if (stored && current && stored !== current) mutate(current);
  }, [stored, current, mutate]);
}
