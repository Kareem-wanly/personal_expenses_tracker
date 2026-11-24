import { ActivityIndicator, StyleSheet } from "react-native";

import { PressableScale } from "@/motion/pressable-scale";
import { radius, useColors } from "@/theme/theme";

import { Text } from "./text";

type Props = {
  label: string;
  onPress: () => void;
  kind?: "primary" | "plain" | "danger";
  busy?: boolean;
  disabled?: boolean;
};

export function Button({ label, onPress, kind = "primary", busy = false, disabled = false }: Props) {
  const colors = useColors();
  const primary = kind === "primary";
  const textColor = primary ? "onInk" : kind === "danger" ? "negative" : "accent";
  const inactive = busy || disabled;

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy }}
      disabled={inactive}
      onPress={onPress}
      style={[styles.button, primary && { backgroundColor: colors.ink }, inactive && styles.dimmed]}
    >
      {busy ? <ActivityIndicator color={colors[textColor]} /> : (
        <Text variant="strong" color={textColor}>{label}</Text>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 50,
    paddingHorizontal: 20,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  dimmed: { opacity: 0.55 },
});
