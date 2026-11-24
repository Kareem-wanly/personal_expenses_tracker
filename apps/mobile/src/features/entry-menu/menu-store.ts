import { useSyncExternalStore } from "react";

import type { LedgerEntry } from "@/features/ledger/entry";

export type Frame = { x: number; y: number; width: number; height: number };
export type EntryMenu = { entry: LedgerEntry; currency: string; frame: Frame };

let current: EntryMenu | null = null;
const listeners = new Set<() => void>();

function set(menu: EntryMenu | null) {
  current = menu;
  for (const listener of listeners) listener();
}

export const openEntryMenu = (menu: EntryMenu) => set(menu);
export const closeEntryMenu = () => set(null);

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const useEntryMenu = () => useSyncExternalStore(subscribe, () => current, () => null);
