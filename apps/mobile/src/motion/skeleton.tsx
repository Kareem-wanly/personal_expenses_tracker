import { useEffect } from "react";
import type { DimensionValue } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";

import { radius, useColors } from "@/theme/theme";

type Props = { height: number; width?: DimensionValue };

/** A breathing placeholder in the shape of what is coming. */
export function Skeleton({ height, width = "100%" }: Props) {
  const colors = useColors();
  const opacity = useSharedValue(1);
  useEffect(() => {
    opacity.set(withRepeat(withTiming(0.45, { duration: 800 }), -1, true));
  }, [opacity]);
  const animated = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View
      style={[{ height, width, borderRadius: radius.lg, backgroundColor: colors.fill }, animated]}
    />
  );
}
