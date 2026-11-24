import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";

import type { Dashboard } from "@masrufi/contracts/api/responses";
import { formatMoney, formatPercent } from "@masrufi/core/money";

import { useGrow } from "@/motion/use-grow";
import { spacing, useColors } from "@/theme/theme";
import { Button } from "@/ui/button";
import { Card } from "@/ui/card";
import { LedgerRows } from "@/ui/ledger-rows";
import { Text } from "@/ui/text";

type Props = { dashboard: Dashboard; currency: string };

export function BalanceCard({ dashboard, currency }: Props) {
  const router = useRouter();
  const { hasIncome, earned, spent, balance } = dashboard;
  const addIncome = () => router.push({ pathname: "/entry", params: { kind: "income" } });
  const net = earned - spent;

  return (
    <Card>
      <Text variant="heading">الدخل والرصيد</Text>
      {hasIncome ? (
        <>
          {earned > 0 ? <SplitBar spent={spent} earned={earned} /> : null}
          <LedgerRows
            rows={[
              { label: "دخل الشهر", value: formatMoney(earned, currency), color: "positive" },
              { label: "صرفت", value: formatMoney(spent, currency) },
              { label: "صافي الشهر", value: formatMoney(net, currency), color: net < 0 ? "negative" : "text" },
              { label: "الرصيد الكلي", value: formatMoney(balance, currency), color: balance < 0 ? "negative" : "text" },
            ]}
          />
        </>
      ) : (
        <Text color="muted">سجّل راتبك أو أي دخل لتعرف كم وفّرت.</Text>
      )}
      <Button label="أضف دخلاً" kind="plain" onPress={addIncome} />
    </Card>
  );
}

/** How much of the income was spent. */
function SplitBar({ spent, earned }: { spent: number; earned: number }) {
  const colors = useColors();
  const share = Math.min(1, spent / earned);
  const grown = useGrow(share * 100, 200);
  const animated = useAnimatedStyle(() => ({ width: `${grown.value}%` }));
  return (
    <View style={styles.split}>
      <View style={[styles.track, { backgroundColor: `${colors.positive}55` }]}>
        <Animated.View style={[styles.spent, { backgroundColor: colors.ink }, animated]} />
      </View>
      <View style={styles.labels}>
        <Text variant="small" color="muted">مصروف {formatPercent(spent / earned)}</Text>
        {share < 1 ? <Text variant="small" color="muted">مدّخر {formatPercent(1 - share)}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  split: { gap: spacing.xs },
  track: { height: 10, borderRadius: 5, overflow: "hidden" },
  spent: { height: 10 },
  labels: { flexDirection: "row", justifyContent: "space-between" },
});
