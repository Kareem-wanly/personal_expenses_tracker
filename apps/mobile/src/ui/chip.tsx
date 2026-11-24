import { Pressable, StyleSheet } from "react-native";

import { radius, spacing, useColors } from "@/theme/theme";

import { Text } from "./text";

type Props = { label: string; selected: boolean; onPress: () => void };

export function Chip({ label, selected, onPress }: Props) {
  const colors = useColors();
  const background = selected ? colors.ink : colors.card;
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      aria-checked={selected}
      onPress={onPress}
      style={[styles.chip, { backgroundColor: background, borderColor: colors.hairline }]}
    >
      <Text color={selected ? "onInk" : "text"} style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: { minHeight: 38, justifyContent: "center", paddingHorizontal: spacing.md, borderWidth: 1, borderRadius: radius.full },
  label: { fontSize: 14 },
});
