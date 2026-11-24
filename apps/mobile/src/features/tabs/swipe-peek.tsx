import { StyleSheet } from "react-native";
import Animated, { type SharedValue, interpolate, useAnimatedStyle } from "react-native-reanimated";

import { useColors } from "@/theme/theme";
import { Icon } from "@/ui/icon";
import { Text } from "@/ui/text";

import { COMMIT_RATIO } from "./swipe";
import { TABS } from "./tab-order";

type Props = { index: number; x: SharedValue<number>; width: number };

/** Names the page being revealed, behind the one that moves away. */
export function SwipePeek({ index, x, width }: Props) {
  const next = TABS.at(index + 1);
  const previous = index > 0 ? TABS[index - 1] : undefined;
  return (
    <>
      {next ? <Hint tab={next} x={x} width={width} side={1} /> : null}
      {previous ? <Hint tab={previous} x={x} width={width} side={-1} /> : null}
    </>
  );
}

type HintProps = { tab: (typeof TABS)[number]; x: SharedValue<number>; width: number; side: 1 | -1 };

function Hint({ tab, x, width, side }: HintProps) {
  const colors = useColors();
  const animated = useAnimatedStyle(() => {
    const progress = Math.min(1, Math.max(0, (x.value * side) / (width * COMMIT_RATIO)));
    return { opacity: progress, transform: [{ scale: interpolate(progress, [0, 1], [0.8, 1]) }] };
  });
  // The next tab lives on the left, which is the end side.
  const place = side === 1 ? styles.atEnd : styles.atStart;
  return (
    <Animated.View style={[styles.hint, place, animated]}>
      <Icon name={tab.icon} color={colors.accent} />
      <Text variant="small" color="accent">{tab.label}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  hint: { position: "absolute", top: "45%", width: 64, alignItems: "center", gap: 4, pointerEvents: "none" },
  atEnd: { end: 12 },
  atStart: { start: 12 },
});
