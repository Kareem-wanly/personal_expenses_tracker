import { ActivityIndicator, StyleSheet, View } from "react-native";

import { spacing, useColors } from "@/theme/theme";

import { Button } from "./button";
import { Card } from "./card";
import { Text } from "./text";

export function Loading() {
  const colors = useColors();
  return (
    <View style={styles.center} accessibilityLabel="جارٍ التحميل">
      <ActivityIndicator color={colors.muted} size="large" />
    </View>
  );
}

export function Failure({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <Card>
      <Text variant="heading">تعذّر التحميل</Text>
      <Text color="muted">{error.message}</Text>
      <Button label="حاول من جديد" kind="plain" onPress={onRetry} />
    </Card>
  );
}

type EmptyProps = { icon: string; title: string; hint: string };

export function Empty({ icon, title, hint }: EmptyProps) {
  return (
    <View style={styles.center}>
      <Text style={styles.icon}>{icon}</Text>
      <Text variant="heading">{title}</Text>
      <Text color="muted" style={styles.hint}>{hint}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { paddingVertical: spacing.xxl * 2, alignItems: "center", gap: spacing.sm },
  icon: { fontSize: 44, lineHeight: 60 },
  hint: { textAlign: "center" },
});
