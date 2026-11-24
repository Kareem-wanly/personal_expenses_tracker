import { useEffect } from "react";
import { type SharedValue, useSharedValue, withDelay, withTiming } from "react-native-reanimated";

import { durations, easeOut } from "./tokens";

/** 0 → `target` when shown, then from value to value: bars, meters, rings. */
export function useGrow(target: number, delay = 0): SharedValue<number> {
  const value = useSharedValue(0);
  useEffect(() => {
    value.set(withDelay(delay, withTiming(target, { duration: durations.chart, easing: easeOut })));
  }, [value, target, delay]);
  return value;
}
