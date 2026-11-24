import { StyleSheet, View } from "react-native";

import type { Report } from "@masrufi/contracts/api/responses";
import { formatShortMonth } from "@masrufi/core/dates";
import { formatMoney } from "@masrufi/core/money";

import { spacing, useColors } from "@/theme/theme";
import { Card } from "@/ui/card";
import { Text } from "@/ui/text";

type Month = Report["trend"][number];
type Props = { months: Month[]; currency: string };

const HEIGHT = 120;

export function TrendChart({ months, currency }: Props) {
  const colors = useColors();
  const highest = Math.max(1, ...months.flatMap(({ total, income }) => [total, income]));
  const bar = (value: number) => Math.max(2, Math.round((value / highest) * HEIGHT));

  return (
    <Card>
      <View style={styles.chart}>
        {months.map(({ month, total, income }) => (
          <View
            key={month}
            accessible
            accessibilityLabel={`${formatShortMonth(month)}: صرف ${formatMoney(total, currency)}، دخل ${formatMoney(income, currency)}`}
            style={styles.month}
          >
            <View style={styles.bars}>
              <View style={[styles.bar, { height: bar(total), backgroundColor: colors.accent }]} />
              <View style={[styles.bar, { height: bar(income), backgroundColor: colors.positive }]} />
            </View>
            <Text variant="small" color="muted">{formatShortMonth(month)}</Text>
          </View>
        ))}
      </View>
      <View style={styles.legend}>
        <Text variant="small" color="accent">■ المصروف</Text>
        <Text variant="small" color="positive">■ الدخل</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  chart: { flexDirection: "row", justifyContent: "space-between" },
  month: { flex: 1, alignItems: "center", gap: spacing.xs },
  bars: { height: HEIGHT, flexDirection: "row", alignItems: "flex-end", gap: 3 },
  bar: { width: 12, borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  legend: { flexDirection: "row", gap: spacing.lg },
});
