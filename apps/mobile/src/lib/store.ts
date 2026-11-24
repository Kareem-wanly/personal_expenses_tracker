import { useSyncExternalStore } from "react";

/** A value shared by the whole app, readable outside React. */
export function createStore<T>(initial: T) {
  let value = initial;
  const listeners = new Set<() => void>();
  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => void listeners.delete(listener);
  };
  const get = () => value;
  return {
    get,
    set(next: T) {
      value = next;
      for (const listener of listeners) listener();
    },
    use: () => useSyncExternalStore(subscribe, get, get),
  };
}
