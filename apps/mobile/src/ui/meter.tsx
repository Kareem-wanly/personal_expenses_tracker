import { StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";

import { useGrow } from "@/motion/use-grow";
import { useColors } from "@/theme/theme";

const TICKS = [25, 50, 75];

type Props = {
  ratio: number;
  color?: string;
  /** Where spending "should" be by now, 0–1. */
  pace?: number;
  ticks?: boolean;
  delay?: number;
};

/** A ruled bar that fills up: amber near the limit, red past it. */
export function Meter({ ratio, color, pace, ticks = false, delay }: Props) {
  const colors = useColors();
  const percent = Math.round(Math.min(1, Math.max(0, ratio)) * 100);
  const grown = useGrow(percent, delay);
  const animated = useAnimatedStyle(() => ({ width: `${grown.value}%` }));
  const tone = ratio > 1 ? colors.negative : ratio >= 0.8 ? colors.warning : colors.ink;
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: percent }}
      style={[styles.track, { backgroundColor: colors.fill }]}
    >
      <Animated.View style={[styles.fill, { backgroundColor: color ?? tone }, animated]} />
      {ticks
        ? TICKS.map((tick) => (
            <View key={tick} style={[styles.tick, { start: `${tick}%`, backgroundColor: colors.muted }]} />
          ))
        : null}
      {pace !== undefined ? (
        <View style={[styles.notch, { start: `${pace * 100}%`, backgroundColor: colors.accent }]} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 6, borderRadius: 3 },
  fill: { height: 6, borderRadius: 3 },
  tick: { position: "absolute", top: -1, width: 1, height: 8, opacity: 0.4 },
  notch: { position: "absolute", top: -4, width: 2, height: 14, borderRadius: 1 },
});
