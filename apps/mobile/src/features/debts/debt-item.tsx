import { StyleSheet, View } from "react-native";
import Animated, { FadeIn, FadeOut, LinearTransition } from "react-native-reanimated";

import type { DebtDetails } from "@masrufi/contracts/api/responses";
import { formatMoney } from "@masrufi/core/money";
import { dueLabel } from "@masrufi/core/plans";

import { useOpenSheet } from "@/features/sheets/open-sheet";
import { PressableScale } from "@/motion/pressable-scale";
import { durations } from "@/motion/tokens";
import { radius, spacing, useColors } from "@/theme/theme";
import { Text } from "@/ui/text";

function describe({ state, paid, note }: DebtDetails): string {
  if (state.settled) return "مسدّد";
  const due = state.dueIn === null ? null : dueLabel(state.dueIn);
  const progress = paid > 0 ? `سُدّد ${Math.round(state.ratio * 100)}%` : note;
  return [due, progress].filter(Boolean).join(" · ");
}

export function DebtItem({ debt }: { debt: DebtDetails }) {
  const colors = useColors();
  const open = useOpenSheet();
  const { id, person, direction, amount, currency, state } = debt;
  const tone = state.settled ? "muted" : direction === "lent" ? "positive" : "negative";
  return (
    <Animated.View entering={FadeIn.duration(durations.normal)} exiting={FadeOut.duration(durations.fast)} layout={LinearTransition.duration(durations.normal)}>
      <PressableScale accessibilityRole="button" to={0.98} onPress={() => open("debt", { id })} style={styles.row}>
        <View style={[styles.initial, { backgroundColor: colors.fill }]}>
          <Text variant="heading">{person.slice(0, 1)}</Text>
        </View>
        <View style={styles.texts}>
          <Text variant="strong" numberOfLines={1}>{person}</Text>
          <Text variant="small" color={state.overdue ? "warning" : "muted"} numberOfLines={1}>{describe(debt)}</Text>
        </View>
        <Text variant="strong" color={tone} style={state.settled ? styles.settled : undefined}>
          {formatMoney(state.settled ? amount : state.remaining, currency)}
        </Text>
      </PressableScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.sm },
  initial: { width: 42, height: 42, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  texts: { flex: 1 },
  settled: { textDecorationLine: "line-through" },
});
