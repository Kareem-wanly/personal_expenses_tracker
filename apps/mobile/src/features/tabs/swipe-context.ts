import { createContext, useContext } from "react";
import type { usePanGesture } from "react-native-gesture-handler";

type Pan = ReturnType<typeof usePanGesture>;

const SwipeContext = createContext<Pan | null>(null);

export const SwipeProvider = SwipeContext.Provider;

/** The gesture that changes tabs, for horizontal lists that must win over it. */
export const useTabSwipe = () => useContext(SwipeContext);
