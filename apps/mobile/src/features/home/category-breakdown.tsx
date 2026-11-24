import { StyleSheet, View } from "react-native";

import type { CategoryTotal } from "@masrufi/contracts/api/responses";
import { formatMoney, formatPercent } from "@masrufi/core/money";

import { spacing } from "@/theme/theme";
import { Card } from "@/ui/card";
import { Meter } from "@/ui/meter";
import { Text } from "@/ui/text";

type Props = { totals: CategoryTotal[]; total: number; currency: string };

/** Spending per category; the bar measures its budget when it has one. */
export function CategoryBreakdown({ totals, total, currency }: Props) {
  return (
    <Card>
      {totals.map((category) => (
        <CategoryRow key={category.categoryId ?? "none"} category={category} total={total} currency={currency} />
      ))}
    </Card>
  );
}

type RowProps = { category: CategoryTotal; total: number; currency: string };

function CategoryRow({ category, total, currency }: RowProps) {
  const { budget } = category;
  const share = total > 0 ? category.total / total : 0;
  const over = budget !== null && category.total > budget;
  return (
    <View style={styles.row}>
      <View style={styles.line}>
        <Text style={styles.name} numberOfLines={1}>{category.icon} {category.name}</Text>
        <Text variant="small" color="muted">{formatPercent(share)}</Text>
        <Text variant="strong">{formatMoney(category.total, currency)}</Text>
      </View>
      <Meter ratio={budget ? category.total / budget : share} color={over ? undefined : category.color} />
      {budget ? (
        <Text variant="small" color={over ? "negative" : "muted"}>
          {over ? "تجاوز بـ" : "باقي"} {formatMoney(Math.abs(budget - category.total), currency)}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing.xs, paddingVertical: spacing.xs },
  line: { flexDirection: "row", alignItems: "baseline", gap: spacing.sm },
  name: { flex: 1 },
});
