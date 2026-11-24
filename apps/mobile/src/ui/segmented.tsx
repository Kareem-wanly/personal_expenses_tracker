import { Pressable, StyleSheet, View } from "react-native";

import { type Colors } from "@/theme/colors";
import { radius, useStyles } from "@/theme/theme";

import { Text } from "./text";

type Props<T extends string> = {
  label: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
};

/** Choose one of a few. */
export function Segmented<T extends string>({ label, options, value, onChange }: Props<T>) {
  const styles = useStyles(createStyles);
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} style={styles.track}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            aria-checked={selected}
            onPress={() => onChange(option.value)}
            style={[styles.option, selected && styles.selected]}
          >
            <Text variant={selected ? "strong" : "body"} color={selected ? "text" : "muted"} style={styles.label}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    track: { flexDirection: "row", padding: 3, borderRadius: radius.md, backgroundColor: colors.fill },
    option: { flex: 1, minHeight: 38, alignItems: "center", justifyContent: "center", borderRadius: 9 },
    selected: { backgroundColor: colors.card },
    label: { fontSize: 14 },
  });
