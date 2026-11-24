import { useSyncExternalStore } from "react";

export type Toast = { id: number; text: string; tone: "success" | "error"; action?: { label: string; run: () => void } };

const SHORT = 2600;
const WITH_ACTION = 6000;

let current: Toast | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();

function set(toast: Toast | null) {
  current = toast;
  for (const listener of listeners) listener();
}

export function hideToast() {
  clearTimeout(timer);
  set(null);
}

/** Says what happened, from anywhere; a new message replaces the previous one. */
export function showToast(text: string, options: Partial<Pick<Toast, "tone" | "action">> = {}) {
  clearTimeout(timer);
  set({ id: Date.now(), text, tone: "success", ...options });
  timer = setTimeout(hideToast, options.action ? WITH_ACTION : SHORT);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const useToast = () => useSyncExternalStore(subscribe, () => current, () => null);
