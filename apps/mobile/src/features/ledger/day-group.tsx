import { StyleSheet, View } from "react-native";

import { formatDayLabel } from "@masrufi/core/dates";
import { formatMoney } from "@masrufi/core/money";

import { spacing } from "@/theme/theme";
import { Card } from "@/ui/card";
import { Text } from "@/ui/text";

import type { LedgerEntry } from "./entry";
import { EntryItem } from "./entry-item";

type Props = { date: string; today: string; total: number; currency: string; entries: LedgerEntry[] };

export function DayGroup({ date, today, total, currency, entries }: Props) {
  return (
    <View style={styles.group}>
      <View style={styles.header}>
        <Text variant="small" color="muted">{formatDayLabel(date, today)}</Text>
        <Text variant="small" color="muted">{formatMoney(total, currency)}</Text>
      </View>
      <Card>
        {entries.map((entry) => (
          <EntryItem key={entry.item.id} entry={entry} currency={currency} />
        ))}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing.xs },
  header: { flexDirection: "row", justifyContent: "space-between" },
});
