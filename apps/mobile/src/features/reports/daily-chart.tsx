import { StyleSheet, View } from "react-native";

import type { DayTotal } from "@masrufi/contracts/api/responses";
import { formatShortDate } from "@masrufi/core/dates";
import { formatMoney } from "@masrufi/core/money";

import { useColors } from "@/theme/theme";
import { Card } from "@/ui/card";
import { Text } from "@/ui/text";

type Props = { days: DayTotal[]; currency: string };

const HEIGHT = 90;

/** One bar per day; the highest day is named below. */
export function DailyChart({ days, currency }: Props) {
  const colors = useColors();
  const highest = days.reduce((best, day) => (day.total > best.total ? day : best));
  const height = (total: number) => (total === 0 ? 1 : Math.max(3, Math.round((total / highest.total) * HEIGHT)));

  return (
    <Card>
      <View style={styles.chart} accessibilityLabel="الصرف في كل يوم من الشهر">
        {days.map((day) => (
          <View
            key={day.date}
            style={[
              styles.bar,
              { height: height(day.total), backgroundColor: day === highest ? colors.accent : colors.ink },
            ]}
          />
        ))}
      </View>
      <View style={styles.labels}>
        <Text variant="small" color="muted">1</Text>
        <Text variant="small" color="muted">{days.length}</Text>
      </View>
      {highest.total > 0 ? (
        <Text variant="small" color="muted">
          أعلى يوم: {formatShortDate(highest.date)}، {formatMoney(highest.total, currency)}
        </Text>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  chart: { height: HEIGHT, flexDirection: "row", alignItems: "flex-end", gap: 2 },
  bar: { flex: 1, borderTopLeftRadius: 2, borderTopRightRadius: 2 },
  labels: { flexDirection: "row", justifyContent: "space-between" },
});
