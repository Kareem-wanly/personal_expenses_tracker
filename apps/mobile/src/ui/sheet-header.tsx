import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { spacing } from "@/theme/theme";

import { Button } from "./button";
import { Text } from "./text";

type Props = { title: string; closeLabel?: string; onClose: () => void; action?: ReactNode };

export function SheetHeader({ title, closeLabel = "إلغاء", onClose, action }: Props) {
  return (
    <View style={styles.header}>
      <View style={styles.side}>
        <Button label={closeLabel} kind="plain" onPress={onClose} />
      </View>
      <Text variant="heading" accessibilityRole="header" numberOfLines={1} style={styles.title}>{title}</Text>
      <View style={[styles.side, styles.end]}>{action}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", paddingBottom: spacing.xs },
  side: { width: 92, alignItems: "flex-start" },
  end: { alignItems: "flex-end", paddingEnd: spacing.lg },
  title: { flex: 1, textAlign: "center" },
});
