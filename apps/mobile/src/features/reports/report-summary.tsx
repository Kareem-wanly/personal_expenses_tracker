import { StyleSheet, View } from "react-native";

import type { Report } from "@masrufi/contracts/api/responses";
import { formatShortDate } from "@masrufi/core/dates";
import { formatMoney, formatNumber, formatPercent } from "@masrufi/core/money";

import { spacing } from "@/theme/theme";
import { AnimatedMoney } from "@/ui/animated-money";
import { Card } from "@/ui/card";
import { LedgerRows } from "@/ui/ledger-rows";
import { Meter } from "@/ui/meter";
import { Text } from "@/ui/text";

function comparison(change: number | null): string {
  if (change === null) return "لا مصاريف في الشهر السابق للمقارنة";
  if (change === 0) return "مثل الشهر السابق";
  return `${change > 0 ? "▲ أكثر" : "▼ أقل"} بـ ${formatPercent(Math.abs(change))} من الشهر السابق`;
}

type Props = { report: Report; budget: number | null; currency: string };

export function ReportSummary({ report, budget, currency }: Props) {
  const { total, change, previousTotal, count, dailyAverage, projected, spendingDays, maxDay } = report;
  const tone = !change ? "muted" : change > 0 ? "negative" : "positive";
  return (
    <View style={styles.block}>
      <View style={styles.headline}>
        <AnimatedMoney value={total} currency={currency} />
        <Text color={tone}>{comparison(change)}</Text>
        {previousTotal > 0 ? (
          <Text variant="small" color="muted">الشهر السابق: {formatMoney(previousTotal, currency)}</Text>
        ) : null}
      </View>
      {budget ? (
        <View style={styles.budget}>
          <Meter ratio={total / budget} ticks delay={200} />
          <Text variant="small" color="muted">
            {formatPercent(total / budget)} من ميزانية {formatMoney(budget, currency)}
          </Text>
        </View>
      ) : null}
      <Card>
        <LedgerRows
          rows={[
            { label: "عدد العمليات", value: formatNumber(count) },
            { label: "المعدّل اليومي", value: formatMoney(dailyAverage, currency) },
            { label: "أيام الصرف", value: `${formatNumber(spendingDays)} يوم` },
            ...(projected === null ? [] : [{ label: "المتوقّع للشهر", value: formatMoney(projected, currency) }]),
            ...(maxDay
              ? [{ label: `أعلى يوم · ${formatShortDate(maxDay.date)}`, value: formatMoney(maxDay.total, currency) }]
              : []),
          ]}
        />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: spacing.md },
  headline: { alignItems: "center" },
  budget: { gap: spacing.xs },
});
