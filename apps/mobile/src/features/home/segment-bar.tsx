import { StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";

import type { CategoryTotal } from "@masrufi/contracts/api/responses";

import { useGrow } from "@/motion/use-grow";
import { useColors } from "@/theme/theme";

type Props = { totals: CategoryTotal[]; total: number };

/** Proportions at a glance; segments fill one after another. */
export function SegmentBar({ totals, total }: Props) {
  const colors = useColors();
  const rest = total - totals.reduce((sum, category) => sum + category.total, 0);
  const segments = totals.map(({ categoryId, color, total: value }) => ({ id: categoryId ?? "none", color, value }));
  if (rest > 0) segments.push({ id: "rest", color: colors.muted, value: rest });
  return (
    <View accessibilityLabel="توزيع المصاريف حسب التصنيف" style={[styles.bar, { backgroundColor: colors.fill }]}>
      {segments.map(({ id, color, value }, index) => (
        <Segment key={id} color={color} percent={(value / total) * 100} delay={150 + index * 90} />
      ))}
    </View>
  );
}

function Segment({ color, percent, delay }: { color: string; percent: number; delay: number }) {
  const grown = useGrow(percent, delay);
  const animated = useAnimatedStyle(() => ({ width: `${grown.value}%` }));
  return <Animated.View style={[styles.segment, { backgroundColor: color }, animated]} />;
}

const styles = StyleSheet.create({
  bar: { flexDirection: "row", height: 14, borderRadius: 7, overflow: "hidden" },
  segment: { height: 14 },
});
