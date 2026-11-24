import { useState } from "react";

import { authMessage } from "./auth-messages";

type AuthResult = { error: { code?: string; status?: number } | null };

/** Runs one sign-in related request at a time and keeps its error message. */
export function useAuthAction() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  async function run(action: () => Promise<AuthResult>): Promise<boolean> {
    setBusy(true);
    setError(undefined);
    const result = await action().catch((): AuthResult => ({ error: {} }));
    setBusy(false);
    if (result.error) setError(authMessage(result.error));
    return !result.error;
  }

  return { busy, error, run };
}
