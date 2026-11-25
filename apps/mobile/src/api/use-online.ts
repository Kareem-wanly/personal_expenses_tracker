import { onlineManager } from "@tanstack/react-query";
import { useSyncExternalStore } from "react";

const subscribe = (listener: () => void) => onlineManager.subscribe(listener);
const isOnline = () => onlineManager.isOnline();

export const useOnline = () => useSyncExternalStore(subscribe, isOnline, isOnline);
