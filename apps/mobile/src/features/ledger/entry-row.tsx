import { StyleSheet, View } from "react-native";

import { formatMoney } from "@masrufi/core/money";

import { radius, spacing } from "@/theme/theme";
import { Text } from "@/ui/text";

import { type LedgerEntry, describeEntry } from "./entry";

type Props = { entry: LedgerEntry; currency: string; meta?: string };

/** What a line shows; shared by the list and the lifted copy in the menu. */
export function EntryRow({ entry, currency, meta }: Props) {
  const { title, subtitle, icon, color } = describeEntry(entry);
  const { amount, originalAmount, originalCurrency, recurringId } = entry.item;
  const income = entry.kind === "income";
  return (
    <View style={styles.row}>
      <View style={[styles.icon, { backgroundColor: `${color}26` }]}>
        <Text style={styles.emoji}>{icon}</Text>
      </View>
      <View style={styles.texts}>
        <Text variant="strong" numberOfLines={1}>{title}</Text>
        <Text variant="small" color="muted" numberOfLines={1}>
          {[subtitle, meta, recurringId ? "متكرر" : ""].filter(Boolean).join(" · ")}
        </Text>
      </View>
      <View style={styles.amounts}>
        <Text variant="strong" color={income ? "positive" : "text"}>
          {formatMoney(income ? amount : -amount, currency)}
        </Text>
        {originalAmount !== null && originalCurrency ? (
          <Text variant="small" color="muted">{formatMoney(originalAmount, originalCurrency)}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.sm },
  icon: { width: 42, height: 42, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  emoji: { fontSize: 20, lineHeight: 28 },
  texts: { flex: 1 },
  amounts: { alignItems: "flex-end" },
});
