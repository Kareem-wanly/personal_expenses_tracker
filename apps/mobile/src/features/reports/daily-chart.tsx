import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import type { DayTotal } from "@masrufi/contracts/api/responses";
import { formatShortDate } from "@masrufi/core/dates";
import { formatMoney } from "@masrufi/core/money";

import { haptics } from "@/motion/haptics";
import { durations } from "@/motion/tokens";
import { useColors } from "@/theme/theme";
import { Card } from "@/ui/card";
import { Text } from "@/ui/text";

import { Bar } from "./bar";

const HEIGHT = 110;

type Props = { days: DayTotal[]; average: number; currency: string };

/** One bar per day rising in a wave; tap one to read it. The dashed line is the average. */
export function DailyChart({ days, average, currency }: Props) {
  const colors = useColors();
  const highest = days.reduce((best, day) => (day.total > best.total ? day : best));
  const [selected, setSelected] = useState(highest);
  const height = (total: number) => (total === 0 ? 1 : Math.max(3, (total / highest.total) * HEIGHT));

  return (
    <Card>
      <Animated.View key={selected.date} entering={FadeInDown.duration(durations.fast)} style={styles.caption}>
        <Text variant="small" color="muted">{formatShortDate(selected.date)}</Text>
        <Text variant="strong">{formatMoney(selected.total, currency)}</Text>
        <Text variant="small" color="muted" style={styles.average}>المعدّل {formatMoney(average, currency)}</Text>
      </Animated.View>
      <View style={styles.chart}>
        <View style={[styles.line, { bottom: height(average), borderColor: colors.muted }]} />
        {days.map((day, index) => (
          <Pressable
            key={day.date}
            accessibilityLabel={`${formatShortDate(day.date)}: ${formatMoney(day.total, currency)}`}
            onPress={() => {
              haptics.tap();
              setSelected(day);
            }}
            style={styles.day}
          >
            <Bar
              height={height(day.total)}
              width="100%"
              delay={index * 14}
              color={day.date === selected.date ? colors.accent : colors.ink}
              corner={2}
            />
          </Pressable>
        ))}
      </View>
      <View style={styles.labels}>
        <Text variant="small" color="muted">1</Text>
        <Text variant="small" color="muted">{days.length}</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  caption: { flexDirection: "row", alignItems: "baseline", gap: 8 },
  average: { marginStart: "auto" },
  chart: { height: HEIGHT, flexDirection: "row", alignItems: "flex-end", gap: 2 },
  line: { position: "absolute", start: 0, end: 0, borderTopWidth: 1, borderStyle: "dashed", opacity: 0.5 },
  day: { flex: 1, height: HEIGHT, justifyContent: "flex-end" },
  labels: { flexDirection: "row", justifyContent: "space-between" },
});
