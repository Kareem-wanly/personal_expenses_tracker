import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { spacing } from "@/theme/theme";
import { Screen } from "@/ui/screen";
import { Text } from "@/ui/text";

type Props = { title: string; hint: string; error?: string; children: ReactNode };

/** The frame shared by the screens shown before signing in. */
export function AuthPage({ title, hint, error, children }: Props) {
  return (
    <Screen>
      <View style={styles.page}>
        <View>
          <Text variant="title" accessibilityRole="header">{title}</Text>
          <Text color="muted">{hint}</Text>
        </View>
        {children}
        {error ? <Text color="negative" accessibilityRole="alert">{error}</Text> : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, justifyContent: "center", gap: spacing.lg, maxWidth: 420, width: "100%", alignSelf: "center" },
});
