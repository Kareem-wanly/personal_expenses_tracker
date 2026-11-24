import { StyleSheet, View } from "react-native";

import { useColors } from "@/theme/theme";

type Props = { ratio: number; color?: string; /** Where spending "should" be by now, 0–1. */ pace?: number };

export function Meter({ ratio, color, pace }: Props) {
  const colors = useColors();
  const percent = Math.round(Math.min(1, Math.max(0, ratio)) * 100);
  const fill = color ?? (ratio > 1 ? colors.negative : colors.ink);
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: percent }}
      style={[styles.track, { backgroundColor: colors.fill }]}
    >
      <View style={[styles.fill, { width: `${percent}%`, backgroundColor: fill }]} />
      {pace !== undefined ? (
        <View style={[styles.notch, { start: `${pace * 100}%`, backgroundColor: colors.accent }]} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 6, borderRadius: 3 },
  fill: { height: 6, borderRadius: 3 },
  notch: { position: "absolute", top: -4, width: 2, height: 14 },
});
