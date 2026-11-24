import { useState } from "react";
import { type GestureResponderEvent, Pressable, StyleSheet, View } from "react-native";
import Animated, { FadeIn, useAnimatedProps, withSpring } from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";

import type { CategoryTotal } from "@masrufi/contracts/api/responses";
import { formatMoney, formatPercent } from "@masrufi/core/money";

import { haptics } from "@/motion/haptics";
import { durations, springs } from "@/motion/tokens";
import { useGrow } from "@/motion/use-grow";
import { radius, spacing, useColors } from "@/theme/theme";
import { Card } from "@/ui/card";
import { Text } from "@/ui/text";

import { type Arc, arcsOf, sliceAt } from "./arcs";

const SIZE = 220;
const THICKNESS = 26;
const RADIUS = (SIZE - THICKNESS) / 2 - 4;
const RING = { size: SIZE, inner: RADIUS - THICKNESS };
const LENGTH = 2 * Math.PI * RADIUS;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Props = { totals: CategoryTotal[]; total: number; currency: string };

/** The ring draws itself; tapping a color (or its dot) shows that category in the middle. */
export function CategoryDonut({ totals, total, currency }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const arcs = arcsOf(totals.map((category) => category.total));
  const drawn = useGrow(1, 150);
  const category = selected === null ? undefined : totals[selected];
  const toggle = (index: number) => {
    haptics.tap();
    setSelected(index === selected ? null : index);
  };

  const touch = ({ nativeEvent }: GestureResponderEvent) => {
    const index = sliceAt(nativeEvent.locationX, nativeEvent.locationY, RING, arcs);
    if (index !== null) toggle(index);
  };

  return (
    <Card style={styles.card}>
      <Pressable accessible={false} onPress={touch} style={styles.chart}>
        <Svg width={SIZE} height={SIZE} style={styles.ring}>
          {arcs.map((arc, index) => (
            <Slice
              key={index}
              arc={arc}
              color={totals[index].color}
              drawn={drawn}
              active={selected === index}
              dimmed={selected !== null && selected !== index}
            />
          ))}
        </Svg>
        <Animated.View key={selected ?? "all"} entering={FadeIn.duration(durations.normal)} style={styles.center}>
          <Text variant="small" color="muted">{category ? `${category.icon} ${category.name}` : "الإجمالي"}</Text>
          <Text variant="heading" numberOfLines={1} adjustsFontSizeToFit>
            {formatMoney(category?.total ?? total, currency)}
          </Text>
          {category ? <Text variant="small" color="muted">{formatPercent(category.total / total)}</Text> : null}
        </Animated.View>
      </Pressable>
      <Legend totals={totals} selected={selected} onPress={toggle} />
    </Card>
  );
}

type SliceProps = {
  arc: Arc;
  color: string;
  drawn: ReturnType<typeof useGrow>;
  active: boolean;
  dimmed: boolean;
};

function Slice({ arc, color, drawn, active, dimmed }: SliceProps) {
  const animatedProps = useAnimatedProps(() => {
    const visible = Math.max(0, Math.min(arc.length, drawn.value - arc.start));
    return {
      strokeDasharray: [visible * LENGTH, LENGTH],
      strokeWidth: withSpring(active ? THICKNESS + 8 : THICKNESS, springs.snappy),
      strokeOpacity: withSpring(dimmed ? 0.35 : 1, springs.gentle),
    };
  });
  return (
    <AnimatedCircle
      animatedProps={animatedProps}
      cx={SIZE / 2}
      cy={SIZE / 2}
      r={RADIUS}
      fill="none"
      stroke={color}
      strokeDashoffset={-arc.start * LENGTH}
    />
  );
}

type LegendProps = { totals: CategoryTotal[]; selected: number | null; onPress: (index: number) => void };

function Legend({ totals, selected, onPress }: LegendProps) {
  const colors = useColors();
  return (
    <View style={styles.legend}>
      {totals.map(({ categoryId, color, name }, index) => (
        <Pressable
          key={categoryId ?? "none"}
          accessibilityRole="button"
          accessibilityState={{ selected: selected === index }}
          onPress={() => onPress(index)}
          style={[styles.item, selected === index && { backgroundColor: colors.fill }]}
        >
          <View style={[styles.dot, { backgroundColor: color }]} />
          <Text variant="small">{name}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: "center" },
  chart: { width: SIZE, height: SIZE, alignItems: "center", justifyContent: "center" },
  ring: { position: "absolute", transform: [{ rotate: "-90deg" }] },
  center: { width: SIZE * 0.58, alignItems: "center", pointerEvents: "none" },
  legend: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: spacing.xs },
  item: { flexDirection: "row", alignItems: "center", gap: spacing.xs, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.full },
  dot: { width: 10, height: 10, borderRadius: 5 },
});
