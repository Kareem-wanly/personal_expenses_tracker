import { StyleSheet, View } from "react-native";

import { type Colors } from "@/theme/colors";
import { spacing, useStyles } from "@/theme/theme";

import { Text } from "./text";

export type LedgerRow = { label: string; value: string; color?: keyof Colors; hint?: string };

/** A label and a figure joined by dots, like a printed ledger. */
export function LedgerRows({ rows }: { rows: LedgerRow[] }) {
  const styles = useStyles(createStyles);
  return (
    <View>
      {rows.map((row) => (
        <View key={row.label}>
          <View style={styles.row}>
            <Text color="muted">{row.label}</Text>
            <View style={styles.dots} />
            <Text variant="heading" color={row.color}>{row.value}</Text>
          </View>
          {row.hint ? <Text variant="small" color="muted" style={styles.hint}>{row.hint}</Text> : null}
        </View>
      ))}
    </View>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    row: { flexDirection: "row", alignItems: "baseline", gap: spacing.sm, paddingVertical: 2 },
    dots: { flex: 1, borderBottomWidth: 1, borderStyle: "dotted", borderColor: colors.muted, opacity: 0.5 },
    hint: { alignSelf: "flex-end" },
  });
