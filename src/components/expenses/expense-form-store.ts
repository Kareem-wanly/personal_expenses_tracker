"use client";

import { useSyncExternalStore } from "react";

import type { ExpenseRow } from "@/server/queries";

/**
 * Tiny global store so any component (FAB, list rows, empty states) can open
 * the single expense form drawer without prop drilling or context.
 */
type State = { open: boolean; expense: ExpenseRow | null; nonce: number };

let state: State = { open: false, expense: null, nonce: 0 };
const listeners = new Set<() => void>();

function emit(next: State) {
  state = next;
  listeners.forEach((l) => l());
}

export function openExpenseForm(expense: ExpenseRow | null = null) {
  emit({ open: true, expense, nonce: state.nonce + 1 });
}

export function closeExpenseForm() {
  emit({ ...state, open: false });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const getSnapshot = () => state;

export function useExpenseFormState() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
