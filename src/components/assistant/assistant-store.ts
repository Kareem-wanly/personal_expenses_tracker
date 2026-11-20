"use client";

import { useSyncExternalStore } from "react";

/** Open/close the single assistant sheet from anywhere (FAB, header…). */
type State = { open: boolean; listen: boolean; nonce: number };

let state: State = { open: false, listen: false, nonce: 0 };
const listeners = new Set<() => void>();

function emit(next: State) {
  state = next;
  listeners.forEach((l) => l());
}

/** `listen`: start the microphone right away (e.g. from a long-press). */
export function openAssistant({ listen = false } = {}) {
  emit({ open: true, listen, nonce: state.nonce + 1 });
}

export function closeAssistant() {
  emit({ ...state, open: false });
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const snapshot = () => state;

export function useAssistantState() {
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}
