import type { ReactNode } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { spacing, useColors } from "@/theme/theme";

type Props = { children: ReactNode; refreshing?: boolean; onRefresh?: () => void };

/** A scrolling page with the app's margins. */
export function Screen({ children, refreshing = false, onRefresh }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.fill}>
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.xxl },
        ]}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.muted} />
          ) : undefined
        }
      >
        {children}
      </ScrollView>
      {/* Content scrolls under the phone's status bar: keep the clock readable. */}
      <View style={[styles.statusBar, { height: insets.top, backgroundColor: colors.background }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  statusBar: { position: "absolute", top: 0, start: 0, end: 0, opacity: 0.94 },
  content: {
    flexGrow: 1,
    width: "100%",
    maxWidth: 640,
    alignSelf: "center",
    paddingHorizontal: spacing.lg,
    gap: spacing.xl,
  },
});
