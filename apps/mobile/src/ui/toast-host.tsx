import { StyleSheet, View } from "react-native";
import Animated, { FadeOutUp, SlideInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PressableScale } from "@/motion/pressable-scale";
import { springs } from "@/motion/tokens";
import { radius, spacing, useColors } from "@/theme/theme";

import { Text } from "./text";
import { hideToast, useToast } from "./toast-store";

/** Drops in from the top, above everything. */
export function ToastHost() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  if (!toast) return null;
  const { id, text, tone, action } = toast;

  return (
    <View style={[styles.host, { top: insets.top + spacing.sm }]}>
      <Animated.View
        key={id}
        accessibilityRole="alert"
        entering={SlideInUp.springify().stiffness(springs.gentle.stiffness).damping(springs.gentle.damping)}
        exiting={FadeOutUp}
        style={[styles.toast, { backgroundColor: tone === "error" ? colors.negative : colors.ink }]}
      >
        <Text color="onInk" style={styles.text}>{text}</Text>
        {action ? (
          <PressableScale
            accessibilityRole="button"
            onPress={() => {
              hideToast();
              action.run();
            }}
          >
            <Text variant="strong" color="onInk" style={styles.action}>{action.label}</Text>
          </PressableScale>
        ) : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: { position: "absolute", start: spacing.lg, end: spacing.lg, alignItems: "center", pointerEvents: "box-none" },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    maxWidth: 480,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
  },
  text: { flexShrink: 1 },
  action: { textDecorationLine: "underline" },
});
