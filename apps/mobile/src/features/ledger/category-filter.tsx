import { ScrollView, StyleSheet } from "react-native";

import type { Category } from "@masrufi/contracts/api/responses";

import { spacing } from "@/theme/theme";
import { Chip } from "@/ui/chip";

type Props = { categories: Category[]; value: string; onChange: (id: string) => void };

export function CategoryFilter({ categories, value, onChange }: Props) {
  const options = [
    { id: "", label: "الكل" },
    ...categories.map(({ id, icon, name }) => ({ id, label: `${icon} ${name}` })),
    { id: "none", label: "غير مصنّف" },
  ];
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {options.map(({ id, label }) => (
        <Chip key={id} label={label} selected={id === value} onPress={() => onChange(id)} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({ row: { gap: spacing.sm } });
