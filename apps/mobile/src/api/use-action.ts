import { useState } from "react";

import { haptics } from "@/motion/haptics";
import { showToast } from "@/ui/toast-store";

import { queryClient } from "./query-client";

/** Runs one request at a time, says how it went, and refreshes what is on screen. */
export function useAction() {
  const [busy, setBusy] = useState(false);

  async function run<T>(work: () => Promise<T>, done: string | ((result: T) => void)): Promise<boolean> {
    setBusy(true);
    try {
      const result = await work();
      haptics.success();
      if (typeof done === "string") showToast(done);
      else done(result);
      await queryClient.invalidateQueries();
      return true;
    } catch (error) {
      haptics.error();
      showToast(error instanceof Error ? error.message : "حدث خطأ", { tone: "error" });
      return false;
    } finally {
      setBusy(false);
    }
  }

  return { busy, run };
}
