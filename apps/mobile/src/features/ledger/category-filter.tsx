import { ScrollView, StyleSheet } from "react-native";
import { GestureDetector, useNativeGesture } from "react-native-gesture-handler";

import type { Category } from "@masrufi/contracts/api/responses";

import { useTabSwipe } from "@/features/tabs/swipe-context";
import { spacing } from "@/theme/theme";
import { Chip } from "@/ui/chip";

type Props = { categories: Category[]; value: string; onChange: (id: string) => void };

/** Scrolling the chips must not change the tab. */
export function CategoryFilter({ categories, value, onChange }: Props) {
  const tabSwipe = useTabSwipe();
  const scroll = useNativeGesture(tabSwipe ? { block: tabSwipe } : {});
  const options = [
    { id: "", label: "الكل" },
    ...categories.map(({ id, icon, name }) => ({ id, label: `${icon} ${name}` })),
    { id: "none", label: "غير مصنّف" },
  ];
  return (
    <GestureDetector gesture={scroll}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {options.map(({ id, label }) => (
          <Chip key={id} label={label} selected={id === value} onPress={() => onChange(id)} />
        ))}
      </ScrollView>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({ row: { gap: spacing.sm } });
