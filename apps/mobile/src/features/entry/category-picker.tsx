import { Pressable, StyleSheet, View } from "react-native";

import type { Category } from "@masrufi/contracts/api/responses";

import { radius, spacing, useColors } from "@/theme/theme";
import { Text } from "@/ui/text";

type Props = { categories: Category[]; value: string | null; onChange: (id: string | null) => void };

/** Tapping the chosen one clears it. */
export function CategoryPicker({ categories, value, onChange }: Props) {
  const colors = useColors();
  return (
    <View style={styles.grid}>
      {categories.map(({ id, icon, name, color }) => {
        const selected = id === value;
        return (
          <Pressable
            key={id}
            accessibilityRole="radio"
            accessibilityLabel={name}
            accessibilityState={{ checked: selected }}
            aria-checked={selected}
            onPress={() => onChange(selected ? null : id)}
            style={styles.item}
          >
            <View
              style={[
                styles.icon,
                { backgroundColor: `${color}26`, borderColor: selected ? colors.ink : "transparent" },
              ]}
            >
              <Text style={styles.emoji}>{icon}</Text>
            </View>
            <Text variant="small" numberOfLines={1} color={selected ? "text" : "muted"}>{name}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", rowGap: spacing.md },
  item: { width: "20%", alignItems: "center", gap: spacing.xs },
  icon: { width: 52, height: 52, borderRadius: radius.lg, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  emoji: { fontSize: 24, lineHeight: 34 },
});
