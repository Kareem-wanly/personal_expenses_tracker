"use client";

import { useSyncExternalStore } from "react";

import type { ExpenseRow } from "@/server/queries";

/**
 * Global store for the long-press context menu, so any expense row can
 * open the single menu mounted in the app layout.
 */
export type ExpenseMenuState = {
  expense: ExpenseRow;
  currency: string;
  meta?: string;
  /** Where the row sits on screen, to lift it in place. */
  rect: { top: number; left: number; width: number; height: number };
  /** Row to return focus to when the menu closes. */
  origin: HTMLElement | null;
} | null;

let state: ExpenseMenuState = null;
const listeners = new Set<() => void>();

function emit(next: ExpenseMenuState) {
  state = next;
  listeners.forEach((l) => l());
}

export function openExpenseMenu(next: NonNullable<ExpenseMenuState>) {
  emit(next);
}

export function closeExpenseMenu() {
  const origin = state?.origin;
  emit(null);
  origin?.focus({ preventScroll: true });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const getSnapshot = () => state;
const getServerSnapshot = () => null;

export function useExpenseMenu() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
