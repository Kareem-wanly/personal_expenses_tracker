import { useEffect } from "react";
import { AppState } from "react-native";

import { lockIfDue, lockStore, markActive } from "./lock-store";

/** Notes when the app is left, and locks when it comes back too late. */
export function useLockWatcher() {
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") lockIfDue();
      // Being asked for a fingerprint makes the app "inactive", which isn't leaving it.
      else if (state === "background" && !lockStore.get().locked) {
        markActive();
        // "Immediately": already locked when the app switcher takes its picture.
        if (lockStore.get().config?.timeout === 0) lockIfDue();
      }
    });
    return () => subscription.remove();
  }, []);
}
