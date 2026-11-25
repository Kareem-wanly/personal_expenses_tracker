import { useMutationState } from "@tanstack/react-query";

import { WRITE_KEY } from "./outbox";
import type { Write } from "./write-policy";

/** Writes kept on the phone, oldest first. */
export const usePendingWrites = (): Write[] =>
  useMutationState({
    filters: { mutationKey: WRITE_KEY, status: "pending" },
    select: (mutation) => mutation.state.variables as Write,
  });
