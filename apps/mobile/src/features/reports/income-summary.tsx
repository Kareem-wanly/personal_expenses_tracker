import { StyleSheet, View } from "react-native";

import type { Report } from "@masrufi/contracts/api/responses";
import { formatShortDate } from "@masrufi/core/dates";
import { formatMoney, formatPercent } from "@masrufi/core/money";

import { EntryItem } from "@/features/ledger/entry-item";
import { Reveal } from "@/motion/reveal";
import type { Colors } from "@/theme/colors";
import { spacing } from "@/theme/theme";
import { Card } from "@/ui/card";
import { Section } from "@/ui/section";
import { Text } from "@/ui/text";

export function IncomeSummary({ report, currency }: { report: Report; currency: string }) {
  const { incomes, earned, net } = report;
  return (
    <Reveal index={1}>
      <Section title="الدخل والادخار">
        {incomes.length === 0 ? (
          <Card>
            <Text color="muted">لا دخل مسجّل لهذا الشهر. أضفه لتعرف صافي الشهر ونسبة الادخار.</Text>
          </Card>
        ) : (
          <>
            <Card style={styles.figures}>
              <Figure label="الدخل" value={formatMoney(earned, currency)} color="positive" />
              <Figure label="الصافي" value={formatMoney(net, currency)} color={net < 0 ? "negative" : "text"} />
              <Figure label="نسبة الادخار" value={net >= 0 ? formatPercent(net / earned) : "—"} />
            </Card>
            <Card>
              {incomes.map((item) => (
                <EntryItem key={item.id} entry={{ kind: "income", item }} currency={currency} meta={formatShortDate(item.date)} />
              ))}
            </Card>
          </>
        )}
      </Section>
    </Reveal>
  );
}

type FigureProps = { label: string; value: string; color?: keyof Colors };

function Figure({ label, value, color }: FigureProps) {
  return (
    <View style={styles.figure}>
      <Text variant="small" color="muted">{label}</Text>
      <Text variant="strong" color={color} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  figures: { flexDirection: "row", gap: spacing.sm },
  figure: { flex: 1, alignItems: "center" },
});
