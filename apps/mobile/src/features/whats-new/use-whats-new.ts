import { useEffect } from "react";

import { useOpenSheet } from "@/features/sheets/open-sheet";
import { storage } from "@/lib/storage";

import { RELEASES } from "./releases";

const KEY = "seen-release";

/** Opens "what's new" once after an update. */
export function useWhatsNew() {
  const open = useOpenSheet();
  useEffect(() => {
    const { version } = RELEASES[0];
    if (storage.get(KEY) === version) return;
    const timer = setTimeout(() => {
      storage.set(KEY, version);
      open("whats-new");
    }, 1500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per start
  }, []);
}
