"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, use, useCallback, useMemo, useState } from "react";

import { TABS, tabIndexOf, tabTransition } from "@/lib/tabs";

type TabNav = {
  /** Tab of the committed route (-1 outside tabs). */
  current: number;
  /** Tab to highlight: the one being navigated to, else `current`. */
  active: number;
  /** Navigate to a tab with a directional transition. */
  go: (index: number) => void;
  /** Mark a tab as pending (used by <Link> taps, which navigate themselves). */
  markPending: (index: number) => void;
};

const TabNavContext = createContext<TabNav | null>(null);

export function TabNavProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const current = tabIndexOf(pathname);

  // Optimistic highlight: the tab bar reacts on tap, before the new page
  // commits. Reset whenever the committed route changes.
  const [pending, setPending] = useState<number | null>(null);
  const [seenPath, setSeenPath] = useState(pathname);
  if (seenPath !== pathname) {
    setSeenPath(pathname);
    setPending(null);
  }

  const go = useCallback(
    (index: number) => {
      const tab = TABS[index];
      if (!tab || index === current) return;
      setPending(index);
      router.push(tab.href, { transitionTypes: tabTransition(current, index) });
    },
    [current, router],
  );

  const value = useMemo<TabNav>(
    () => ({ current, active: pending ?? current, go, markPending: setPending }),
    [current, pending, go],
  );

  return <TabNavContext value={value}>{children}</TabNavContext>;
}

export function useTabNav(): TabNav {
  const ctx = use(TabNavContext);
  if (!ctx) throw new Error("useTabNav must be used inside <TabNavProvider>");
  return ctx;
}
