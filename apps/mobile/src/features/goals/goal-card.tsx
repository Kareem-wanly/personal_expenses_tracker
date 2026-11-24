import { StyleSheet, View } from "react-native";

import type { GoalDetails } from "@masrufi/contracts/api/responses";
import { formatMonthLabel, monthOf } from "@masrufi/core/dates";
import { formatMoney } from "@masrufi/core/money";

import { useOpenSheet } from "@/features/sheets/open-sheet";
import { PressableScale } from "@/motion/pressable-scale";
import type { Colors } from "@/theme/colors";
import { radius, spacing, useColors } from "@/theme/theme";
import { Card } from "@/ui/card";
import { Meter } from "@/ui/meter";
import { Text } from "@/ui/text";

function hintOf({ state, deadline, currency }: GoalDetails): { text: string; color: keyof Colors } {
  if (state.achieved) return { text: "🎉 تحقّق الهدف", color: "positive" };
  const left = formatMoney(state.remaining, currency);
  if (state.late) return { text: `مضى الموعد، وبقي ${left}`, color: "warning" };
  if (deadline && state.perMonth !== null) {
    const until = formatMonthLabel(monthOf(deadline));
    return { text: `ادّخر ${formatMoney(state.perMonth, currency)} شهرياً حتى ${until}`, color: "muted" };
  }
  return { text: `بقي ${left}`, color: "muted" };
}

export function GoalCard({ goal }: { goal: GoalDetails }) {
  const colors = useColors();
  const open = useOpenSheet();
  const { id, icon, name, saved, target, currency, state } = goal;
  const hint = hintOf(goal);
  return (
    <PressableScale accessibilityRole="button" accessibilityLabel={name} to={0.98} onPress={() => open("goal", { id })}>
      <Card>
        <View style={styles.row}>
          <View style={[styles.icon, { backgroundColor: colors.fill }]}>
            <Text style={styles.emoji}>{icon}</Text>
          </View>
          <View style={styles.texts}>
            <Text variant="strong" numberOfLines={1}>{name}</Text>
            <Text variant="small" color="muted">{formatMoney(saved, currency)} من {formatMoney(target, currency)}</Text>
          </View>
          <Text variant="heading" color={state.achieved ? "positive" : "text"}>{Math.round(state.ratio * 100)}%</Text>
        </View>
        <GoalMeter goal={goal} />
        <Text variant="small" color={hint.color}>{hint.text}</Text>
      </Card>
    </PressableScale>
  );
}

/** The notch shows where you'd be if saving evenly until the deadline. Saving is never painted as "over". */
export function GoalMeter({ goal }: { goal: GoalDetails }) {
  const colors = useColors();
  return <Meter ratio={goal.state.ratio} color={colors.positive} pace={goal.state.pace ?? undefined} ticks delay={150} />;
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  icon: { width: 46, height: 46, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  emoji: { fontSize: 24, lineHeight: 34 },
  texts: { flex: 1 },
});
