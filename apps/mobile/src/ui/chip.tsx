import { StyleSheet } from "react-native";
import Animated, { LinearTransition, useAnimatedStyle, withTiming } from "react-native-reanimated";

import { PressableScale } from "@/motion/pressable-scale";
import { durations } from "@/motion/tokens";
import { radius, spacing, useColors } from "@/theme/theme";

import { Text } from "./text";

type Props = { label: string; selected: boolean; onPress: () => void };

export function Chip({ label, selected, onPress }: Props) {
  const colors = useColors();
  const background = selected ? colors.ink : colors.card;
  const animated = useAnimatedStyle(() => ({
    backgroundColor: withTiming(background, { duration: durations.fast }),
  }));
  return (
    <PressableScale
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      aria-checked={selected}
      onPress={onPress}
      to={0.93}
    >
      <Animated.View
        layout={LinearTransition.duration(durations.fast)}
        style={[styles.chip, { borderColor: colors.hairline }, animated]}
      >
        <Text color={selected ? "onInk" : "text"} style={styles.label}>{label}</Text>
      </Animated.View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  chip: { minHeight: 38, justifyContent: "center", paddingHorizontal: spacing.md, borderWidth: 1, borderRadius: radius.full },
  label: { fontSize: 14 },
});
