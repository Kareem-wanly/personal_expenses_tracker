import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import type { DebtDetails, GoalDetails } from "@masrufi/contracts/api/responses";

import { useDebts, useGoals } from "@/api/queries";
import { PressableScale } from "@/motion/pressable-scale";
import { Skeleton } from "@/motion/skeleton";
import { spacing, useColors } from "@/theme/theme";
import { Card } from "@/ui/card";
import { Meter } from "@/ui/meter";
import { Text } from "@/ui/text";

import { moneyList, summarizeDebts, summarizeGoals } from "./summary";

/** Goals and debts on the home page. */
export function PlanTiles() {
  const router = useRouter();
  const goals = useGoals().data;
  const debts = useDebts().data;
  return (
    <View style={styles.tiles}>
      <Tile title="الأهداف" onPress={() => router.push("/goals")}>
        {goals ? <GoalsTile goals={goals} /> : <Skeleton height={44} />}
      </Tile>
      <Tile title="الديون" onPress={() => router.push("/debts")}>
        {debts ? <DebtsTile debts={debts} /> : <Skeleton height={44} />}
      </Tile>
    </View>
  );
}

function Tile({ title, onPress, children }: { title: string; onPress: () => void; children: ReactNode }) {
  return (
    <PressableScale accessibilityRole="button" accessibilityLabel={title} onPress={onPress} style={styles.tile}>
      <Card style={styles.card}>
        <Text variant="strong">{title}</Text>
        {children}
      </Card>
    </PressableScale>
  );
}

function GoalsTile({ goals }: { goals: GoalDetails[] }) {
  const colors = useColors();
  const { closest } = summarizeGoals(goals);
  if (goals.length === 0) return <Text variant="small" color="muted">ادّخر لسيارة أو سفر</Text>;
  if (!closest) return <Text variant="small" color="positive">كل أهدافك تحقّقت 🎉</Text>;
  const { icon, name, state } = closest;
  return (
    <>
      <Text variant="small" numberOfLines={1}>{icon} {name}</Text>
      <Meter ratio={state.ratio} color={colors.positive} delay={300} />
      <Text variant="heading">{Math.round(state.ratio * 100)}%</Text>
    </>
  );
}

function DebtsTile({ debts }: { debts: DebtDetails[] }) {
  const { owedToMe, iOwe, overdue } = summarizeDebts(debts);
  if (owedToMe.length + iOwe.length === 0) {
    return <Text variant="small" color="muted">لك عند أحد أو عليك؟</Text>;
  }
  return (
    <>
      {owedToMe.length > 0 ? <Text variant="small" color="positive" numberOfLines={1}>لك {moneyList(owedToMe)}</Text> : null}
      {iOwe.length > 0 ? <Text variant="small" color="negative" numberOfLines={1}>عليك {moneyList(iOwe)}</Text> : null}
      {overdue > 0 ? <Text variant="small" color="warning">متأخر: {overdue}</Text> : null}
    </>
  );
}

const styles = StyleSheet.create({
  tiles: { flexDirection: "row", gap: spacing.md },
  tile: { flex: 1 },
  card: { flex: 1, minHeight: 116 },
});
