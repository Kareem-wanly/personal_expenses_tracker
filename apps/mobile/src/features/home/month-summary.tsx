import { StyleSheet, View } from "react-native";

import type { Dashboard } from "@masrufi/contracts/api/responses";
import { formatMonthLabel } from "@masrufi/core/dates";
import { formatMoney } from "@masrufi/core/money";

import { spacing } from "@/theme/theme";
import { AnimatedMoney } from "@/ui/animated-money";
import { Meter } from "@/ui/meter";
import { Text } from "@/ui/text";

type Props = { dashboard: Dashboard; budget: number | null; currency: string };

export function MonthSummary({ dashboard, budget, currency }: Props) {
  const { month, spent, daysLeft, pace } = dashboard;
  return (
    <View style={styles.block}>
      <View style={styles.row}>
        <Text color="muted">{formatMonthLabel(month)}</Text>
        <Text variant="small" color="muted">
          {daysLeft === 0 ? "آخر يوم في الشهر" : `باقي من الشهر: ${daysLeft} يوم`}
        </Text>
      </View>
      <AnimatedMoney value={spent} currency={currency} />
      <Text color="muted">صرفت هذا الشهر</Text>
      {budget ? <Budget spent={spent} budget={budget} pace={pace} currency={currency} /> : null}
    </View>
  );
}

type BudgetProps = { spent: number; budget: number; pace: number; currency: string };

function Budget({ spent, budget, pace, currency }: BudgetProps) {
  const over = spent > budget;
  const difference = formatMoney(Math.abs(budget - spent), currency);
  return (
    <View style={styles.block}>
      <Meter ratio={spent / budget} pace={pace} ticks delay={250} />
      <View style={styles.row}>
        <Text variant="small" color={over ? "negative" : "muted"}>
          {over ? `تجاوزت الميزانية بـ ${difference}` : `متبقّي ${difference} من ${formatMoney(budget, currency)}`}
        </Text>
        <Text variant="small">{Math.round((spent / budget) * 100)}%</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: spacing.xs },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
});
