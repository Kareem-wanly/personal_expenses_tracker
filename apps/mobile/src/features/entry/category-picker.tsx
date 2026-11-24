import { StyleSheet, View } from "react-native";
import Animated, { ZoomIn, ZoomOut } from "react-native-reanimated";

import type { Category } from "@masrufi/contracts/api/responses";

import { PressableScale } from "@/motion/pressable-scale";
import { springs } from "@/motion/tokens";
import { radius, spacing, useColors } from "@/theme/theme";
import { Icon } from "@/ui/icon";
import { Text } from "@/ui/text";

type Props = { categories: Category[]; value: string | null; onChange: (id: string | null) => void };

/** Tapping the chosen one clears it. */
export function CategoryPicker({ categories, value, onChange }: Props) {
  return (
    <View style={styles.grid}>
      {categories.map((category) => {
        const selected = category.id === value;
        return (
          <CategoryTile
            key={category.id}
            category={category}
            selected={selected}
            onPress={() => onChange(selected ? null : category.id)}
          />
        );
      })}
    </View>
  );
}

type TileProps = { category: Category; selected: boolean; onPress: () => void };

function CategoryTile({ category, selected, onPress }: TileProps) {
  const colors = useColors();
  const { icon, name, color } = category;
  return (
    <PressableScale
      accessibilityRole="radio"
      accessibilityLabel={name}
      accessibilityState={{ checked: selected }}
      aria-checked={selected}
      to={0.88}
      onPress={onPress}
      style={styles.item}
    >
      <View style={[styles.icon, { backgroundColor: `${color}26`, borderColor: selected ? colors.ink : "transparent" }]}>
        <Text style={styles.emoji}>{icon}</Text>
        {selected ? (
          <Animated.View
            entering={ZoomIn.springify().stiffness(springs.pop.stiffness).damping(springs.pop.damping)}
            exiting={ZoomOut.duration(120)}
            style={[styles.check, { backgroundColor: colors.ink, borderColor: colors.background }]}
          >
            <Icon name="check" color={colors.onInk} size={12} />
          </Animated.View>
        ) : null}
      </View>
      <Text variant="small" numberOfLines={1} color={selected ? "text" : "muted"}>{name}</Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", rowGap: spacing.md },
  item: { width: "25%", alignItems: "center", gap: spacing.xs },
  icon: { width: 56, height: 56, borderRadius: radius.lg, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  emoji: { fontSize: 25, lineHeight: 36 },
  check: {
    position: "absolute",
    top: -8,
    end: -8,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
});
