import { useCallback } from "react";
import { useAnimatedStyle, useSharedValue, withSequence, withTiming } from "react-native-reanimated";

import { haptics } from "./haptics";

const STEPS = [-12, 10, -6, 4, 0];

/** "No": shakes what was wrong. */
export function useShake() {
  const x = useSharedValue(0);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  const shake = useCallback(() => {
    haptics.error();
    x.set(withSequence(...STEPS.map((step) => withTiming(step, { duration: 80 }))));
  }, [x]);
  return { shake, style };
}
