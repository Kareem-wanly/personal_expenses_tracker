import { StyleSheet, View } from "react-native";

import type { CategoryTotal } from "@masrufi/contracts/api/responses";
import { formatMoney, formatPercent } from "@masrufi/core/money";

import { Reveal } from "@/motion/reveal";
import { radius, spacing } from "@/theme/theme";
import { Card } from "@/ui/card";
import { Meter } from "@/ui/meter";
import { Text } from "@/ui/text";

import { SegmentBar } from "./segment-bar";

type Props = { totals: CategoryTotal[]; total: number; currency: string; limit?: number; bar?: boolean };

/** One bar for the whole month, then a ranked list. */
export function SpendingBreakdown({ totals, total, currency, limit = totals.length, bar = false }: Props) {
  const shown = totals.slice(0, limit);
  return (
    <Card>
      {bar ? <SegmentBar totals={shown} total={total} /> : null}
      {shown.map((category, index) => (
        <Reveal key={category.categoryId ?? "none"} index={index}>
          <CategoryRow category={category} share={total > 0 ? category.total / total : 0} currency={currency} />
        </Reveal>
      ))}
    </Card>
  );
}

type RowProps = { category: CategoryTotal; share: number; currency: string };

function CategoryRow({ category, share, currency }: RowProps) {
  const { icon, name, color, total, budget } = category;
  const over = budget !== null && total > budget;
  return (
    <View style={styles.row}>
      <View style={[styles.icon, { backgroundColor: `${color}26` }]}>
        <Text style={styles.emoji}>{icon}</Text>
      </View>
      <View style={styles.body}>
        <View style={styles.line}>
          <Text style={styles.name} numberOfLines={1}>{name}</Text>
          <Text variant="small" color="muted">{formatPercent(share)}</Text>
          <Text variant="strong">{formatMoney(total, currency)}</Text>
        </View>
        {budget ? (
          <>
            <Meter ratio={total / budget} />
            <Text variant="small" color={over ? "negative" : "muted"}>
              {over ? `تجاوز بـ ${formatMoney(total - budget, currency)}` : `من ${formatMoney(budget, currency)}`}
            </Text>
          </>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.xs },
  icon: { width: 34, height: 34, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  emoji: { fontSize: 16, lineHeight: 24 },
  body: { flex: 1, gap: spacing.xs },
  line: { flexDirection: "row", alignItems: "baseline", gap: spacing.sm },
  name: { flex: 1 },
});
