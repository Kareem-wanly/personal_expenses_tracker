import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { spacing } from "@/theme/theme";

import { Text } from "./text";

type Props = { title: string; link?: string; onPressLink?: () => void; children: ReactNode };

export function Section({ title, link, onPressLink, children }: Props) {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text variant="heading" accessibilityRole="header">{title}</Text>
        {link ? (
          <Pressable accessibilityRole="link" onPress={onPressLink} hitSlop={10}>
            <Text color="accent">{link}</Text>
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
});
