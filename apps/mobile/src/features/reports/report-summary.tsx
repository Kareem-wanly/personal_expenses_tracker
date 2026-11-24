import { StyleSheet, View } from "react-native";

import type { Report } from "@masrufi/contracts/api/responses";
import { formatMoney, formatPercent } from "@masrufi/core/money";

import { spacing } from "@/theme/theme";
import { Card } from "@/ui/card";
import { LedgerRows } from "@/ui/ledger-rows";
import { Text } from "@/ui/text";

function comparison(change: number | null): string {
  if (change === null) return "لا مصاريف في الشهر السابق للمقارنة";
  if (change === 0) return "مثل الشهر السابق";
  return `${change > 0 ? "أكثر" : "أقل"} بـ ${formatPercent(Math.abs(change))} من الشهر السابق`;
}

export function ReportSummary({ report, currency }: { report: Report; currency: string }) {
  const { total, change, earned, net, dailyAverage, projected, spendingDays } = report;
  const worse = change !== null && change > 0;
  return (
    <View style={styles.block}>
      <Text variant="figure" adjustsFontSizeToFit numberOfLines={1}>{formatMoney(total, currency)}</Text>
      <Text color={worse ? "warning" : "muted"}>{comparison(change)}</Text>
      <Card>
        <LedgerRows
          rows={[
            { label: "الدخل", value: formatMoney(earned, currency), color: "positive" },
            { label: "الصافي", value: formatMoney(net, currency), color: net < 0 ? "negative" : "text" },
            { label: "المعدّل اليومي", value: formatMoney(dailyAverage, currency) },
            ...(projected === null ? [] : [{ label: "المتوقّع للشهر", value: formatMoney(projected, currency) }]),
            { label: "أيام فيها صرف", value: String(spendingDays) },
          ]}
        />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({ block: { gap: spacing.sm } });
