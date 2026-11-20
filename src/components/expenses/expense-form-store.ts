"use client";

import { useSyncExternalStore } from "react";

import type { ExpenseRow, IncomeRow } from "@/server/queries";

/**
 * Tiny global store so any component (FAB, list rows, empty states) can open
 * the single entry sheet — for an expense or an income — without prop
 * drilling or context.
 */
export type EntryKind = "expense" | "income";

type State = {
  open: boolean;
  kind: EntryKind;
  expense: ExpenseRow | null;
  income: IncomeRow | null;
  nonce: number;
};

let state: State = { open: false, kind: "expense", expense: null, income: null, nonce: 0 };
const listeners = new Set<() => void>();

function emit(next: State) {
  state = next;
  listeners.forEach((l) => l());
}

export function openExpenseForm(expense: ExpenseRow | null = null) {
  emit({ open: true, kind: "expense", expense, income: null, nonce: state.nonce + 1 });
}

export function openIncomeForm(income: IncomeRow | null = null) {
  emit({ open: true, kind: "income", expense: null, income, nonce: state.nonce + 1 });
}

/** Switch a *new* entry between expense and income without closing the sheet. */
export function setEntryKind(kind: EntryKind) {
  if (state.expense || state.income) return; // editing: kind is fixed
  emit({ ...state, kind });
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
