import Animated, { useAnimatedStyle, withTiming } from "react-native-reanimated";

import { durations } from "@/motion/tokens";
import { useGrow } from "@/motion/use-grow";

type Props = { height: number; width: number | "100%"; color: string; delay?: number; dimmed?: boolean; corner?: number };

/** Grows up from the baseline. */
export function Bar({ height, width, color, delay, dimmed = false, corner = 3 }: Props) {
  const grown = useGrow(height, delay);
  const animated = useAnimatedStyle(() => ({
    height: grown.value,
    opacity: withTiming(dimmed ? 0.35 : 1, { duration: durations.fast }),
  }));
  return (
    <Animated.View
      style={[{ width, backgroundColor: color, borderTopLeftRadius: corner, borderTopRightRadius: corner }, animated]}
    />
  );
}
