import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import type { Report } from "@masrufi/contracts/api/responses";
import { formatMonthLabel, formatShortMonth } from "@masrufi/core/dates";
import { formatMoney } from "@masrufi/core/money";

import { haptics } from "@/motion/haptics";
import { durations } from "@/motion/tokens";
import { spacing, useColors } from "@/theme/theme";
import { Card } from "@/ui/card";
import { Text } from "@/ui/text";

import { Bar } from "./bar";

const HEIGHT = 130;

type Props = { months: Report["trend"]; viewed: string; currency: string };

/** Spending beside income; tap a month to read it. */
export function TrendChart({ months, viewed, currency }: Props) {
  const colors = useColors();
  const [selected, setSelected] = useState(viewed);
  const highest = Math.max(1, ...months.flatMap(({ total, income }) => [total, income]));
  const height = (value: number) => (value === 0 ? 1 : Math.max(3, (value / highest) * HEIGHT));
  const shown = months.find(({ month }) => month === selected) ?? months[months.length - 1];

  return (
    <Card>
      <Animated.View key={selected} entering={FadeInDown.duration(durations.fast)} style={styles.caption}>
        <Text variant="strong">{formatMonthLabel(shown.month)}</Text>
        <Text variant="small" color="accent">صرف {formatMoney(shown.total, currency)}</Text>
        <Text variant="small" color="positive">دخل {formatMoney(shown.income, currency)}</Text>
      </Animated.View>
      <View style={styles.chart}>
        {months.map(({ month, total, income }, index) => (
          <Pressable
            key={month}
            accessibilityLabel={`${formatShortMonth(month)}: صرف ${formatMoney(total, currency)}، دخل ${formatMoney(income, currency)}`}
            onPress={() => {
              haptics.tap();
              setSelected(month);
            }}
            style={styles.month}
          >
            <View style={styles.bars}>
              <Bar height={height(total)} width={14} color={colors.accent} delay={index * 70} dimmed={month !== selected} />
              <Bar height={height(income)} width={14} color={colors.positive} delay={index * 70 + 60} dimmed={month !== selected} />
            </View>
            <Text variant="small" color={month === selected ? "text" : "muted"}>{formatShortMonth(month)}</Text>
          </Pressable>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  caption: { flexDirection: "row", alignItems: "baseline", gap: spacing.md, flexWrap: "wrap" },
  chart: { flexDirection: "row" },
  month: { flex: 1, alignItems: "center", gap: spacing.xs },
  bars: { height: HEIGHT, flexDirection: "row", alignItems: "flex-end", gap: 3 },
});
