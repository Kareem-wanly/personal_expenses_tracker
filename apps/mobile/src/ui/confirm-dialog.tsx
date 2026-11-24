import { Modal, Pressable, StyleSheet, View } from "react-native";
import Animated, { FadeIn, ZoomIn } from "react-native-reanimated";

import { durations, springs } from "@/motion/tokens";
import { radius, spacing, useColors } from "@/theme/theme";

import { Button } from "./button";
import { Text } from "./text";

type Props = { open: boolean; title: string; confirmLabel: string; onConfirm: () => void; onCancel: () => void };

export function ConfirmDialog({ open, title, confirmLabel, onConfirm, onCancel }: Props) {
  const colors = useColors();
  return (
    <Modal visible={open} transparent animationType="none" onRequestClose={onCancel}>
      <Animated.View entering={FadeIn.duration(durations.fast)} style={styles.backdrop}>
        <Pressable accessibilityLabel="إغلاق" onPress={onCancel} style={StyleSheet.absoluteFill} />
        <Animated.View
          accessibilityRole="alert"
          entering={ZoomIn.springify().stiffness(springs.snappy.stiffness).damping(springs.snappy.damping)}
          style={[styles.dialog, { backgroundColor: colors.card }]}
        >
          <Text variant="heading" style={styles.title}>{title}</Text>
          <View style={styles.buttons}>
            <View style={styles.button}><Button label="إلغاء" kind="plain" onPress={onCancel} /></View>
            <View style={styles.button}><Button label={confirmLabel} kind="danger" onPress={onConfirm} /></View>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl, backgroundColor: "#0008" },
  dialog: { width: "100%", maxWidth: 340, padding: spacing.lg, gap: spacing.md, borderRadius: radius.lg },
  title: { textAlign: "center" },
  buttons: { flexDirection: "row" },
  button: { flex: 1 },
});
